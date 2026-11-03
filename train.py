"""Nöbet Arkadaşı: eğit → ölç → kapı → ONNX + config.json + model kartı.   (spec §13)

Tek komut:   python train.py
Taslak:      python train.py --taslak     (gerçek veri olmadan; çıktı _out/taslak/, YAYINLANMAZ)

Kapılar (spec §13.4, eşikler eğitimden önce yazıldı) — biri geçmezse betik hata koduyla durur ve
model/ klasörüne hiçbir şey yazılmaz:
  E0  en az 15 tamamlanmış gerçek oturum
  E1  ROC-AUC (oturuma göre gruplanmış 5 katlı CV, tüm veri)      ≥ 0,65  (v2.0.1; ilk eşik 0,70 — spec §13.4)
  E2  aynı CV'nin yalnız gerçek satırlarındaki ROC-AUC           ≥ 0,60
  E3  E1 > taban çizgileri (çoğunluk sınıfı ve yalnız onceki_riskli)
  E4  |p_onnx − p_sklearn| (tüm satırlar)                          ≤ 1e-4
Tekrarlanabilirlik: sabit tohum (13), sabit sürümler (requirements.txt); config.json'da zaman damgası
yok, aynı veriyle aynı ortamda çalıştırılınca config.json bayt bayt aynı çıkar (CI bunu kontrol eder).
"""
import argparse
import hashlib
import json
import shutil
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
import skl2onnx
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

KOK = Path(__file__).resolve().parent
VERI = KOK / "data" / "oturumlar.csv"
SEED = 13
SURUM = "2.0.0"
TAU = 0.50
ESIK = {"E0_gercek_oturum": 15, "E1_auc_cv": 0.65, "E2_auc_cv_gercek": 0.60, "E4_onnx_fark": 1e-4}
HEDEF = "riskli_secim"
OZELLIKLER = [
    # ad, etiket, birim, alt, üst
    ("seviye_no", "Beyan edilen seviye", "0 yeni · 1 biraz · 2 deneyimli", 0, 2),
    ("sahne_no", "Karar sırası", "1–3", 1, 3),
    ("hedef_bu_sahne", "Hedef bu kararın konusu mu", "0/1", 0, 1),
    ("giris_suresi_sn", "Profil seçme süresi", "saniye", 0, 600),
    ("kriz_okuma_sn", "Kriz metninde kalma süresi", "saniye", 0, 600),
    ("onceki_riskli", "Önceki kararlarda B sayısı", "adet", 0, 2),
    ("onceki_ort_karar_sn", "Önceki kararların ortalama süresi", "saniye", 0, 120),
    ("onceki_ipucu", "Önceki kararlarda ipucu görme", "adet", 0, 2),
    ("onceki_tutor", "Önceki kararlarda tutor mesajı", "adet", 0, 20),
    ("onceki_sure_doldu", "Önceki kararlarda süre dolması", "adet", 0, 2),
]
ADLAR = [o[0] for o in OZELLIKLER]


