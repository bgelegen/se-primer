"""Python Oracle (test kahini): aynı model.onnx'i onnxruntime ile çalıştırır.   (spec §13.5 KÖ-9)

Diferansiyel testin "doğru cevap" tarafı budur: uygulama (onnxruntime-web) aynı 5 referans girdide
bu dosyadaki olasılıklardan en fazla 1e-4 sapabilir (cypress/e2e/model.cy.ts).

  python tests/parite.py                 → tests/parite.json'u model/model.onnx ile yeniden üretir
  python tests/parite.py --kontrol       → parite.json, şimdiki modelle 1e-4 içinde mi (değilse hata)
  python tests/parite.py --url <taban>   → modeli bu tabandan indirir (ör. HF commit'e sabit URL),
                                           yereldeki model/model.onnx ile aynı dosya mı diye de bakar
"""
import argparse
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort

KOK = Path(__file__).resolve().parent.parent
JSON = KOK / "tests" / "parite.json"
TOLERANS = 1e-4

# Referans girdiler tek yerde: tests/parite_referanslar.json (Oracle, Vitest ve Cypress aynı dosyayı okur).
# İki kabul örneği (KÖ-7, KÖ-8) ve üç uç/orta durum; değerler uygulamanın ölçtüğü biçimde.
REFERANSLAR = json.loads((KOK / "tests" / "parite_referanslar.json").read_text(encoding="utf-8"))


def model_baytlari(url: str | None, dizin: Path) -> bytes:
    if not url:
        return (dizin / "model.onnx").read_bytes()
    with urllib.request.urlopen(url.rstrip("/") + "/model.onnx", timeout=60) as r:
        return r.read()


def olasiliklar(onnx: bytes, config: dict) -> list[float]:
    adlar = [f["name"] for f in config["features"]]
    oturum = ort.InferenceSession(onnx, providers=["CPUExecutionProvider"])
    X = np.array([[r["girdi"][a] for a in adlar] for r in REFERANSLAR], dtype=np.float32)
    p = oturum.run([config["output_name"]], {config["input_name"]: X})[0]
    k = config["classes"].index(config["positive_class"])
    return [float(x) for x in p[:, k]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kontrol", action="store_true")
    ap.add_argument("--url", help="model tabanı, ör. https://huggingface.co/<k>/<r>/resolve/<commit>/")
    ap.add_argument("--dizin", type=Path, default=KOK / "model", help="yerel model klasörü (varsayılan model/)")
    ap.add_argument("--json", type=Path, default=JSON)
    args = ap.parse_args()

    config = json.loads((args.dizin / "config.json").read_text(encoding="utf-8"))
    onnx = model_baytlari(args.url, args.dizin)
    sha = hashlib.sha256(onnx).hexdigest()
    if args.url:
        yerel = hashlib.sha256((args.dizin / "model.onnx").read_bytes()).hexdigest()
        if sha != yerel:
            sys.exit(f"✗ indirilen model.onnx ({sha[:12]}) repodakiyle ({yerel[:12]}) aynı değil")
        print(f"✓ {args.url} → model.onnx repodakiyle aynı (sha256 {sha[:12]}…)")
    p = olasiliklar(onnx, config)

    if args.kontrol:
        eski = json.loads(args.json.read_text(encoding="utf-8"))
        hata = 0
        for r, pi in zip(eski["referanslar"], p):
            fark = abs(r["p_python"] - pi)
            print(f"  {'✓' if fark < TOLERANS else '✗'} {r['id']}: {pi:.8f} (kayıtlı {r['p_python']:.8f}, fark {fark:.1e})")
            hata += fark >= TOLERANS
        if eski.get("model_sha256") != sha:
            print(f"✗ parite.json başka bir model için üretilmiş ({eski.get('model_sha256', '?')[:12]} ≠ {sha[:12]})")
            hata += 1
        sys.exit(1 if hata else 0)

    cikti = {
        "aciklama": "Python Oracle (onnxruntime) olasılıkları. Uygulama aynı girdilerde |fark| < tolerans vermeli.",
        "model_version": config["version"],
        "model_sha256": sha,
        "tolerans": TOLERANS,
        "pozitif_sinif": config["positive_class"],
        "referanslar": [{**r, "p_python": round(pi, 8)} for r, pi in zip(REFERANSLAR, p)],
    }
    args.json.write_text(json.dumps(cikti, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for r, pi in zip(REFERANSLAR, p):
        print(f"  {r['id']}: p = {pi:.8f}")
    print(f"✓ {args.json} yazıldı (model {config['version']}, sha256 {sha[:12]}…)")


if __name__ == "__main__":
    main()
