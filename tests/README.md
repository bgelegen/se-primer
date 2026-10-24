# Testler

Her katman ayrı bir soruyu cevaplar. Hepsi her gönderimde GitHub Actions'ta koşar
([`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml)); sonuçlar `ci-videolar` dalına yazılır.

| Katman | Dosya | Soru |
|--------|-------|------|
| Durum makinesi | [`oyun.test.ts`](oyun.test.ts) | 8 yolun her biri doğru saate ve sona varıyor mu? |
| Spec uyumu | [`spec_uyum.test.ts`](spec_uyum.test.ts) | `spec.md`'deki tablolar (§5–§7) koddaki metin, süre ve son kuralıyla **birebir** aynı mı? Spec değişip kod değişmezse (ya da tersi) test kırılır. |
| Özellik tabanlı | [`ozellikler.test.ts`](ozellikler.test.ts) | fast-check ile rastgele yollar ve rastgele ele verme cümleleri: 10 değişmez (belirlenimlilik, son kuralı, saat sınırları, seçenek metninde ipucu kelimesi yok, koruma rastgele ele vermeleri yakalar, reddetmeleri engellemez…) |
| Koruma vakaları | [`koruma.test.ts`](koruma.test.ts) | 10 ele veren + 6 güvenli vaka ve v2 eval'in 20 canlı yanıtı |
| Mutasyon boşlukları | [`mutasyon_bosluklari.test.ts`](mutasyon_bosluklari.test.ts) | Stryker'ın yaşayan mutantlarından yazılan sınır vakaları |
| E2E | [`../cypress/e2e/`](../cypress/e2e/) | 6 kabul örneği, 8 yol + yol haritası, dönüşler, 360 px, tutor çevrimdışı, axe-core |

```bash
npx vitest run          # birim + özellik + spec uyumu → tests/sonuc/junit.xml
npx stryker run         # mutasyon testi → tests/sonuc/mutasyon.html
```

## Mutasyon testi (Stryker)

Stryker `game.ts`, `content.ts` ve `tutor.ts`'teki koruma fonksiyonunu bilerek bozar (bir koşulu
tersine çevirir, bir regex'te `\s+`'yı `\s` yapar, bir metni boşaltır…) ve testlerin bunu fark edip
etmediğine bakar. Fark edilmeyen ("yaşayan") her mutant ya eksik bir test ya da gereksiz bir koddur.

| Kampanya | Skor | Ne oldu |
|----------|------|---------|
| 1 | %76,4 | Yaşayan mutantlardan K-1…K-13 yazıldı. **K-13 gerçek bir hata buldu:** koruma kuralı `doğru cevabı söyle…` olumsuz çekimi tanımıyordu; tutor "Doğru cevabı *söylemem*" dediğinde, yani tam istenen davranışta, yanıt engelleniyordu. AI Studio'da `söyle(?!(ye)?m[ae])` ile düzeltildi. |
| 2 | %93,9 | Yol haritası ve kırmızı takım eklendikten sonraki kod. `game.ts` %100. |
| 3 | **%96,3** | Koruma kuralları birbirini kısmen örttüğü için yaşayan boşluk mutantlarına K-14…K-20 yazıldı (her vaka yalnızca tek bir kuralın yakalayabildiği bir ele verme). |

Kalan 17 mutant bilerek bırakıldı:

- **12 · `content.ts`:** Material ikon adları ve giriş çiplerinin alt açıklamaları. Görsel metin; spec'te
  yok, oyun davranışını değiştirmez. Bunlara test yazmak testleri tasarıma kilitlerdi.
- **5 · `tutor.ts`:** eşdeğer mutantlar. `if (!rawText) return false` silinse de boş metin hiçbir kurala
  uymaz; `(A|B)\s*…` içindeki boşluk mutantları ancak harfle fiil bitişik yazılırsa ("Adoğru")
  ayrışır; `şık\p{L}*` mutantını ilk kural (`doğru\s+şık`) zaten örter.