class Log1p(BaseEstimator, TransformerMixin):
    """Girdileri log(1 + x) ölçeğine çevirir (tüm özellikler ≥ 0). ONNX'te Add + Log düğümü olur, böylece
    uygulamanın sözleşmesi (ham saniye ve sayılar) değişmez. Gerekçe: DENEYLER.md, D3."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return np.log1p(np.asarray(X, dtype=np.float32))


def _log1p_onnx_kaydet():
    from onnx import TensorProto
    from skl2onnx import update_registered_converter
    from skl2onnx.common.data_types import FloatTensorType

    def sekil(operator):
        operator.outputs[0].type = FloatTensorType([None, operator.inputs[0].type.shape[1]])

    def cevir(scope, operator, container):
        bir = scope.get_unique_variable_name("bir")
        container.add_initializer(bir, TensorProto.FLOAT, [], [1.0])
        ara = scope.get_unique_variable_name("arti_bir")
        container.add_node("Add", [operator.inputs[0].full_name, bir], ara, name=scope.get_unique_operator_name("Arti1"))
        container.add_node("Log", ara, operator.outputs[0].full_name, name=scope.get_unique_operator_name("Log"))

    update_registered_converter(Log1p, "SePrimerLog1p", sekil, cevir)


_log1p_onnx_kaydet()

# Deney günlüğündeki model aileleri (DENEYLER.md): "lr" = D1–D2, "log_lr" = D3–D6. Yayınlanan: log_lr, sentetik yok (D6).
ADAYLAR = {
    "lr": lambda: Pipeline([("olcek", StandardScaler()), ("lr", LogisticRegression(C=1.0, max_iter=1000, random_state=SEED))]),
    "log_lr": lambda: Pipeline([("log", Log1p()), ("olcek", StandardScaler()),
                            ("lr", LogisticRegression(C=1.0, max_iter=1000, random_state=SEED))]),
}
VARSAYILAN_ADAY = "log_lr"
ADAY = VARSAYILAN_ADAY


def yeni_model() -> Pipeline:
    return ADAYLAR[ADAY]()


def r4(x: float) -> float:
    return float(round(x, 4))


def capraz_dogrulama(df: pd.DataFrame) -> np.ndarray:
    """Oturuma göre gruplanmış, sınıf oranı korunan 5 katlı CV → katman dışı (out-of-fold) olasılıklar."""
    X, y, g = df[ADLAR].to_numpy(np.float32), df[HEDEF].to_numpy(), df["oturum_id"].to_numpy()
    oof = np.zeros(len(df))
    for egitim, test in StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED).split(X, y, g):
        m = yeni_model().fit(X[egitim], y[egitim])
        oof[test] = m.predict_proba(X[test])[:, 1]
    return oof


def esik_metrikleri(y, p) -> dict:
    tahmin = (p >= TAU).astype(int)
    return {"accuracy": r4(accuracy_score(y, tahmin)), "precision": r4(precision_score(y, tahmin, zero_division=0)),
            "recall": r4(recall_score(y, tahmin, zero_division=0))}


def onnx_aktar(model: Pipeline, X: np.ndarray, hedef_dizin: Path) -> float:
    """Başlangıç reposundaki onnx_aktar ile aynı sözleşme: girdi 'input' float32 [n, f],
    çıktı 'probabilities' [n, 2] (zipmap kapalı) ve 'label'. sklearn ile en büyük farkı döner."""
    import onnxruntime as ort
    from skl2onnx import to_onnx
    from skl2onnx.common.data_types import FloatTensorType

    onx = to_onnx(model, initial_types=[("input", FloatTensorType([None, X.shape[1]]))],
                  options={id(model): {"zipmap": False}}, target_opset=17)
    yol = hedef_dizin / "model.onnx"
    yol.write_bytes(onx.SerializeToString())
    oturum = ort.InferenceSession(str(yol), providers=["CPUExecutionProvider"])
    p_onnx = oturum.run(["probabilities"], {"input": X})[0]
    return float(np.abs(p_onnx - model.predict_proba(X)).max())


def model_karti(c: dict) -> str:
    m, k, v = c["metrics"], c["gates"], c["data"]
    g = m["gercek"] or {"accuracy": "—", "precision": "—", "recall": "—"}
    ozellik = "\n".join(f"| {i + 1} | `{f['name']}` | {f['label']} | {f['unit']} |" for i, f in enumerate(c["features"]))
    kapilar = "\n".join(f"| {ad} | {d['deger']} | {d['esik']} | {'✅' if d['gecti'] else '❌'} |" for ad, d in k.items())
    return f"""---
library_name: sklearn
license: mit
language: tr
tags:
- onnx
- tabular-classification
- education
- sklearn
pipeline_tag: tabular-classification
---

# Nöbet Arkadaşı · SE Primer v{c['version']}

