"""Diferansiyel test, üçüncü tüketici: sunucu (HTTP) ↔ Python Oracle.   (bonus)

  python tests/sunucu_parite.py http://127.0.0.1:8000
  python tests/sunucu_parite.py https://<servis>.onrender.com      (ücretsiz katman uyuyorsa uyanmasını bekler)
Sonuç tests/sonuc/sunucu-parite.json'a yazılır; |Δ| ≥ 1e-4 ise ya da model farklıysa hata koduyla çıkar.
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
taban = sys.argv[1].rstrip("/")
parite = json.loads((KOK / "tests" / "parite.json").read_text(encoding="utf-8"))


def iste(yol, govde=None, deneme=24):
    for i in range(deneme):  # ücretsiz katmanda soğuk açılış ~1 dk sürebilir
        try:
            veri = json.dumps(govde).encode() if govde is not None else None
            r = urllib.request.Request(taban + yol, data=veri, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(r, timeout=30) as y:
                return json.loads(y.read())
        except Exception as e:  # noqa: BLE001
            if i == deneme - 1:
                raise
            print(f"  … {yol} bekleniyor ({e.__class__.__name__})")
            time.sleep(5)


saglik = iste("/saglik")
print(f"sunucu: {taban} · model {saglik['model_version']} · sha256 {saglik['model_sha256'][:12]}")
hata = 0
if saglik["model_sha256"] != parite["model_sha256"]:
    print(f"✗ sunucudaki model farklı ({saglik['model_sha256'][:12]} ≠ {parite['model_sha256'][:12]})")
    hata += 1
satirlar = []
yanit = iste("/api/v1/tahmin", {"inputs": [r["girdi"] for r in parite["referanslar"]]})
for r, p in zip(parite["referanslar"], yanit["p"]):
    fark = abs(p - r["p_python"])
    satirlar.append({"id": r["id"], "p_python": r["p_python"], "p_sunucu": p, "fark": fark})
    print(f"  {'✓' if fark < parite['tolerans'] else '✗'} {r['id']}: sunucu {p:.8f} · python {r['p_python']:.8f} · fark {fark:.1e}")
    hata += fark >= parite["tolerans"]
cikti = KOK / "tests" / "sonuc" / "sunucu-parite.json"
cikti.parent.mkdir(parents=True, exist_ok=True)
cikti.write_text(json.dumps({"sunucu": taban, "tolerans": parite["tolerans"], "satirlar": satirlar}, indent=1), encoding="utf-8")
sys.exit(1 if hata else 0)
