"""Gerçek + sentetik satırları birleştirip doğrular → data/oturumlar.csv

Girdi:
  data/gercek/*.csv   uygulamanın "Veri" ekranından indirilen dosyalar (ham, değiştirilmeden saklanır)
  data/sentetik.csv   tools/sentetik_uret.py çıktısı (yalnız --sentetik ile; yayınlanan model kullanmaz)
Kurallar:
  - kaynak = otomasyon olan satırlar (Cypress/Playwright) atılır.
  - Aynı (oturum_id, karar_id) bir kez alınır (aynı dosya iki kez gönderilirse).
  - Yalnız 3 kararı da olan (tamamlanmış) oturumlar alınır.
  - Her sütun sözlükteki (data/SOZLUK.md) aralıkta olmalı; değilse betik durur.
Kullanım:  python tools/veri_hazirla.py
"""
import csv
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "tools"))
from sentetik_uret import SUTUNLAR  # noqa: E402

ARALIK = {
    "seviye_no": (0, 2), "sahne_no": (1, 3), "hedef_bu_sahne": (0, 1), "giris_suresi_sn": (0, 600),
    "kriz_okuma_sn": (0, 600), "onceki_riskli": (0, 2), "onceki_ort_karar_sn": (0, 120), "onceki_ipucu": (0, 2),
    "onceki_tutor": (0, 20), "onceki_sure_doldu": (0, 2), "riskli_secim": (0, 1), "karar_suresi_sn": (0, 600),
    "sure_doldu": (0, 1), "ipucu_bu_sahne": (0, 1), "tutor_bu_sahne": (0, 1000), "model_mudahale": (0, 1),
}


def oku(yol: Path) -> list[dict]:
    with yol.open(encoding="utf-8-sig") as f:
        satirlar = list(csv.DictReader(f))
    eksik = set(SUTUNLAR) - set(satirlar[0].keys()) if satirlar else set()
    if eksik:
        sys.exit(f"✗ {yol.name}: eksik sütun {sorted(eksik)}")
    return satirlar


def dogrula(r: dict, kaynak_adi: str):
    for s, (alt, ust) in ARALIK.items():
        try:
            v = float(r[s])
        except ValueError:
            sys.exit(f"✗ {kaynak_adi} {r['oturum_id']}/{r['karar_id']}: {s}='{r[s]}' sayı değil")
        if not alt <= v <= ust:
            sys.exit(f"✗ {kaynak_adi} {r['oturum_id']}/{r['karar_id']}: {s}={v} aralık dışı [{alt}, {ust}]")
    if r["kaynak"] not in ("gercek", "sentetik"):
        sys.exit(f"✗ {kaynak_adi}: bilinmeyen kaynak '{r['kaynak']}'")
    if (r["kaynak"], r["oynayan"]) not in (("gercek", "insan"), ("gercek", "yz_ajan"), ("sentetik", "kural")):
        sys.exit(f"✗ {kaynak_adi} {r['oturum_id']}: kaynak/oynayan tutarsız ({r['kaynak']}/{r['oynayan']})")
    if r["secim"] not in ("A", "B") or int(r["riskli_secim"]) != (r["secim"] == "B"):
        sys.exit(f"✗ {kaynak_adi} {r['oturum_id']}: secim/riskli_secim tutarsız")


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--sentetik", action="store_true",
                    help="data/sentetik.csv'yi de ekle (denemeler D1–D5; yayınlanan model D6 sentetik kullanmaz)")
    args = ap.parse_args()
    gorulen, tum = set(), []
    atilan_otomasyon = 0
    dosyalar = sorted((KOK / "data" / "gercek").glob("*.csv")) + ([KOK / "data" / "sentetik.csv"] if args.sentetik else [])
    for yol in dosyalar:
        for r in oku(yol):
            if r["kaynak"] == "otomasyon":
                atilan_otomasyon += 1
                continue
            anahtar = (r["oturum_id"], r["karar_id"])
            if anahtar in gorulen:
                continue
            dogrula(r, yol.name)
            gorulen.add(anahtar)
            tum.append({s: r[s] for s in SUTUNLAR})
    say: dict[str, int] = {}
    for r in tum:
        say[r["oturum_id"]] = say.get(r["oturum_id"], 0) + 1
    tam = [r for r in tum if say[r["oturum_id"]] == 3]
    yarim = len({r["oturum_id"] for r in tum}) - len({r["oturum_id"] for r in tam})
    tam.sort(key=lambda r: (r["kaynak"], r["oturum_id"], r["karar_id"]))
    with (KOK / "data" / "oturumlar.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=SUTUNLAR, lineterminator="\n")
        w.writeheader()
        w.writerows(tam)
    g = len({r["oturum_id"] for r in tam if r["kaynak"] == "gercek"})
    yz = len({r["oturum_id"] for r in tam if r["oynayan"] == "yz_ajan"})
    s = len({r["oturum_id"] for r in tam if r["kaynak"] == "sentetik"})
    print(f"✓ data/oturumlar.csv: {len(tam)} satır · {g} gerçek ({g - yz} insan, {yz} YZ ajanı) + {s} sentetik oturum "
          f"(atılan: {atilan_otomasyon} otomasyon satırı, {yarim} yarım oturum)")


if __name__ == "__main__":
    main()