SE Primer, yazılım mühendisliğini telefonda oynatan bir karar kitabıdır (bir hastane randevu
sisteminin çöktüğü sabah; 3 karar: mimari, test, KVKK). Bu model, oyuncunun o ana kadarki
**davranışından** bir sonraki kararda **hızlı ama riskli (B) seçeneğe** gitme olasılığını tahmin eder.
Olasılık **τ = {c['threshold']}** ve üstündeyse oyun yavaşlatır: "Nöbet arkadaşı" kartı bir Sokratik soru
sorar, ipucu açılır, 60 sn'lik sayaç kalkar. Kod: <https://github.com/bgelegen/se-primer>

## Amaç ve kullanım
- **Amaç:** öğrenme oyununda acele eden oyuncuya karar anında düşünme alanı açmak.
- **Kullanıcı:** SE Primer uygulaması (tarayıcıda `onnxruntime-web`), Python referansı (`tests/parite.py`).
- **Kullanılmaması gereken durumlar:** kişiyi değerlendirmek, not vermek, işe alım, gerçek bir nöbet ya
  da klinik/operasyonel karar. Model "bu kişi dikkatsiz" demez; yalnız *bu oyundaki* bir sonraki seçim
  için kaba bir olasılık verir. Oyun dışı hiçbir bağlamda geçerliliği ölçülmedi.

## Model
- `Pipeline(log(1 + x) → StandardScaler → LogisticRegression(C=1))`, tohum {c['seed']} (aday D6, `DENEYLER.md`).
  log dönüşümü ONNX grafiğinin içinde (Add + Log); girdi sözleşmesi ham saniye ve sayılardır.
- Python {c['python_version']} · scikit-learn {c['sklearn_version']} · skl2onnx {c['skl2onnx_version']} · ONNX opset 17
- Girdi `input` float32 `[n, {len(c['features'])}]` (sıra aşağıdaki gibi), çıktı `probabilities` `[n, 2]`
  (sütun 1 = riskli seçim) ve `label`.

| # | Özellik | Anlamı | Birim |
|---|---------|--------|-------|
{ozellik}

Hepsi karar ekranı **açıldığında** bilinen değerlerdir; o kararın süresi ve seçimi girdi değildir.

## Veri
- {v['rows']} karar satırı · **{v['real_sessions']} gerçek** + {v['synthetic_sessions']} sentetik oturum
  (`data/oturumlar.csv`, sözlük: `data/SOZLUK.md`, SHA-256 `{v['sha256'][:16]}…`).
- **Gerçek oturumların hepsini bir YZ ajanı (Claude) oynadı**, insan gibi ve 12 farklı oyuncu bakış açısıyla
  (`data/yz_oyuncular/`). Hocanın 01.11.2026 duyurusu buna izin veriyor; veride `oynayan = yz_ajan`.
  Oturumlar uygulamanın kendi ölçüm koduyla, veri toplama modunda (`?toplama=1`) kaydedildi. Kişisel veri yok.
- Sentetik oturumlar (`tools/sentetik_uret.py`) denemelerde kullanıldı, yayınlanan modelde **kullanılmadı**.
- Riskli seçim oranı: tüm veride {m['pozitif_orani']}, gerçek veride {m['pozitif_orani_gercek']}.

## Ölçüm (oturuma göre gruplanmış 5 katlı çapraz doğrulama)

