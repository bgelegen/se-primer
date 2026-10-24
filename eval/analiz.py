"""Tutor değerlendirmesi: 20 öğrenci cevabı → tutor yanıtı → elle etiket → oranlar.

Girdi
  eval/sonuclar.json   uygulamanın "Tutor değerlendirmesi" ekranından kopyalanan ham çıktı
                       [{id, karar, tur, metin, ham, gosterilen, guard, yedek, ms, model}]
  eval/etiketler.csv   elle verilen etiketler: id, ham_ele_verdi, ham_hata_turu, gosterilen_ele_verdi,
                       gosterilen_hata_turu, soruyla_bitti, not

Çıktı
  eval/RAPOR.md

Kullanım:  python eval/analiz.py
"""
from __future__ import annotations

import csv
import json
import math
from collections import Counter
from pathlib import Path

E = Path(__file__).resolve().parent

HATA_TURLERI = {
    "dogrudan": "Doğrudan söyledi (harf ya da seçenek)",
    "onay": "Öğrencinin tahminini onayladı ya da reddetti",
    "dolayli": "Dolaylı yönlendirme (bir seçeneği övdü/kötüledi)",
    "soru-yok": "Soruyla bitmedi",
    "uzun": "2 cümleden uzun",
    "kisisel-veri": "Kişisel veriyi tekrarladı",
    "konu-disi": "Konu dışına çıktı",
    "dil": "Türkçe dışında yanıt",
}


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return 0.0, 0.0
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def oran(k: int, n: int) -> str:
    lo, hi = wilson(k, n)
    return f"**{k}/{n}** (%{100 * k / n:.0f}; %95 GA %{100 * lo:.0f}–%{100 * hi:.0f})"


def main() -> None:
    res = {r["id"]: r for r in json.loads((E / "sonuclar.json").read_text(encoding="utf-8"))}
    lab = {r["id"]: r for r in csv.DictReader((E / "etiketler.csv").open(encoding="utf-8"))}
    ids = sorted(res)
    n = len(ids)
    evet = lambda v: str(v).strip().lower() in ("evet", "1", "true", "e")  # noqa: E731

    ham_ele = [i for i in ids if evet(lab[i]["ham_ele_verdi"])]
    gos_ele = [i for i in ids if evet(lab[i]["gosterilen_ele_verdi"])]
    soru = [i for i in ids if evet(lab[i]["soruyla_bitti"])]
    guard = [i for i in ids if res[i].get("guard")]
    yedek = [i for i in ids if res[i].get("yedek")]
    guard_gereksiz = [i for i in guard if not evet(lab[i]["ham_ele_verdi"])]

    def turler(col: str) -> Counter:
        c: Counter = Counter()
        for i in ids:
            for t in filter(None, (x.strip() for x in lab[i][col].split(";"))):
                c[t] += 1
        return c

    ham_t, gos_t = turler("ham_hata_turu"), turler("gosterilen_hata_turu")
    ms = sorted(res[i].get("ms") or 0 for i in ids)
    model = next((res[i].get("model") for i in ids if res[i].get("model")), "?")

    L = ["# Tutor değerlendirmesi", "",
         f"**Soru:** Tutor, öğrenci zorlasa bile doğru seçeneği ele veriyor mu? · **Örnek sayısı:** {n} öğrenci cevabı "
         f"(3 karar sahnesine dağıtılmış, 17 farklı tür) · **Model:** `{model}` · **Etiketleme:** her yanıt elle okunup "
         "etiketlendi (`etiketler.csv`).", "",
         "İki katman ayrı ölçüldü: **ham model** (Gemini'nin yazdığı) ve **gösterilen** (koruma katmanından geçip "
         "oyuncunun gördüğü, spec §8.2).", "",
         "## Sonuç", "",
         "| Ölçü | Ham model | Gösterilen (koruma sonrası) |",
         "|------|-----------|-----------------------------|",
         f"| Cevabı ele verdi | {oran(len(ham_ele), n)} | {oran(len(gos_ele), n)} |",
         f"| Soruyla bitti | — | {oran(len(soru), n)} |",
         f"| Koruma devreye girdi | — | {len(guard)}/{n} (gereksiz yere: {len(guard_gereksiz)}) |",
         f"| Yedek soru (API hatası/zaman aşımı) | — | {len(yedek)}/{n} |",
         f"| Yanıt süresi (medyan / en kötü) | {ms[n // 2] / 1000:.1f} sn / {ms[-1] / 1000:.1f} sn | |",
         "",
         "%95 güven aralıkları Wilson yöntemiyle; 20 örnekle \"0 hata\" bile gerçek oranın %16'nın altında "
         "olduğunu söyler, sıfır olduğunu değil.", "",
         "## Hata türleri", "",
         "| Hata türü | Ham model | Gösterilen |", "|-----------|----------:|-----------:|"]
    for k, ad in HATA_TURLERI.items():
        L.append(f"| {ad} | {ham_t.get(k, 0)} | {gos_t.get(k, 0)} |")
    L += ["", "## Tür bazında", "", "| Tür | Adet | Ham ele verdi | Gösterilen ele verdi |", "|-----|-----:|-----:|-----:|"]
    by: dict[str, list[str]] = {}
    for i in ids:
        by.setdefault(res[i]["tur"], []).append(i)
    for t, xs in sorted(by.items()):
        L.append(f"| {t} | {len(xs)} | {sum(i in ham_ele for i in xs)} | {sum(i in gos_ele for i in xs)} |")
    L += ["", "## Tüm yanıtlar", "",
          "| # | Karar | Tür | Öğrenci | Gösterilen yanıt | 🛡 | Ham ele verdi | Hata türü | Not |",
          "|---|-------|-----|---------|------------------|----|:---:|-----------|-----|"]
    esc = lambda s: str(s).replace("|", "\\|").replace("\n", " ")  # noqa: E731
    for i in ids:
        r, l = res[i], lab[i]
        L.append(f"| {i} | {r['karar']} | {r['tur']} | {esc(r['metin'])} | {esc(r['gosterilen'])} | "
                 f"{'🛡' if r.get('guard') else ''} | {l['ham_ele_verdi']} | {esc(l['ham_hata_turu']) or '—'} | {esc(l['not'])} |")
    guarded = [i for i in ids if res[i].get("guard")]
    if guarded:
        L += ["", "### Korumanın yakaladığı ham yanıtlar", ""]
        for i in guarded:
            L.append(f"- **{i}** · ham: \"{esc(res[i]['ham'])}\"")
    (E / "RAPOR.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L[:22]))


if __name__ == "__main__":
    main()
