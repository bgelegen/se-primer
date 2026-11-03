# RELEASE · Nöbet Arkadaşı

## v2.0.0

| | |
|---|---|
| Model reposu | https://huggingface.co/batuhangelegen/se-primer-nobet-arkadasi |
| Sabitlenen commit | `48d21a82f596aea5ad6f4399f99776ebb51bcbf0` |
| Tüketicilerin indirdiği URL | `https://huggingface.co/batuhangelegen/se-primer-nobet-arkadasi/resolve/48d21a82f596aea5ad6f4399f99776ebb51bcbf0/model.onnx` (+ `config.json`) |
| `model.onnx` sha256 | `e12e66832e3bca3e9e33dab0b66ba43e773086b436bcd30c77604fab1a29c59a` |
| Veri | `data/oturumlar.csv` sha256 `dd97ae3162df18ad28a6055ae889c61231e441420c741130d82d3be9939fdfe8` · 60 oturum, hepsini **YZ oyuncusu** oynadı, sentetik yok |
| Eval | ROC-AUC (oturuma göre gruplu 5 katlı CV) **0,68** · E1 eşiği 0,65 (v2.0.1, sonuçlardan sonra indirildi; ilk eşik 0,70) · [DENEYLER.md](DENEYLER.md) |
| Uygulama | GitHub Pages, `oyna/` (onnxruntime-web 1.22.0), `app/src/model.ts → MODEL_TABAN` |

### Ne değişti (v1 → v2.0)

- **Yeni:** oyuncunun davranışından öğrenen sınıflandırıcı (`log(1 + x) → StandardScaler → LogisticRegression`,
  10 özellik, spec §13.2; log dönüşümü ONNX grafiğinin içinde). v1'de uyum yalnız girişte sorulan 3 cevaba bağlı sabit kurallardı.
- **Oyun davranışı:** K2/K3'te p ≥ 0,50 → Nöbet Arkadaşı kartı, ipucu açık, 60 sn sayaç yok. K1'de
  model **gölgede** (p hesaplanır ve kaydedilir, oyun değişmez).
- **Yeni artefakt sözleşmesi:** `model.onnx` (girdi `input` float32 `[n,10]`, çıktı `probabilities [n,2]`) +
  `config.json` (özellik sırası, sınıflar, eşik, metrikler, kapılar, JSON şeması, veri sha256).
- **Yeni testler:** eval kapısı (`train.py`), Python Oracle (`tests/parite.py`), diferansiyel test ve
  KÖ-7…9 (`cypress/e2e/model.cy.ts`), eğitim↔çıkarım sözleşme testleri (`tests/model_uyum.test.ts`).
  v1'in 24 E2E testi değiştirilmeden geçiyor (regresyon).

### Neden commit'e sabit URL?

`resolve/main/model.onnx` "en son yüklenen" dosyadır: biri yeni bir model yüklediğinde uygulama, hiçbir
kod değişikliği ve hiçbir test olmadan başka bir modelle çalışmaya başlar. `resolve/<commit>/` ise
değişmez bir adrestir (Sommerville Bl. 25: *baseline*). Model sürümü artık uygulamanın bir **kod
değişikliği**dir: PR'da görünür, CI'da test edilir, `git revert` ile geri alınır.

### Geri alma (rollback)

Bir sorun çıkarsa (parite testi kırmızı, oyuncu şikâyeti, gölge karşılaştırmasında sapma):

1. **Anında (≤ 5 dk), modeli kapat:** `app/src/model.ts` içinde `MODEL_TABAN`'ı boş bir adrese
   (`'./model-kapali/'`) çevir, `npm --prefix app run build:pages`, commit, push. Model indirilemeyince oyun
   v1 kurallarına döner (spec §13.3; KÖ-9b bunu test ediyor). Veri kaybı yok.
2. **Önceki sürüme dön:** `MODEL_TABAN`'ı bir önceki satırdaki commit'e çevir (aşağıdaki tablo), `tests/parite.json`'u o
   sürümün Oracle çıktısıyla değiştir (`git checkout <etiket> -- tests/parite.json model/`), CI yeşil → push.
   Hugging Face'te hiçbir şey silinmez: eski commit'in dosyaları aynı URL'de durur.
3. Kök neden bulununca yeni sürüm aşağıdaki güvenli yayın adımlarından yeniden geçer.

