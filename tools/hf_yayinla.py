"""model/ klasörünü Hugging Face'te public bir model reposuna yükler ve commit'e sabit URL'yi yazar.

Başlangıç reposundaki `hf_cli.py push-model` ile aynı yol (HfApi.create_repo + upload_folder), iki ek
güvenlikle:
  1) Kapıları geçmemiş (config.json → gates) ya da taslak bir model yüklenmez.
  2) tests/parite.json bu modelin sha256'sı için üretilmemişse yüklenmez (Oracle eski kalmasın).
Kimlik: HF_TOKEN ortam değişkeni (GitHub Actions secret'ı). Token repoya ya da loga yazılmaz.

  python tools/hf_yayinla.py [--repo se-primer-nobet-arkadasi]
"""
import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

from huggingface_hub import HfApi

KOK = Path(__file__).resolve().parent.parent
MODEL = KOK / "model"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="se-primer-nobet-arkadasi")
    args = ap.parse_args()

    config = json.loads((MODEL / "config.json").read_text(encoding="utf-8"))
    kalan = [ad for ad, k in config["gates"].items() if not k["gecti"]]
    if kalan or "taslak" in config["version"]:
        sys.exit(f"✗ yüklenmez: kapı geçilmedi {kalan} / sürüm {config['version']}")
    sha = hashlib.sha256((MODEL / "model.onnx").read_bytes()).hexdigest()
    parite = json.loads((KOK / "tests" / "parite.json").read_text(encoding="utf-8"))
    if parite["model_sha256"] != sha:
        sys.exit("✗ yüklenmez: tests/parite.json başka bir model için üretilmiş (python tests/parite.py)")

    api = HfApi(token=os.environ["HF_TOKEN"])
    kullanici = api.whoami()["name"]
    repo = f"{kullanici}/{args.repo}"
    api.create_repo(repo, repo_type="model", private=False, exist_ok=True)
    sonuc = api.upload_folder(
        repo_id=repo, repo_type="model", folder_path=str(MODEL), delete_patterns=["*.md"],
        commit_message=f"Nöbet Arkadaşı v{config['version']} (model.onnx sha256 {sha[:12]})",
        commit_description=f"GitHub: bgelegen/se-primer @ {os.environ.get('GITHUB_SHA', 'yerel')[:7]}",
    )
    commit = sonuc.oid
    taban = f"https://huggingface.co/{repo}/resolve/{commit}/"
    print(f"✓ https://huggingface.co/{repo}")
    print(f"✓ commit {commit}")
    print(f"✓ sabit URL: {taban}model.onnx")
    ozet = os.environ.get("GITHUB_STEP_SUMMARY")
    if ozet:
        with open(ozet, "a", encoding="utf-8") as f:
            f.write(f"## Hugging Face yayını\n\n- Repo: https://huggingface.co/{repo}\n- Commit: `{commit}`\n"
                    f"- Sabit URL: `{taban}model.onnx`\n- model.onnx sha256: `{sha}`\n")
    print(f"::notice title=HF taban::{taban}")


if __name__ == "__main__":
    main()
