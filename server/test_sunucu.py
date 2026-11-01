"""Sunucu tüketicisinin birim testleri (pytest). Model yerel klasörden: MODEL_DIZIN=model/.

  MODEL_DIZIN=model python -m pytest server -q
"""
import json
import os
from pathlib import Path

import pytest

KOK = Path(__file__).resolve().parent.parent
os.environ.setdefault("MODEL_DIZIN", str(KOK / "model"))

from fastapi.testclient import TestClient  # noqa: E402

import app as sunucu  # noqa: E402

istemci = TestClient(sunucu.app)
PARITE = json.loads((KOK / "tests" / "parite.json").read_text(encoding="utf-8"))


def test_saglik_ve_sha():
    r = istemci.get("/saglik").json()
    assert r["durum"] == "hazir"
    assert r["model_sha256"] == PARITE["model_sha256"]


@pytest.mark.parametrize("ref", PARITE["referanslar"], ids=lambda r: r["id"])
def test_parite_tekil(ref):
    p = istemci.post("/api/v1/tahmin", json={"inputs": ref["girdi"]}).json()["p"]
    assert abs(p - ref["p_python"]) < PARITE["tolerans"]


def test_parite_toplu_ve_kural():
    girdiler = [r["girdi"] for r in PARITE["referanslar"]]
    yanit = istemci.post("/api/v1/tahmin", json={"inputs": girdiler}).json()
    for r, p, d in zip(PARITE["referanslar"], yanit["p"], yanit["nobet_arkadasi"]):
        assert abs(p - r["p_python"]) < PARITE["tolerans"]
        assert d == (r["girdi"]["sahne_no"] >= 2 and p >= 0.5)


@pytest.mark.parametrize("bozuk, neden", [
    ({}, "eksik alanlar"),
    ({**PARITE["referanslar"][0]["girdi"], "giris_suresi_sn": -1}, "aralık dışı"),
    ({**PARITE["referanslar"][0]["girdi"], "seviye_no": "iki"}, "tip"),
    ({**PARITE["referanslar"][0]["girdi"], "ad": "Ayşe"}, "sözleşmede olmayan alan (kişisel veri)"),
])
def test_sozlesme_disi_girdi_reddedilir(bozuk, neden):
    assert istemci.post("/api/v1/tahmin", json={"inputs": bozuk}).status_code == 422, neden


def test_sozlesme_ucu_config_ile_ayni():
    s = istemci.get("/api/v1/sozlesme").json()
    config = json.loads((KOK / "model" / "config.json").read_text(encoding="utf-8"))
    assert [f["name"] for f in s["features"]] == [f["name"] for f in config["features"]]
    assert s["threshold"] == 0.5


def test_hiz_siniri(monkeypatch):
    monkeypatch.setattr(sunucu, "DAKIKA_SINIRI", 3)
    sunucu._istekler.clear()
    g = {"inputs": PARITE["referanslar"][0]["girdi"]}
    kodlar = [istemci.post("/api/v1/tahmin", json=g, headers={"x-forwarded-for": "10.0.0.9"}).status_code for _ in range(4)]
    assert kodlar == [200, 200, 200, 429]
