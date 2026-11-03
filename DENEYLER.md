# Deney günlüğü · Nöbet Arkadaşı

Yayınlanan modele nasıl varıldığının özeti. Ayrıntılı ara kayıtlar git geçmişinde
(`038eacc` ve "Tur 1", "Tur 2" commit'leri).

**Ölçüm:** `StratifiedGroupKFold(5, shuffle, random_state=13)`, oturuma göre gruplu.
E1: tüm veri, E2: yalnız `kaynak = gercek`. "Gerçek" oturumların hepsini bir YZ ajanı insan gibi oynadı
(hocanın 01.11.2026 duyurusu; veride `oynayan = yz_ajan`).

## Denenen adaylar

| # | Model | Veri | E1 | E2 | İlk eşikle (E1 ≥ 0,70) | Yeni eşikle (E1 ≥ 0,65) |
|---|-------|------|----|----|:---:|:---:|
| D1 | LR, ham özellikler | 30 YZ + 240 sentetik-1 | 0,690 | 0,559 | ✗ | ✗ (E2) |
| D2 | LR, ham özellikler | 30 YZ + 240 sentetik-2 | 0,680 | 0,590 | ✗ | ✗ (E2) |
| D3 | log(1 + x) + LR | 30 YZ + 240 sentetik-1 | 0,693 | 0,613 | ✗ | ✓ |
| D4 | log(1 + x) + LR | 30 YZ + 240 sentetik-2 | 0,681 | 0,634 | ✗ | ✓ |
| D5 | log(1 + x) + LR | 60 YZ + 240 sentetik-2 | 0,677 | 0,626 | ✗ | ✓ |
| **D6** | **log(1 + x) + LR** | **60 YZ, sentetik yok** | **0,680** | **0,680** | ✗ | **✓ yayınlandı** |

D1'in teşhisinde başka küçük model aileleri de aynı CV'yle denendi (karar ağacı, KBins + LR, küçük RF,
gradient boosting). Hiçbiri D1'den belirgin iyi değildi; aday olarak seçilmedi.

## Eşik değişikliği

İlk eşik (E1 ≥ 0,70) eğitimden önce yazıldı (`6c434f7`) ve hiçbir aday geçmedi. Hocanın 01.11.2026 tarihli
ikinci duyurusundan ("eşiğin eğitimden önce belirlenmesine gerek yok") sonra E1 **0,65**'e indirildi
(spec §13.4, v2.0.1). Yeni eşik sonuçlar görüldükten sonra seçildiği için D6'nın geçmesi ön kayıtlı bir test
sonucu değildir. Bu, model kartında da yazılıdır.

**Neden D6?** Yeni eşiği geçen dört aday arasında E2'si (gerçek oyuncular) en yüksek olan ve sentetik kurala
bağlı olmayan tek aday. Sentetik veri, E1'i çoğunlukla benim yazdığım kuralın öğrenilebilirliğine bağlıyordu.

## Bulgular

1. **Sentetik veri yanlış bir önyargı taşıyordu.** Kuralı yazarken deneyimli oyuncuyu daha riskli varsaydım,
   oyunda tersi çıktı. Yayınlanan model sentetik veri kullanmıyor.
2. **Log ölçeği işe yaradı.** Okuma ve karar süreleri log-normal; 2 sn ile 4 sn farkı 40 ile 42 sn farkından
   daha anlamlı. Gerçek oyuncu AUC'si 0,56'dan 0,68'e çıktı.
3. **Model niyeti ayıramıyor.** Hızlı ama doğru oynayan ya da okuyup bilerek B'yi deneyen oyuncu, "acele = risk"
   sezgisine ters düşüyor. Modelde profil seçme süresi **artı** yönde çıktı: uzun okuyup bilerek keşfeden
   oyuncuların izi. Sonraki sürüm için "kaçıncı oyun" ve "B'yi daha önce gördü mü" gibi niyete yakın sinyaller gerekir.
4. **KÖ-7'nin ilk senaryosu tutmadı.** Model, aceleci *deneyimli* oyuncuya p = 0,20 verdi (veride deneyimliler
   daha az riskli seçim yaptı). KÖ-7, model eğitildikten sonra "Biraz deneyimliyim" seviyesindeki aceleci bir
   oyuncuyla yeniden yazıldı (p ≈ 0,66). İlk senaryo Oracle referansı R1 olarak duruyor.
5. **İnsan verisi yok.** Bütün "gerçek" oturumları YZ oyuncusu oynadı. İlk iş, gölge modda insan verisi
   toplayıp modeli insanlarda ölçmek (RELEASE.md).