| Sürüm | HF commit | Durum |
|-------|-----------|-------|
| 2.0.0 | `48d21a82f596aea5ad6f4399f99776ebb51bcbf0` | yayında (uygulama bu commit'i indirir) |
| 2.0.0 kart | `0b15ae34b8d7e210542b9b7b37bc3eaf7aac2700` | yalnız model kartında yazım düzeltmesi; `model.onnx` ve `config.json` aynı (sha256 değişmedi), sabit URL değiştirilmedi |
| v1 (model yok) | — | geri dönüş: kural tabanlı oyun |

## Yeni sürümü güvenle devreye alma (v2.x için plan)

SE Primer'da bir "kötü model"in bedeli: aceleci oyuncuyu kaçırmak (yardım gelmez) ya da dikkatli oyuncuyu
gereksiz yere durdurmak (oyun can sıkıcı olur, 60 sn'lik baskı deneyimi kaybolur). İkisini de ölçerek ilerleriz.

| Aşama | Ne yapılır | Ölçülen | Geçme koşulu → sonraki aşama |
|-------|-----------|---------|------------------------------|
| 0 · Çevrimdışı | `train.py` kapıları E0–E4, CI'da parite ve regresyon | AUC, parite farkı | Kapılar yeşil |
| 1 · **Gölge (shadow)** | Yeni model her karar ekranında **eskisiyle birlikte** çalışır, yalnız eskisi oyunu etkiler; iki p de veri satırına yazılır (`model_p`, `model_p_gölge`) | Eşik çaprazlaması: iki modelin farklı karar verdiği oran; gerçek seçimle (`riskli_secim`) AUC karşılaştırması | ≥ 50 gerçek karar; yeni AUC ≥ eski AUC − 0,02; çaprazlama ≤ %15 |
| 2 · **Kanarya** (%5) | Oturum kimliğinin hash'i < %5 olan oyunlar yeni modelle oynar | Kanarya grubunda müdahale oranı, oyunu yarıda bırakma, iyi son oranı | Yarıda bırakma kontrol grubundan kötü değil; müdahale oranı %10–%50 aralığında |
| 3 · **Aşamalı** %25 → %50 → %100 | Her adımda en az 2 gün / 30 oturum | Aynı ölçüler + parite testi her deploy'da | Herhangi bir adımda koşul bozulursa bir önceki yüzdeye dön (rollback 1) |

**Bu sürüm için özel not:** v2.0.0 hiç insan verisi görmedi (60 oturumun hepsi YZ oyuncusu). Bu yüzden asıl ilk
adım **insanlarla gölge**: uygulama modeli zaten her kararda çalıştırıp `model_p`'yi kaydediyor; veri toplama
modunda insanlar oynadıkça modelin insanlardaki AUC'si ölçülür, ≥ 0,65 değilse model kapatılır (rollback 1).

Bu ödevdeki yayın (v2.0.0) **ilk sürüm** olduğu için karşılaştırılacak bir önceki model yoktu: aşama 1'de
"eski model" v1'in kuralıdır (hiç müdahale yok) ve K1'deki gölge mod tam olarak budur; K1'de p hesaplanıp
kaydedilir ama oyun değişmez. Statik GitHub Pages'te yüzde bölme, oturum kimliğinin hash'iyle istemcide yapılır
(sunucu gerekmez); bölme sabit tohumlu olduğu için aynı oyuncu aynı grupta kalır.

## Mimari dağıtım kararı ve ödünleşim matrisi

Seçenekler başlangıç reposundaki üç tüketiciyle aynıdır (`seyyah/huggingface-hello-web`: `web/`, `mobile/`,
`rails-api/`).

| Soru | **Tarayıcı** (onnxruntime-web, GitHub Pages) ✅ seçilen | Cihaz içi mobil (Expo, gömülü ONNX) | Kendi sunucum (Render.com, Rails/FastAPI) |
|------|---------|---------|---------|
| **1. Ağ zorunlu mu, gecikme?** | İlk açılışta model (~1 KB) + çalışma zamanı (~11 MB wasm, önbelleğe alınır) iner; sonra **her tahmin yerel, < 5 ms**, ağ yok. Model inemezse oyun v1 olarak sürer. | Kurulumdan sonra **tamamen çevrimdışı**; tahmin < 5 ms. Güncelleme için yeni APK ya da uzaktan indirme gerekir. | **Her tahmin bir ağ isteği** (≥ 50–300 ms, ücretsiz katmanda uyuyan sunucuyu uyandırma 30+ sn). Karar ekranı açılırken bu gecikme oyunda hissedilir. |
| **2. Veri cihazdan çıkar mı?** (KVKK) | **Hayır.** 10 özellik tarayıcıda kalır; veri toplama da yalnız `localStorage`'a yazar. | **Hayır.** | **Evet:** her kararın tempo verisi sunucuya gider; aydınlatma metni, saklama süresi, log maskeleme gerekir (oyunun K3'te öğrettiği şey). |
| **3. Model gizli kalır mı?** | **Hayır.** `model.onnx` herkese açık; ağırlıklar okunabilir. Hassas veriyle eğitilmediği ve oyunun "cevabını" içermediği için kabul edilebilir. | **Hayır** (APK açılıp çıkarılabilir). | **Evet**, dosya inmez; ama yanıtlar üzerinden sorgu-yanıt ile model **tersine mühendislikle** kopyalanabilir (10 özellikli bir lojistik regresyon birkaç yüz istekle). Hız sınırı gerekir. |
| Maliyet / bakım | Ücretsiz, sunucusuz; Pages + HF ücretsiz katman | Ücretsiz; mağaza/APK dağıtımı ve iki platform bakımı | Ücretsiz katmanda uyku gecikmesi; sunucu, güvenlik, izleme bakımı |
| Güncelleme | `MODEL_TABAN` değişikliği + Pages yayını (dakikalar) | Uzaktan indirme modunda dakikalar, gömülüde mağaza süreci | Sunucuda dosya değişimi (anında), istemciye dokunulmaz |

**Karar: tarayıcı.** SE Primer zaten telefonda tarayıcıdan oynanan bir web uygulaması; model küçük ve
hassas veri içermiyor. Üç sorunun ikisinde (gecikme, KVKK) tarayıcı en iyi seçenek; kaybettiğimiz tek şey
modelin gizliliği ve bu modelde gizlenecek bir şey yok. Feragat ettiğimiz: modeli sunucuda gizlice
değiştirme ve merkezi izleme (gölge karşılaştırmasını istemcide yapıp anonim satırları CSV ile toplamak
zorundayız).

### Üçüncü tüketici: kendi sunucum (bonus)

Oyunun kendisi tarayıcıda çalışıyor; sunucu tüketicisi aynı sözleşmenin **üçüncü** uygulaması ve tablodaki
ödünleşimlerin canlı örneği ([`server/`](server/)):

- **FastAPI + onnxruntime**, Docker, Render.com ücretsiz katman ([`render.yaml`](render.yaml)). Model açılışta
  HF'deki commit'e sabit URL'den iner; `model.onnx`'in sha256'sı kodda sabit, farklıysa sunucu **açılmaz**
  (sürüm kayması olmaz).
- `POST /api/v1/tahmin {"inputs": {...}}` girdiyi `config.json → input_schema` ile doğrular: eksik alan, aralık dışı
  değer ya da sözleşmede olmayan bir alan (ör. `"ad"`) **422** ile reddedilir. Sözleşme gerçekten sözleşme gibi davranıyor.
- **Soru 1 (gecikme):** her tahmin bir ağ isteği; ücretsiz katmanda 15 dk boşta kalınca uyuyor, ilk istek ~1 dk
  sürebiliyor. Oyunun karar ekranı için bu kabul edilemez, oyun bu yüzden tarayıcıda.
- **Soru 2 (veri):** oyuncunun tempo verisi sunucuya gider. Sunucu girdileri **loglamıyor** (`--no-access-log`, gövde
  kaydı yok); gerçek kullanımda aydınlatma metni gerekir.
- **Soru 3 (gizlilik):** dosya istemciye inmiyor ama yanıtlar üzerinden model kopyalanabilir (10 özellikli LR birkaç
  yüz istekle). Bu yüzden IP başına dakikada 120 istek sınırı var. Bu modelde gizli bir şey olmadığı için model HF'de
  public; gizli olması gerekseydi private HF + token ile yalnız sunucu indirirdi.
- **Diferansiyel test:** aynı 5 referans girdide sunucu = Python Oracle = tarayıcı (|Δ| < 1e-4):
  `server/test_sunucu.py` (pytest), `tests/sunucu_parite.py` (HTTP, CI'da Docker imajına ve canlı adrese karşı),
  `cypress/e2e/sunucu.cy.ts` (üç tüketici bir arada).

## Kaynaklar

- Amershi vd. (2019), *Software Engineering for Machine Learning: A Case Study* — modelin yaşam döngüsünün
  izleme ve yeniden eğitimle kapanan bir döngü olması; K1 gölge modu ve `model_p` kaydı bunun ilk adımı.
- Shankar vd. (2024), *Operationalizing Machine Learning: An Interview Study*, Proc. ACM HCI (CSCW) — 3V: **Velocity** (tek komutla eğitim, yayın iş akışı),
  **Validation** (eval kapısı, parite, regresyon), **Versioning** (commit'e sabit URL, veri sha256'sı config.json'da).
- Breck vd. (2017), *The ML Test Score* — "eğitim ve sunum aynı özellik kodunu kullanıyor mu" testi
  (`tests/model_uyum.test.ts`), "model, tek satırlık bir taban çizgisinden iyi mi" (E3).
- Mitchell vd. (2019), *Model Cards for Model Reporting* — `model/README.md`.
- Sommerville, *Software Engineering* (10. baskı) Bl. 8 (doğrulama ↔ geçerleme), Bl. 25 (konfigürasyon yönetimi,
  baseline).
- Hugging Face Hub belgeleri: `resolve/<revision>` URL'leri; ONNX Runtime Web belgeleri.
