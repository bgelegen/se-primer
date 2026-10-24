# AI Studio süreci

Uygulama Google AI Studio **Build** modunda, model **Gemini 3.8 Flash** ile üretildi.
Proje: `aistudio.google.com/apps/732ee0aa-32f6-480b-b0b6-ea28055195c2` ·
Paylaşım linki: <https://ai.studio/apps/732ee0aa-32f6-480b-b0b6-ea28055195c2?fullscreenApplet=true>

## 1. İlk istem: ekranlar + spec

Ekler (9 dosya): Stitch'in 3 ekranı (`design/*/screen.png` + `design/*/code.html`), Stitch'in
[`DESIGN.md`](../DESIGN.md)'si, [`spec.md`](../spec.md) ve teknik talimat
[`aistudio-talimat.md`](aistudio-talimat.md) (test kancaları, tutor sistem talimatı, koruma kuralları,
20 öğrenci cevabıyla değerlendirme ekranı).

İstem metni:

> Ekteki TALIMAT.md'deki teknik gereksinimlere ve spec.md'ye birebir uyarak SE Primer mobil web
> uygulamasını yap. Görsel tasarım ekteki 3 Stitch ekranına (PNG + HTML) ve DESIGN.md'ye uysun;
> TALIMAT.md'deki 'DESIGN DEVIATIONS' maddelerine dikkat et (seçenek kartlarında risk etiketi yok).
> Tüm arayüz metni Türkçe ve spec.md'den birebir.

Sonuç: 8 dk 42 sn'de 12 dosya (`app/src/`), derleme başarılı.

## 2. Düzeltme istemleri (her biri bir ölçümden çıktı)

| # | Nereden çıktı | İstem (özet) | Değişen dosya |
|---|---------------|--------------|---------------|
| 2 | Yerel duman testi: son ekranında `saat` kancası yok; 360 px'te ikon fontu yüklenmeden yatay kaydırma (397 px) | Son ekranındaki saate `data-testid="saat"`; `html, body { overflow-x: clip }`, ikon span'leri sabit boyut | `SonScreen.tsx`, `index.css`, `GirisScreen.tsx` |
| 3 | **Tutor eval v1:** 20 yanıtın 20'si yarım | `maxOutputTokens` 120 → 1024, `thinkingLevel: LOW`, yalnızca düşünce olmayan parçalar | `tutor.ts` |
| 4 | **Koruma ölçümü:** 10 ele veren yanıtın 4'ü kaçtı (Türkçe çekim, onay/ret, JSON) | `checkGuard`'a 4 yeni kural (`\p{L}` ile) | `tutor.ts` |

Her adımdan sonra kod AI Studio editöründen alınıp `app/`'e kondu; `app/src/` AI Studio'daki kodla
birebir aynıdır. `app/package.json`, `vite.config.ts`, `tsconfig.json` ve `src/main.tsx` AI Studio'nun
editörde göstermediği şablon dosyalarıdır; yerelde ve CI'da derlemek için AI Studio şablonuna göre
yazıldı. `vite.config.ts`'te bir ek var: Vite istemci derlemesinde `process.env`'i boş nesneye
çevirdiği için anahtar yerelde hiç okunmuyordu; `process` tanımı açıkça verildi.