> **E1 eşiği sonuçlar görüldükten sonra değişti.** İlk eşik 0,70'ti; altı aday denendi, hiçbiri geçmedi.
> Hocanın duyurusundan sonra eşik 0,65'e indirildi (spec §13.4). Aşağıdaki "geçti" ön kayıtlı bir test sonucu
> değildir. Bütün denemeler: [`DENEYLER.md`](https://github.com/bgelegen/se-primer/blob/main/DENEYLER.md).
| Kapı | Değer | Eşik | Sonuç |
|------|-------|------|-------|
{kapilar}

| Metrik (τ = {c['threshold']}) | Tüm veri | Yalnız gerçek |
|------|------|------|
| ROC-AUC | {m['auc_cv']} | {m['auc_cv_gercek'] if m['auc_cv_gercek'] is not None else '—'} |
| Accuracy | {m['tum']['accuracy']} | {g['accuracy']} |
| Precision (riskli) | {m['tum']['precision']} | {g['precision']} |
| Recall (riskli) | {m['tum']['recall']} | {g['recall']} |
| Taban: yalnız `onceki_riskli` AUC | {m['auc_taban_onceki_riskli']} | |

## Sınırlar
- **Hiç insan verisi yok:** {v['real_sessions']} oturumun hepsini bir YZ ajanı oynadı. Model, gerçek insanların
  temposunu değil, bir dil modelinin "insan gibi oynarken" ürettiği tempoyu öğrendi. İnsan oyuncularda
  ölçülmedi; ilk iş gölge modda insan verisi toplamak olmalı (RELEASE.md).
- **Az veri:** {v['real_sessions']} oturum, {v['rows']} karar; AUC'nin güven aralığı geniştir.
- **Niyeti ayıramıyor:** hızlı ama bilerek doğru oynayan ya da okuyup bilerek B'yi deneyen oyuncu, modelin
  "acele = risk" sezgisine ters düşer (DENEYLER.md, tur 2).
- **Geri besleme döngüsü:** model devreye girince oyuncunun davranışı değişir (ipucu açılır, süre kalkar);
  v2 ile toplanan veride `model_mudahale = 1` satırları ayrı değerlendirilmelidir.
- **Açıklık:** model istemciye iner, herkes indirip inceleyebilir; hassas veriyle eğitilmemiştir.
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--taslak", action="store_true", help="gerçek veri olmadan dene (_out/taslak, yayınlanmaz)")
    ap.add_argument("--aday", default=VARSAYILAN_ADAY, choices=sorted(ADAYLAR), help="DENEYLER.md'deki aday")
    ap.add_argument("--yalniz-olc", action="store_true", help="kapıları ölç, hiçbir şey yazma")
    ap.add_argument("--cikti", type=Path, help="model/ yerine bu klasöre yaz (CI tekrarlanabilirlik kontrolü)")
    args = ap.parse_args()
    global ADAY
    ADAY = args.aday
    print(f"aday: {ADAY}")

    df = pd.read_csv(VERI)
    gercek = df["kaynak"] == "gercek"
    n_g, n_s = df.loc[gercek, "oturum_id"].nunique(), df.loc[~gercek, "oturum_id"].nunique()
    y = df[HEDEF].to_numpy()
    print(f"veri: {len(df)} satır · {n_g} gerçek + {n_s} sentetik oturum · riskli oranı {y.mean():.2f}")

    oof = capraz_dogrulama(df)
    auc = roc_auc_score(y, oof)
    auc_g = roc_auc_score(y[gercek], oof[gercek]) if gercek.any() and len(set(y[gercek])) == 2 else float("nan")
    auc_taban = roc_auc_score(y, df["onceki_riskli"])
    metrikler = {
        "auc_cv": r4(auc), "auc_cv_gercek": r4(auc_g) if not np.isnan(auc_g) else None,
        "auc_cv_sentetik": r4(roc_auc_score(y[~gercek], oof[~gercek])) if (~gercek).any() else None,
        "auc_taban_cogunluk": 0.5, "auc_taban_onceki_riskli": r4(auc_taban),
        "tum": esik_metrikleri(y, oof),
        "gercek": esik_metrikleri(y[gercek], oof[gercek]) if gercek.any() else None,
        "pozitif_orani": r4(y.mean()), "pozitif_orani_gercek": r4(y[gercek].mean()) if gercek.any() else None,
    }
    kapilar = {
        "E0_gercek_oturum": {"deger": int(n_g), "esik": f"≥ {ESIK['E0_gercek_oturum']}", "gecti": n_g >= ESIK["E0_gercek_oturum"]},
        "E1_auc_cv": {"deger": r4(auc), "esik": f"≥ {ESIK['E1_auc_cv']}", "gecti": auc >= ESIK["E1_auc_cv"]},
        "E2_auc_cv_gercek": {"deger": metrikler["auc_cv_gercek"], "esik": f"≥ {ESIK['E2_auc_cv_gercek']}",
                             "gecti": bool(not np.isnan(auc_g) and auc_g >= ESIK["E2_auc_cv_gercek"])},
        "E3_taban_ustu": {"deger": r4(auc), "esik": f"> {max(0.5, r4(auc_taban))}", "gecti": auc > max(0.5, auc_taban)},
    }

    # Son model tüm veriyle eğitilir; ONNX'e aktarılır ve sklearn ile karşılaştırılır (E4).
    X = df[ADLAR].to_numpy(np.float32)
    model = yeni_model().fit(X, y)
    gecici = Path(tempfile.mkdtemp())
    fark = onnx_aktar(model, X, gecici)
    kapilar["E4_onnx_fark"] = {"deger": float(f"{fark:.2e}"), "esik": f"≤ {ESIK['E4_onnx_fark']}", "gecti": fark <= ESIK["E4_onnx_fark"]}

    for ad, k in kapilar.items():
        print(f"  {'✓' if k['gecti'] else '✗'} {ad}: {k['deger']} (eşik {k['esik']})")

    if args.yalniz_olc:
        shutil.rmtree(gecici)
        print("(yalnız ölçüm: hiçbir şey yazılmadı)")
        return
    zorunlu = ["E1_auc_cv", "E3_taban_ustu", "E4_onnx_fark"] + ([] if args.taslak else ["E0_gercek_oturum", "E2_auc_cv_gercek"])
    kalan = [ad for ad in zorunlu if not kapilar[ad]["gecti"]]
    if kalan:
        shutil.rmtree(gecici)
        sys.exit(f"✗ KAPI GEÇİLMEDİ ({', '.join(kalan)}): model yayınlanmaz, model/ değişmedi.")

    ornek = df[ADLAR].iloc[0]
    config = {
        "name": "se-primer-nobet-arkadasi",
        "version": SURUM if not args.taslak else SURUM + "-taslak",
        "title": "Nöbet Arkadaşı · SE Primer",
        "description": "Oyuncunun bir sonraki kararda hızlı/riskli (B) seçeneği seçme olasılığı. Yalnız SE Primer öğrenme oyunu içindir.",
        "target": HEDEF,
        "input_name": "input",
        "output_name": "probabilities",
        "features": [{"name": a, "label": e, "unit": b, "min": lo, "max": hi, "example": float(ornek[a])}
                     for a, e, b, lo, hi in OZELLIKLER],
        "classes": [str(c) for c in model.classes_],
        "class_labels": {"0": "güvenli (A)", "1": "riskli (B)"},
        "positive_class": "1",
        "threshold": TAU,
        "input_schema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Nöbet Arkadaşı girdisi",
            "type": "object",
            "required": ADLAR,
            "additionalProperties": False,
            "properties": {a: {"type": "number", "minimum": lo, "maximum": hi, "description": f"{e} ({b})"}
                           for a, e, b, lo, hi in OZELLIKLER},
        },
        "metrics": metrikler,
        "gates": kapilar,
        "data": {"rows": int(len(df)), "real_sessions": int(n_g), "synthetic_sessions": int(n_s),
                 "sha256": hashlib.sha256(VERI.read_bytes()).hexdigest()},
        "seed": SEED,
        "sklearn_version": sklearn.__version__,
        "skl2onnx_version": skl2onnx.__version__,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
        "train_command": "python train.py",
    }
    hedef = args.cikti or KOK / ("_out/taslak" if args.taslak else "model")
    hedef.mkdir(parents=True, exist_ok=True)
    shutil.move(str(gecici / "model.onnx"), hedef / "model.onnx")
    shutil.rmtree(gecici)
    (hedef / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (hedef / "README.md").write_text(model_karti(config), encoding="utf-8")
    print(f"✓ {'TASLAK ' if args.taslak else ''}model → {hedef}/ (model.onnx, config.json, README.md)")


if __name__ == "__main__":
    main()
