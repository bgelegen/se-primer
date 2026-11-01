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

## Tur 2 · Plan (çalıştırılmadan önce yazıldı)

Tur 1 kapandıktan sonra açıldı; tur 0–1'in bütün sonuçları yukarıda olduğu gibi duruyor. Eşikler değişmiyor.

**Yeni veri:** 30 YZ oturumu daha. Bu kez oyuncular Batuhan'ın kendi bakış açıları: teslime yetişmeye çalışan,
her şeyi kusursuz isteyen, sınava çalışan, ders arası yorgun, bütün sonları merak eden ve "en hızlı iyi son"
peşindeki rekabetçi Batuhan (`data/yz_oyuncular/batuhan.json`). Oturumlar oyuncunun karakterine göre
oynanır, modele göre değil; rekabetçi Batuhan gibi "hızlı ama doğru" oynayan profiller de bilerek dahil.
Veride `oynayan = yz_ajan`.

Toplam gerçek (YZ) veri: 60 oturum. Yalnız iki aday, ilk geçen yayınlanır:

| # | Aday | Gerekçe |
|---|------|------|
| D5 | D4 aynen (log + LR, sentetik-2), 60 YZ oturumu | Yalnız veri arttı; model aynı. |
| D6 | log + LR, **sentetik veri yok**: E1 de 60 YZ oturumunda ölçülür | Tur 1 bulgusu (2): E1'i sentetik kural belirliyordu. Sentetik veri ödevde isteğe bağlı; çıkarılınca E1 gerçek oyuncuları ölçer ve kapı daha zor değil daha anlamlı olur. |

İkisi de geçmezse model oyuncuya açılmaz.

## Tur 2 · Sonuç

| # | Aday | Veri | E1 (≥ 0,70) | E2 (≥ 0,60) | Sonuç |
|---|------|------|------|------|-------|
| D5 | log + LR | 60 YZ + 240 sentetik-2 oturum | 0,677 | **0,626** | ✗ (E1) |
| D6 | log + LR | yalnız 60 YZ oturumu | 0,680 | **0,680** | ✗ (E1) |

Hiçbir aday kapıdan geçmedi; plan gereği model oyuncuya açılmadı. Eşikler değişmedi.

**Gözlem:** Gerçek (YZ) oyuncularda AUC 0,56'dan 0,68'e çıktı. Ama oturumlar oyuncuya göre değil karakterlere
göre oynandığı için verinin yaklaşık yarısı modelin "aceleci = riskli" sezgisine **karşı** çalışıyor: hızlı ama
doğru oynayan rekabetçi oyuncu, okuyup bilerek B'yi seçen meraklı ve kusursuzcu oyuncu. Bu, modelin sınırını
gösteriyor: tempo, kararın **niyetini** (bilerek keşif mi, acele mi) ayıramıyor. Sonraki sürüm için
"kaçıncı oyun" (tekrar sayısı) ve "B'yi daha önce görmüş mü" gibi niyete yakın sinyaller gerekiyor.

## Tur 3 · Plan (insan verisi gelmeden önce yazıldı)

YZ oturumlarıyla yeni tur açılmaz: oturumları ben oynadığım ve hangi davranışın kapıyı geçirdiğini artık
bildiğim için bir sonraki YZ turu, kapıyı geçen veriyi seçmek anlamına gelir. Sonucu değiştirebilecek tek
yeni bilgi, benim kontrol etmediğim **insan** oturumlarıdır.

| # | Aday | Veri | Kural |
|---|------|------|-------|
| D7 | D6 aynen (log + LR, sentetik yok) | 60 YZ oturumu + Batuhan'ın kendisinin oynadığı ≥ 15 oturum (`oynayan = insan`) | **Tek deneme.** Geçerse yayınlanır; geçmezse aday yalnız gölge modda kullanılır. |
