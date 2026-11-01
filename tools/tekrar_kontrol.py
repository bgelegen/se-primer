"""CI: train.py başka bir ortamda yeniden çalıştırıldığında aynı modeli üretiyor mu?

  python train.py --cikti _out/ci && python tools/tekrar_kontrol.py _out/ci
Karşılaştırılan: config.json'daki metrikler ve kapılar (birebir), veri sha256'sı (birebir) ve iki modelin
tüm veri satırlarındaki olasılıkları (|fark| ≤ 1e-6). model.onnx'in baytları BLAS/işlemci farkıyla son
basamakta değişebileceği için bayt değil davranış karşılaştırılır.
"""
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd

KOK = Path(__file__).resolve().parent.parent
yeni = Path(sys.argv[1])
a = json.loads((KOK / "model" / "config.json").read_text(encoding="utf-8"))
b = json.loads((yeni / "config.json").read_text(encoding="utf-8"))
hata = []
for k in ("metrics", "data", "features", "classes", "threshold"):
    if a[k] != b[k]:
        hata.append(f"config.{k} farklı")
ga = {ad: (g["deger"], g["gecti"]) for ad, g in a["gates"].items() if ad != "E4_onnx_fark"}
gb = {ad: (g["deger"], g["gecti"]) for ad, g in b["gates"].items() if ad != "E4_onnx_fark"}
if ga != gb:
    hata.append("kapılar farklı")
df = pd.read_csv(KOK / "data" / "oturumlar.csv")
X = df[[f["name"] for f in a["features"]]].to_numpy(np.float32)
p = [ort.InferenceSession(str(d / "model.onnx"), providers=["CPUExecutionProvider"]).run(["probabilities"], {"input": X})[0][:, 1]
     for d in (KOK / "model", yeni)]
fark = float(np.abs(p[0] - p[1]).max())
if fark > 1e-6:
    hata.append(f"olasılık farkı {fark:.2e}")
if hata:
    sys.exit("✗ tekrarlanabilirlik: " + "; ".join(hata))
print(f"✓ tekrarlanabilir: metrikler ve kapılar aynı, {len(df)} satırda en büyük olasılık farkı {fark:.1e}")
