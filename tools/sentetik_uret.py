"""Sentetik oyuncu oturumları üretir → data/sentetik.csv  (kaynak = sentetik)

Kural (README ve data/SOZLUK.md'de de yazılı). Tohum: 13. Her oturum bir sanal oyuncudur:

  seviye ~ Uniform{0,1,2}, rol ~ Uniform{gelistirici,test,urun}, hedef ~ Uniform{mimari,test,kvkk}
  acele a ~ Normal(0, 1)                              # oyuncunun gizli "tempo" özelliği
  giris_suresi_sn = exp(Normal(ln 14 − 0,45·a, 0,40))  # aceleci oyuncu profili hızlı seçer
  kriz_okuma_sn   = exp(Normal(ln 18 − 0,55·a, 0,50))  # ve kriz metnini hızlı geçer

  Her karar k (K1, K2, K3) için:
    ipucu görüldü  : yeni → 1 · biraz → Bernoulli(σ(−0,3 − 0,6·a)) · deneyimli → 0
    tutor mesajı   : Poisson(exp(−1,2 − 0,5·a + 0,3·[seviye=yeni]))
    logit(P(B))    = −0,55 + 0,95·a + 0,55·önceki_riskli − 0,45·[hedef bu sahne]
                     − 0,35·[ipucu] − 0,25·min(tutor, 2) + c_k + 0,15·(seviye − 1)
                     c = {K1: +0,20, K2: +0,10, K3: −0,35}
    karar_suresi   = exp(Normal(ln 16 − 0,45·a, 0,45)); B seçildiyse × 0,75
    deneyimli ve karar_suresi > 60 → süre doldu: seçim B, süre 60

Özellikler, uygulamanın (app/src/olcum.ts) hesapladığı gibi hesaplanır: aynı sınırlar, 0,1 sn
yuvarlama, "önceki" sayaçlar yalnız geçmiş kararlardan. O kararın ipucu/tutor kullanımı ve süresi
modelin girdisi DEĞİLDİR (karar anında bilinmez); yalnız etiketi etkiler: gerçek hayattaki gürültü.

Kullanım:  python tools/sentetik_uret.py [--oturum 240]
"""
import argparse
import csv
import math
from pathlib import Path

import numpy as np

KOK = Path(__file__).resolve().parent.parent
SEED = 13
HEDEF_SAHNE = {"K1": "mimari", "K2": "test", "K3": "kvkk"}
C_K = {"K1": 0.20, "K2": 0.10, "K3": -0.35}
SUTUNLAR = [
    "oturum_id", "kaynak", "oynayan", "uygulama_surumu", "rol", "hedef", "karar_id",
    "seviye_no", "sahne_no", "hedef_bu_sahne", "giris_suresi_sn", "kriz_okuma_sn", "onceki_riskli",
    "onceki_ort_karar_sn", "onceki_ipucu", "onceki_tutor", "onceki_sure_doldu",
    "secim", "riskli_secim", "karar_suresi_sn", "sure_doldu", "ipucu_bu_sahne", "tutor_bu_sahne",
    "model_p", "model_mudahale",
]


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def yuvarla(x: float, alt: float, ust: float) -> float:
    return round(min(ust, max(alt, x)) * 10) / 10


def uret(n_oturum: int) -> list[dict]:
    rng = np.random.default_rng(SEED)
    satirlar = []
    for i in range(n_oturum):
        seviye = int(rng.integers(0, 3))
        rol = ["gelistirici", "test", "urun"][int(rng.integers(0, 3))]
        hedef = ["mimari", "test", "kvkk"][int(rng.integers(0, 3))]
        a = float(rng.normal())
        giris = math.exp(rng.normal(math.log(14) - 0.45 * a, 0.40))
        kriz = math.exp(rng.normal(math.log(18) - 0.55 * a, 0.50))
        gecmis = []
        for s, k in enumerate(["K1", "K2", "K3"], start=1):
            hedef_bu = int(hedef == HEDEF_SAHNE[k])
            oz = {
                "seviye_no": seviye, "sahne_no": s, "hedef_bu_sahne": hedef_bu,
                "giris_suresi_sn": yuvarla(giris, 0, 600), "kriz_okuma_sn": yuvarla(kriz, 0, 600),
                "onceki_riskli": sum(g["riskli"] for g in gecmis),
                "onceki_ort_karar_sn": yuvarla(sum(g["sure"] for g in gecmis) / len(gecmis), 0, 120) if gecmis else 0.0,
                "onceki_ipucu": sum(g["ipucu"] for g in gecmis),
                "onceki_tutor": min(20, sum(g["tutor"] for g in gecmis)),
                "onceki_sure_doldu": sum(g["doldu"] for g in gecmis),
            }
            ipucu = 1 if seviye == 0 else (int(rng.random() < sigmoid(-0.3 - 0.6 * a)) if seviye == 1 else 0)
            tutor = int(rng.poisson(math.exp(-1.2 - 0.5 * a + 0.3 * (seviye == 0))))
            logit = (-0.55 + 0.95 * a + 0.55 * oz["onceki_riskli"] - 0.45 * hedef_bu - 0.35 * ipucu
                     - 0.25 * min(tutor, 2) + C_K[k] + 0.15 * (seviye - 1))
            riskli = int(rng.random() < sigmoid(logit))
            sure = math.exp(rng.normal(math.log(16) - 0.45 * a, 0.45)) * (0.75 if riskli else 1.0)
            doldu = 0
            if seviye == 2 and sure > 60:
                doldu, riskli, sure = 1, 1, 60.0
            gecmis.append({"riskli": riskli, "sure": sure, "ipucu": ipucu, "tutor": tutor, "doldu": doldu})
            satirlar.append({
                "oturum_id": f"s{i:04d}", "kaynak": "sentetik", "oynayan": "kural", "uygulama_surumu": "sentetik-1", "rol": rol,
                "hedef": hedef, "karar_id": k, **oz, "secim": "B" if riskli else "A", "riskli_secim": riskli,
                "karar_suresi_sn": yuvarla(sure, 0, 600), "sure_doldu": doldu, "ipucu_bu_sahne": ipucu,
                "tutor_bu_sahne": tutor, "model_p": "", "model_mudahale": 0,
            })
    return satirlar


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--oturum", type=int, default=240)
    args = ap.parse_args()
    yol = KOK / "data" / "sentetik.csv"
    yol.parent.mkdir(exist_ok=True)
    satirlar = uret(args.oturum)
    with yol.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=SUTUNLAR, lineterminator="\n")
        w.writeheader()
        w.writerows(satirlar)
    oran = sum(r["riskli_secim"] for r in satirlar) / len(satirlar)
    print(f"✓ {args.oturum} sentetik oturum, {len(satirlar)} satır → {yol.relative_to(KOK)} (riskli oranı {oran:.2f})")


if __name__ == "__main__":
    main()
