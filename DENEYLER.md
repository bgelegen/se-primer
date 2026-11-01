# Deney günlüğü · Nöbet Arkadaşı

Eşikler (spec §13.4) eğitimden önce yazıldı ve **değişmez**. Bu dosya, kapıdan geçen bir model bulana
kadar denenen **her** adayı sırasıyla kaydeder; seçilmeyenler silinmez. Birden çok aday denemek
"en şanslı sonucu seçme" riskini doğurur; bu yüzden aday sayısı baştan sınırlandı ve hepsi raporlanır.

Ölçüm: `StratifiedGroupKFold(5, shuffle, random_state=13)`, oturuma göre gruplu; E1 tüm veri, E2 yalnız
`kaynak = gercek` satırlar (30 oturum, hepsi YZ oyuncusu: hocanın 01.11.2026 duyurusu).

## Tur 0 · İlk eğitim (spec'teki model)

| # | Aday | E1 (≥ 0,70) | E2 (≥ 0,60) | Sonuç |
|---|------|------|------|-------|
| D1 | `StandardScaler → LogisticRegression(C=1)`, 10 ham özellik, sentetik-1 + 30 YZ oturumu | 0,690 | 0,559 | ✗ yayınlanmadı |

Teşhis (aynı CV ile, model seçmek için değil, nedeni anlamak için):

- Başka küçük modeller de geçmedi: LR C=0,1 0,692/0,562 · karar ağacı d=3 0,635/0,563 · d=4 0,619/0,605 ·
  KBins+LR 0,677/0,625 · küçük RF 0,686/0,628 · GB 0,662/0,628. Sorun model ailesi değil.
- Yalnız gerçek satırlarla LR: 0,645 (E2 geçer, E1 geçmez).
- Tek özellik AUC'leri (gerçek satırlar): `kriz_okuma_sn` 0,727 (kısa okuma → riskli), `onceki_ort_karar_sn` 0,65,
  `seviye_no` 0,634 ama **ters yönde**: düşük seviye daha riskli. Sentetik kuralda `+0,15·(seviye−1)` terimiyle
  deneyimliyi daha riskli varsaymıştım; gerçek oyunda tersi çıktı. Sentetik veri yanlış bir önyargı taşıyordu.
- D2 (tur 0'da, plan yazılmadan denendi, burada sayılır): sentetik kuraldan seviye terimini çıkarmak → 0,680 / 0,590 ✗.

## Tur 1 · Plan (çalıştırılmadan önce yazıldı)

En fazla **iki** aday daha; ilk geçen yayınlanır, ikisi de geçmezse model yayınlanmaz ve bu dosya sonuç olarak kalır.

| # | Aday | Gerekçe (veriden önce bilinen) |
|---|------|------|
| D3 | Aynı LR, girdiler **log(1 + x)** ölçeğinde (dönüşüm ONNX grafiğinin içinde; uygulamanın sözleşmesi değişmez), sentetik-1 | İnsan tepki ve okuma süreleri log-normal dağılır (sentetik üretici de süreleri `exp(Normal)` ile üretiyor). 2 sn ile 4 sn arasındaki fark, 40 ile 42 sn arasındaki farktan çok daha anlamlıdır; ham saniye ölçeğindeki LR bunu göremez. |
| D4 | D3 + sentetik-2 (seviye varsayımı kaldırılmış) | D1'in teşhisi: dayanaksız bir varsayım sentetik veriden çıkarılır (yönü gerçek veriye uydurulmaz, yalnız kaldırılır). |

## Tur 1 · Sonuç

| # | Aday | E1 (≥ 0,70) | E2 (≥ 0,60) | Sonuç |
|---|------|------|------|-------|
| D3 | log(1 + x) + LR, sentetik-1 | 0,693 | **0,613** | ✗ (E1) |
| D4 | log(1 + x) + LR, sentetik-2 | 0,681 | **0,634** | ✗ (E1) |

Plan gereği tur kapandı: **hiçbir aday kapıdan geçmedi, model yayınlanmadı.** Eşikler değiştirilmedi.

**Ne öğrendik?**

1. Gerçek (YZ oyuncu) satırlarda sinyal var ve log ölçeği onu yakalıyor: E2, 0,559 → 0,613 → 0,634. Gerçek
   oyuncuyu tahmin etme kapısı (E2) D3 ve D4'te **geçildi**.
2. E1 tüm veride ölçülüyor ve 810 satırın 720'si sentetik. Yani E1 çoğunlukla **benim yazdığım sentetik kuralın
   ne kadar öğrenilebilir olduğunu** ölçüyor. O kural, gürültüsü yüzünden en iyi modelle bile ~0,69–0,70'te
   kalıyor. Kapıyı ve sentetik kuralı birbirinden bağımsız tasarladım; birlikte neredeyse geçilemez oldular.
   Bir sonraki sürümde E1'in sentetik değil gerçek veride, ayrı bir test kümesinde ölçülmesi gerekir. Bu da
   eşiklerin bir sonraki eğitimden **önce** yazılan v2.1 spec'inde yapılmalı, bu turda değil.
3. Sentetik veri yanlış bir önyargı taşıyordu (deneyimli oyuncu daha riskli). Gerçek oyunda tersi çıktı.
