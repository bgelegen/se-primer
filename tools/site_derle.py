"""Kanıt sitesini (docs/) üretir.

- docs/oyun.js      : uygulamanın durum makinesi + içeriği (esbuild, tek kaynak)
- docs/data/ozet.json : testler, mutasyon, erişilebilirlik ve tutor değerlendirmesi özetleri

Kullanım (repo kökü): python tools/site_derle.py [--ci-dali]   (--ci-dali: CI sonuçlarını ci-videolar dalından okur)
"""
from __future__ import annotations

import csv
import glob
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

K = Path(__file__).resolve().parents[1]
D = K / "docs" / "data"


def sh(*a: str) -> str:
    return subprocess.run(a, cwd=K, check=True, capture_output=True, text=True).stdout


def junit(paths) -> dict:
    n = f = 0
    for p in paths:
        for tc in ET.parse(p).getroot().iter("testcase"):
            n += 1
            f += tc.find("failure") is not None
    return {"toplam": n, "gecen": n - f}


def eval_ozet(kosu: str) -> dict:
    res = json.loads((K / "eval" / kosu / "sonuclar.json").read_text(encoding="utf-8"))
    p = K / "eval" / kosu / "etiketler.csv"
    lab = {r["id"]: r for r in csv.DictReader(p.open(encoding="utf-8"))} if p.exists() else {}
    ev = lambda v: str(v).strip().lower() in ("evet", "1", "true")  # noqa: E731
    return {
        "n": len(res),
        "ele_verdi": sum(ev(lab[r["id"]]["gosterilen_ele_verdi"]) for r in res if r["id"] in lab),
        "ham_ele_verdi": sum(ev(lab[r["id"]]["ham_ele_verdi"]) for r in res if r["id"] in lab),
        "soruyla": sum(r["gosterilen"].strip().endswith("?") for r in res),
        "kesik": sum("kesik" in lab.get(r["id"], {}).get("ham_hata_turu", "") for r in res),
        "koruma": sum(bool(r.get("guard")) for r in res),
        "ornek": [{"id": r["id"], "metin": r["metin"], "yanit": r["gosterilen"], "guard": bool(r.get("guard"))} for r in res],
    }


def main() -> None:
    sh("npx", "--prefix", "app", "esbuild", "tools/oyun_paketi.ts", "--bundle", "--format=iife",
       "--global-name=SEP", "--minify", "--outfile=docs/oyun.js", "--log-level=error")
    ozet: dict = {}
    birim = sorted(glob.glob(str(K / "tests" / "sonuc" / "junit.xml")))
    ozet["birim"] = junit(birim) if birim else None
    cy = sorted(glob.glob(str(K / "cypress" / "results" / "*.xml")))
    ozet["e2e"] = junit(cy) if cy else None
    axe = sorted(glob.glob(str(K / "cypress" / "results" / "axe-*.json")))
    ozet["axe"] = [json.loads(Path(p).read_text()) for p in axe]
    m = K / "tests" / "sonuc" / "mutasyon.json"
    if m.exists():
        mj = json.loads(m.read_text())
        dosya = {}
        for f, v in mj["files"].items():
            st = [x["status"] for x in v["mutants"]]
            dosya[Path(f).name] = {"oldu": st.count("Killed") + st.count("Timeout"), "yasadi": st.count("Survived"),
                                   "kapsamsiz": st.count("NoCoverage")}
        ozet["mutasyon"] = dosya
    ozet["eval"] = {k: eval_ozet(k) for k in ("v1", "v2", "kirmizi") if (K / "eval" / k / "sonuclar.json").exists()}
    kor = {}
    for ad in ("once", "sonra"):
        p = K / "eval" / "koruma" / f"{ad}.json"
        if p.exists():
            j = json.loads(p.read_text())
            kor[ad] = {k: j[k] for k in ("tp", "fn", "fp", "tn")}
    ozet["koruma"] = kor
    (D / "ozet.json").write_text(json.dumps(ozet, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: (v if k != "eval" else {kk: {x: vv[x] for x in vv if x != 'ornek'} for kk, vv in v.items()}) for k, v in ozet.items()}, ensure_ascii=False)[:1500])


if __name__ == "__main__":
    sys.exit(main())
