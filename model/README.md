---
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

# Nöbet Arkadaşı · SE Primer v2.0.0

SE Primer, yazılım mühendisliğini telefonda oynatan bir karar kitabıdır (bir hastane randevu
sisteminin çöktüğü sabah; 3 karar: mimari, test, KVKK). Bu model, oyuncunun o ana kadarki
**davranışından** bir sonraki kararda **hızlı ama riskli (B) seçeneğe** gitme olasılığını tahmin eder.
Olasılık **τ = 0.5** ve üstündeyse oyun yavaşlatır: "Nöbet arkadaşı" kartı bir Sokratik soru
sorar, ipucu açılır, 60 sn'lik sayaç kalkar. Kod: <https://github.com/bgelegen/se-primer>

## Amaç ve kullanım
- **Amaç:** öğrenme oyununda acele eden oyuncuya karar anında düşünme alanı açmak.
- **Kullanıcı:** SE Primer uygulaması (tarayıcıda `onnxruntime-web`), Python referansı (`tests/parite.py`).
- **Kullanılmaması gereken durumlar:** kişiyi değerlendirmek, not vermek, işe alım, gerçek bir nöbet ya
  da klinik/operasyonel karar. Model "bu kişi dikkatsiz" demez; yalnız *bu oyundaki* bir sonraki seçim
  için kaba bir olasılık verir. Oyun dışı hiçbir bağlamda geçerliliği ölçülmedi.

## Model
- `Pipeline(log(1 + x) → StandardScaler → LogisticRegression(C=1))`, tohum 13 (aday D6, `DENEYLER.md`).
  log dönüşümü ONNX grafiğinin içinde (Add + Log); girdi sözleşmesi ham saniye ve sayılardır.
- Python 3.13 · scikit-learn 1.9.1 · skl2onnx 1.20.0 · ONNX opset 17
- Girdi `input` float32 `[n, 10]` (sıra aşağıdaki gibi), çıktı `probabilities` `[n, 2]`
  (sütun 1 = riskli seçim) ve `label`.

| # | Özellik | Anlamı | Birim |
|---|---------|--------|-------|
| 1 | `seviye_no` | Beyan edilen seviye | 0 yeni · 1 biraz · 2 deneyimli |
| 2 | `sahne_no` | Karar sırası | 1–3 |
| 3 | `hedef_bu_sahne` | Hedef bu kararın konusu mu | 0/1 |
| 4 | `giris_suresi_sn` | Profil seçme süresi | saniye |
| 5 | `kriz_okuma_sn` | Kriz metninde kalma süresi | saniye |
| 6 | `onceki_riskli` | Önceki kararlarda B sayısı | adet |
| 7 | `onceki_ort_karar_sn` | Önceki kararların ortalama süresi | saniye |
| 8 | `onceki_ipucu` | Önceki kararlarda ipucu görme | adet |
| 9 | `onceki_tutor` | Önceki kararlarda tutor mesajı | adet |
| 10 | `onceki_sure_doldu` | Önceki kararlarda süre dolması | adet |

Hepsi karar ekranı **açıldığında** bilinen değerlerdir; o kararın süresi ve seçimi girdi değildir.

## Veri
- 180 karar satırı · **60 gerçek** + 0 sentetik oturum
  (`data/oturumlar.csv`, sözlük: `data/SOZLUK.md`, SHA-256 `dd97ae3162df18ad…`).
- **Gerçek oturumların hepsini bir YZ ajanı (Claude) oynadı**, insan gibi ve 12 farklı oyuncu bakış açısıyla
  (`data/yz_oyuncular/`). Hocanın 01.11.2026 duyurusu buna izin veriyor; veride `oynayan = yz_ajan`.
  Oturumlar uygulamanın kendi ölçüm koduyla, veri toplama modunda (`?toplama=1`) kaydedildi. Kişisel veri yok.
- Sentetik oturumlar (`tools/sentetik_uret.py`) denemelerde kullanıldı, yayınlanan modelde **kullanılmadı**.
- Riskli seçim oranı: tüm veride 0.2833, gerçek veride 0.2833.

## Ölçüm (oturuma göre gruplanmış 5 katlı çapraz doğrulama)

> **E1 eşiği sonuçlar görüldükten sonra değişti.** İlk eşik 0,70'ti; yedi aday denendi, hiçbiri geçmedi.
> Hocanın duyurusundan sonra eşik 0,65'e indirildi (spec §13.4). Aşağıdaki "geçti" ön kayıtlı bir test sonucu
> değildir. Bütün denemeler: [`DENEYLER.md`](https://github.com/bgelegen/se-primer/blob/main/DENEYLER.md).
| Kapı | Değer | Eşik | Sonuç |
|------|-------|------|-------|
| E0_gercek_oturum | 60 | ≥ 15 | ✅ |
| E1_auc_cv | 0.68 | ≥ 0.65 | ✅ |
| E2_auc_cv_gercek | 0.68 | ≥ 0.6 | ✅ |
| E3_taban_ustu | 0.68 | > 0.5146 | ✅ |
| E4_onnx_fark | 1.19e-07 | ≤ 0.0001 | ✅ |

| Metrik (τ = 0.5) | Tüm veri | Yalnız gerçek |
|------|------|------|
| ROC-AUC | 0.68 | 0.68 |
| Accuracy | 0.7333 | 0.7333 |
| Precision (riskli) | 0.5517 | 0.5517 |
| Recall (riskli) | 0.3137 | 0.3137 |
| Taban: yalnız `onceki_riskli` AUC | 0.5146 | |

## Sınırlar
- **Hiç insan verisi yok:** 60 oturumun hepsini bir YZ ajanı oynadı. Model, gerçek insanların
  temposunu değil, bir dil modelinin "insan gibi oynarken" ürettiği tempoyu öğrendi. İnsan oyuncularda
  ölçülmedi; ilk iş gölge modda insan verisi toplamak olmalı (RELEASE.md).
- **Az veri:** 60 oturum, 180 karar; AUC'nin güven aralığı geniştir.
- **Niyeti ayıramıyor:** hızlı ama bilerek doğru oynayan ya da okuyup bilerek B'yi deneyen oyuncu, modelin
  "acele = risk" sezgisine ters düşer (DENEYLER.md, tur 2).
- **Geri besleme döngüsü:** model devreye girince oyuncunun davranışı değişir (ipucu açılır, süre kalkar);
  v2 ile toplanan veride `model_mudahale = 1` satırları ayrı değerlendirilmelidir.
- **Açıklık:** model istemciye iner, herkes indirip inceleyebilir; hassas veriyle eğitilmemiştir.
