# Sınav tasarımı: "Seninle uyumlanan" bir vize sorusu

**Fikir.** The Primer oyuncuya seviyesine göre farklı bir kapıdan girdiriyordu, ama her yol aynı
kavrama çıkıyordu. Sınav da öyle olabilir: öğrenci **girişi kendisi seçer**, puanı ise seçtiği yolun
zorluğu değil, **gerekçesinin doğruluğu** belirler. Ezber cümle ("diferansiyel test iki sistemi
karşılaştırır") hiçbir yolda puan almaz; çünkü her soru, öğrencinin önündeki **somut sayılara** dair bir
karar ister.

## Soru (kapalı kitap, 40 dk, 30 puan)

> Bir öğrenme oyunu, oyuncunun bir sonraki kararda riskli seçeneği seçme olasılığını küçük bir modelle
> tahmin ediyor; olasılık **0,50**'yi geçerse oyunu yavaşlatıyor. Aynı `model.onnx` iki yerde çalışıyor:
> Python (onnxruntime) ve tarayıcı (onnxruntime-web). 300 girdilik bir karşılaştırmanın özeti:
>
> | | En büyük fark | 1e-4'ü aşan girdi | 0,50 eşiğinin iki yanına düşen girdi |
> |---|---|---|---|
> | Sürüm 1 | 6·10⁻⁸ | 0 | 0 |
> | Sürüm 2 (tarayıcıda yeni ön işleme kodu) | 3·10⁻³ | 7 | 1 |
>
> Sürüm 2'yi yayınlayan arkadaşın: *"Fark binde 3, gözle görülmez; zaten modelin doğruluğu %69. Testi
> 1e-2 toleransa çekelim, geçsin."* diyor.

**Kapını seç** (ikisi de 30 puan; aynı kavramları ölçer, yalnız giriş noktası farklıdır):

**Kapı A · "Önce kavramı kuracağım"**
1. (8) Bu tabloda **test kahini (oracle)** hangisidir, neden o? Kahin "doğru cevabı" mı bilir, yoksa
   "referans cevabı" mı? Farkı bu tablo üzerinden açıkla.
2. (8) 1e-4 toleransı nereden gelir? float32'nin hassasiyeti, "tolerans" ile "doğruluk" arasındaki fark.
3. (14) Arkadaşına cevap ver: toleransı gevşetmek hangi soruyu (**doğrulama mı, geçerleme mi?**)
   bozar, %69'luk doğruluk neden bu tartışmanın dışındadır? Eşiğin iki yanına düşen 1 girdi oyuncu
   için ne demektir?

**Kapı B · "Doğrudan karar vereceğim"**
1. (10) Sürüm 2'yi yayınlar mısın? Evet/hayır değil: kararını tablodaki **iki** sayıya dayandır ve hangi
   test türünün (diferansiyel, regresyon, karakterizasyon) neyi yakaladığını söyle.
2. (10) Sürüm 2'deki ön işleme kodu için eskisinin davranışını "doğru" kabul eden bir
   **karakterizasyon testi** tasarla: girdi kümesi, kahin, tolerans, ne zaman kırmızı yanar.
3. (10) Bu yayını **gölge (shadow)** olarak açarsan neyi ölçersin, hangi sonuçta geri alırsın
   (**rollback**)?

## Beklenen çekirdek (iki kapı için aynı rubrik)

| Kavram | Tam puanlık cevap | Çeldirici (puan almaz) |
|--------|-------------------|-------------------------|
| Kahin | Python referansıdır çünkü eğitimdeki sklearn ile 1e-4 içinde doğrulanmıştır; kahin "doğruyu" değil **beklenen davranışı** verir | "Python daha doğru hesaplar" |
| Tolerans | float32 ≈ 7 anlamlı basamak; 1e-4, iki çalışma zamanının sayısal gürültüsünü kapsar, mantık hatasını kapsamaz. 3·10⁻³ gürültü değil, **farklı bir hesaptır** | "Binde 3 küçük" |
| Doğrulama ↔ geçerleme | Parite testi **doğrulamadır** (ürünü doğru mu yaptık: iki tüketici aynı sözleşmeyi uyguluyor mu). %69 doğruluk **geçerlemedir** (doğru ürünü mü yaptık). Biri ötekinin bahanesi olamaz | "Model zaten %69, fark etmez" |
| Eşik etkisi | Ortalama fark değil, **kararı değiştiren** girdi önemlidir: 1 oyuncu farklı oyun görür. Testin metriği kullanıcıya etkiden seçilir | Yalnız "en büyük fark"a bakmak |
| Regresyon / karakterizasyon | Eski davranışı sabitleyen test önce yazılır, sonra kod değişir; testi gevşetmek regresyonu gizler | "Testi güncelleyelim" |
| Güvenli yayın | Gölgede iki sürüm aynı girdide koşar, eşik çaprazlaması sayılır; > 0 ise yayın durur, commit'e sabit önceki sürüme dönülür | "Yayınlayıp şikâyet gelirse bakarız" |

## Neden bu tasarım?

- **Uyum, kapının seçiminde:** kavramı adım adım kurmak isteyen A'dan, karar vermeyi seven B'den girer.
  İkisi de aynı altı satırlık rubrikle okunur; zorluk değil, düşünme sırası değişir.
- **Ezber işe yaramaz:** her soru tablodaki sayılara bağlanmadan cevaplanamaz. Tanımı bilen ama
  3·10⁻³'ün neden "gürültü değil" olduğunu söyleyemeyen öğrenci bu farkı burada gösterir.
- **Gerçek bir sahne:** soru bu ödevin kendisinden geliyor (`tests/parite.py`, `cypress/e2e/model.cy.ts`).
  Öğrenci sınavda, yaptığı işin gerekçesini anlatır.
