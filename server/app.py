"""Nöbet Arkadaşı · sunucu tüketicisi (bonus). FastAPI + onnxruntime.

Üçüncü tüketici: tarayıcı (onnxruntime-web) ve Python Oracle'la aynı model.onnx + config.json sözleşmesini
kullanır, aynı referans girdilerde aynı olasılığı (|Δ| < 1e-4) vermelidir (tests/sunucu_parite.py).

Model kaynağı (başlangıçta bir kez yüklenir):
  MODEL_DIZIN=<klasör>        yerel klasör (test ve CI)
  MODEL_TABAN=<url>           aksi hâlde HF'deki commit'e sabit URL (varsayılan aşağıda)
İndirilen model.onnx'in sha256'sı MODEL_SHA256 ile karşılaştırılır; farklıysa sunucu açılmaz.

Uç noktalar:
  GET  /saglik            durum, sürüm, sha256
  GET  /api/v1/sozlesme   özellik sırası, sınıflar, eşik, JSON şeması
  POST /api/v1/tahmin     {"inputs": {...}} ya da {"inputs": [{...}, ...]}  →  {"p": ..., ...}

Gizlilik: girdiler loglanmaz (KVKK). Tersine mühendislik riskine karşı IP başına dakikada 120 istek sınırı.
"""
import hashlib
import json
import os
import time
import urllib.request
from collections import defaultdict, deque
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from jsonschema import Draft202012Validator

VARSAYILAN_TABAN = "https://huggingface.co/batuhangelegen/se-primer-nobet-arkadasi/resolve/48d21a82f596aea5ad6f4399f99776ebb51bcbf0/"
VARSAYILAN_SHA256 = "e12e66832e3bca3e9e33dab0b66ba43e773086b436bcd30c77604fab1a29c59a"
TAU = 0.5
DAKIKA_SINIRI = int(os.environ.get("DAKIKA_SINIRI", "120"))


def _oku(ad: str) -> bytes:
    dizin = os.environ.get("MODEL_DIZIN")
    if dizin:
        return (Path(dizin) / ad).read_bytes()
    taban = os.environ.get("MODEL_TABAN", VARSAYILAN_TABAN)
    with urllib.request.urlopen(taban + ad, timeout=60) as yanit:
        return yanit.read()


def _yukle():
    onnx = _oku("model.onnx")
    sha = hashlib.sha256(onnx).hexdigest()
    beklenen = os.environ.get("MODEL_SHA256", VARSAYILAN_SHA256)
    if beklenen and sha != beklenen:
        raise RuntimeError(f"model.onnx sha256 beklenenden farklı: {sha[:12]} ≠ {beklenen[:12]}")
    config = json.loads(_oku("config.json"))
    oturum = ort.InferenceSession(onnx, providers=["CPUExecutionProvider"])
    return oturum, config, sha


OTURUM, CONFIG, SHA = _yukle()
ADLAR = [f["name"] for f in CONFIG["features"]]
POZITIF = CONFIG["classes"].index(CONFIG["positive_class"])
DOGRULAYICI = Draft202012Validator(CONFIG["input_schema"])
KAYNAK = "yerel" if os.environ.get("MODEL_DIZIN") else os.environ.get("MODEL_TABAN", VARSAYILAN_TABAN)

app = FastAPI(title="Nöbet Arkadaşı · sunucu tüketicisi", version=CONFIG["version"])
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])
_istekler: dict[str, deque] = defaultdict(deque)


def _sinir(istek: Request):
    ip = (istek.headers.get("x-forwarded-for") or (istek.client.host if istek.client else "?")).split(",")[0].strip()
    simdi, kuyruk = time.monotonic(), _istekler[ip]
    while kuyruk and simdi - kuyruk[0] > 60:
        kuyruk.popleft()
    if len(kuyruk) >= DAKIKA_SINIRI:
        raise HTTPException(429, "Dakikada en fazla %d istek" % DAKIKA_SINIRI)
    kuyruk.append(simdi)


@app.get("/saglik")
def saglik():
    return {"durum": "hazir", "model_version": CONFIG["version"], "model_sha256": SHA, "kaynak": KAYNAK}


@app.get("/api/v1/sozlesme")
def sozlesme():
    return {k: CONFIG[k] for k in ("version", "features", "classes", "class_labels", "positive_class", "threshold", "input_schema")}


@app.post("/api/v1/tahmin")
async def tahmin(istek: Request):
    _sinir(istek)
    try:
        govde = await istek.json()
    except Exception:
        raise HTTPException(400, "Gövde JSON değil")
    girdi = govde.get("inputs") if isinstance(govde, dict) else None
    tekil = isinstance(girdi, dict)
    liste = [girdi] if tekil else girdi
    if not isinstance(liste, list) or not liste or len(liste) > 100:
        raise HTTPException(422, '{"inputs": {...}} ya da 1–100 öğeli {"inputs": [...]} bekleniyor')
    for i, g in enumerate(liste):
        hatalar = sorted(DOGRULAYICI.iter_errors(g), key=lambda e: list(e.path))
        if hatalar:
            raise HTTPException(422, {"satir": i, "hatalar": [f"{'/'.join(map(str, e.path)) or '(kök)'}: {e.message}" for e in hatalar[:5]]})
    X = np.array([[float(g[a]) for a in ADLAR] for g in liste], dtype=np.float32)
    p = OTURUM.run([CONFIG["output_name"]], {CONFIG["input_name"]: X})[0][:, POZITIF].astype(float).tolist()
    # Uygulamadaki kural (spec §13.3): K1 gölge, K2/K3'te p ≥ τ ise Nöbet Arkadaşı devrede
    devrede = [bool(g["sahne_no"] >= 2 and pi >= TAU) for g, pi in zip(liste, p)]
    return {
        "p": p[0] if tekil else p,
        "nobet_arkadasi": devrede[0] if tekil else devrede,
        "esik": TAU,
        "model_version": CONFIG["version"],
        "model_sha256": SHA,
    }
