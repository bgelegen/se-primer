# SE Primer — Yazılım mühendisliği, oynanan bir kitap

> Her seçim bir durum geçişi. Her son bir kabul kriteri.

YZM301 Yazılım Gerçekleme ve Test · Batuhan Gelegen

Telefonda 5 dakikada oynanan, kişiye uyum sağlayan bir karar kitabı. **08:00, hastanenin randevu
sistemi çöktü; nöbetçi sensin.** Üç karar verirsin (mimari, test, KVKK), her kararın **ne olduğunu ve
neden olduğunu** hemen görürsün. Bir AI tutor sana yardım eder ama cevabı asla söylemez, soru sorar.
Seviyene, rolüne ve hedefine göre anlatı değişir.

| | Link |
|---|---|
| ▶ **Uygulama (AI Studio, telefonda açılır)** | {{AISTUDIO}} |
| 🎬 **60 sn demo (Cypress koşusu)** | {{VIDEO}} |
| 💻 **Repo** | https://github.com/bgelegen/se-primer |

[![e2e](https://github.com/bgelegen/se-primer/actions/workflows/e2e.yml/badge.svg)](https://github.com/bgelegen/se-primer/actions/workflows/e2e.yml)

## Teslim → kanıt

| Teslim (puan) | Kanıt |
|---------------|-------|
| **spec.md** (20) | [`spec.md`](spec.md): problem (§1), kapsam dışı (§3), **5 kabul örneği** (§9, Gherkin), akış şeması (§7, durum makinesi → [`docs/akis/akis.svg`](docs/akis/akis.svg)) |
| **Tasarım** (15) | Google Stitch'te 3 mobil ekran: [`design/1-giris`](design/1-giris/screen.png), [`design/2-sahne`](design/2-sahne/screen.png), [`design/3-son`](design/3-son/screen.png) (PNG + Stitch HTML) · Stitch'in ürettiği [`DESIGN.md`](DESIGN.md) |
| **Çalışan uygulama** (20) | Google AI Studio'da ekranlar + spec verilerek üretildi ([`docs/aistudio-prompt.md`](docs/aistudio-prompt.md)); kod: [`app/`](app/) · link yukarıda |
| **Tutor eval** (25) | [`eval/RAPOR.md`](eval/RAPOR.md): 20 öğrenci cevabı, elle etiket, hata türleri, oran + örnek sayısı + güven aralığı |
| **Cypress demo** (10) | [`cypress/e2e/`](cypress/e2e/): 8 yolun hepsi + 5 kabul örneği + dönüşler; GitHub Actions'ta koşar; demo videosu koşunun kaydı |
| **Ürün kararı** (10) | Aşağıda: yapmadığım 3 özellik |

## Ürün kararı: yapmadığım 3 özellik

1. **Kullanıcı hesabı ve ilerleme kaydı.** 5 dakikalık tek oturumluk bir oyunda giriş ekranı oyuncuyu
   kaybettirir, sakladığım her veri de KVKK yükü getirir; kaydedecek ilerleme zaten yok.
2. **İkinci senaryo.** Tek senaryonun öğretip öğretmediğini ölçmeden içerik çoğaltmak, ölçülmemiş bir
   varsayımı çoğaltmak olurdu; önce bu bölümün eval'i ve arkadaş testi.
3. **Puan tablosu ve süre yarışı.** Sıralama hızlı tıklamayı ödüllendirir; bu kitabın amacı oyuncuyu
   yavaşlatıp "neden?" diye düşündürmek (süre baskısı yalnızca "Deneyimliyim" seviyesinde, öğretici bir
   araç olarak var).

Tasarımdan bilerek çıkardığım bir şey: Stitch, seçenek kartlarına "Düşük risk" / "Hata riski yüksek"
etiketleri koymuştu. Bu etiketler cevabı ele verdiği için uygulamada yok (spec §3, tutor kuralıyla aynı
gerekçe).

## Nasıl çalışır

```mermaid
flowchart LR
  G[Giriş: seviye · rol · hedef] --> S0[08:00 kriz] --> K1[K1 Mimari] --> K2[K2 Test] --> K3[K3 KVKK]
  K3 -->|K3=A ∧ ¬(K1=B ∧ K2=B)| I[SON A · İYİ]
  K3 -->|aksi| K[SON B · KÖTÜ]
  T((AI tutor<br/>Gemini + koruma)) -.soru sorar.- K1 & K2 & K3
```

| Kişiselleştirme | Etki |
|-----------------|------|
| Seviye | Yeni başladım → ipucu hep açık · Biraz deneyimliyim → ipucu düğmede · Deneyimliyim → 60 sn geri sayım, süre dolarsa hızlı seçenek |
| Rol | Geliştirici / Test mühendisi / Ürün yöneticisi: anlatının bakış açısı ve her karardaki rol satırı |
| Hedef | Mimari / Test / KVKK: ilgili kararda "🎯 Hedefinle ilgili" rozeti, "Derinleş" paragrafı ve sonda "Bugünün dersi" |

**Tutor iki katmanlı:** Gemini'ye cevabı vermeme kuralları verilir; model yine de ele verirse
uygulamadaki **koruma katmanı** yanıtı göstermez, sahnenin Sokratik açılış sorusunu gösterir (🛡).
API yoksa ya da yanıt 8 sn'de gelmezse yedek soru gelir; oyun tutorsuz da baştan sona oynanır.

## Yerelde çalıştırma ve testler

```bash
cd app
npm install
npm run dev                 # http://localhost:3000 (GEMINI_API_KEY .env.local'da; yoksa tutor yedek soruyla çalışır)
npm run build && npx vite preview --port 4173
npx cypress run             # tüm E2E testleri + demo videosu → cypress/videos/
```

Cypress testleri Gemini'yi `cy.intercept` ile taklit eder; gerçek anahtar gerekmez ve testler
belirlenimlidir. KÖ-5, modelin cevabı ele verdiği en kötü durumu taklit edip koruma katmanını sınar.

## Etik ve gizlilik

Tüm hastane, sistem ve kişi adları kurgusaldır (Kuzey Şehir Hastanesi, RandevuNet). Uygulama hesap,
çerez ya da kayıt tutmaz; tutor kutusunun altında "Kişisel bilgi yazma" uyarısı vardır.
Eval setindeki kimlik numarası (12345678901) bilerek sahte seçildi.

## Kaynaklar

Stephenson (1995) *The Diamond Age*; Y Combinator RFS "The Primer" (2026); GitHub Spec Kit; Google
Stitch ve AI Studio; Cypress belgeleri; 6698 sayılı KVKK; Sommerville (2016) Bölüm 5 durum makineleri.
