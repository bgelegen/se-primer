// Mutasyon testinin (Stryker) yaşayan mutantlarından çıkan testler: K-1..K-13 ilk kampanya, K-14..K-20 ikinci kampanya.
// Her test hangi mutantı öldürdüğünü söyler; biri gerçek bir hata buldu (K-13).
import { describe, expect, it } from 'vitest';
import { checkGuard } from '../app/src/tutor';
import {
  calculateDecisionMinutes, createInitialSession, getCurrentTime, getFinalOutcome, getOptionText, makeDecision,
  type GameSession,
} from '../app/src/game';

describe('oyun mantığı', () => {
  it('O-1 süre parametresi verilmezse karar "süre doldu" sayılmaz (game.ts timedOut = false)', () => {
    const s = makeDecision({ ...createInitialSession(), state: 'K1' }, 'K1', 'A');
    expect(s.decisions.K1!.timedOut).toBe(false);
  });
  it('O-2 hiç karar yokken saat 08:00 (eksik kararlar toplama girmez)', () => {
    expect(getCurrentTime({})).toBe('08:00');
    expect(getCurrentTime({ K2: { choice: 'A', timedOut: false, minutes: 10 } })).toBe('08:10');
  });
  it('O-3 bilinmeyen karar kimliği süre eklemez ve durumu değiştirmez', () => {
    expect(calculateDecisionMinutes('K9' as never, 'A')).toBe(0);
    const s: GameSession = { ...createInitialSession(), state: 'K2' };
    expect(makeDecision(s, 'K9' as never, 'A').state).toBe('K2');
  });
  it('O-4 üç karardan biri eksikse son yoktur', () => {
    const d = { choice: 'A' as const, timedOut: false, minutes: 1 };
    for (const decisions of [{ K1: d, K2: d }, { K1: d, K3: d }, { K2: d, K3: d }]) {
      expect(getFinalOutcome({ ...createInitialSession(), decisions })).toBeNull();
    }
  });
  it('O-5 seçenek metni doğru karardan gelir', () => {
    expect(getOptionText('K3', 'B')).toBe('Ekibe olduğu gibi at');
  });
});

describe('koruma katmanı sınır vakaları', () => {
  const ele = (m: string, k: 'K1' | 'K2' | 'K3' = 'K1') => expect(checkGuard(m, k), m).toBe(true);
  const gecer = (m: string, k: 'K1' | 'K2' | 'K3' = 'K1') => expect(checkGuard(m, k), m).toBe(false);

  it('K-1 boş yanıt engellenmez', () => gecer(''));
  it('K-2 harf vermeden "doğru cevap budur" da ele vermedir', () => ele('Doğru cevap budur, şimdi düşün.'));
  it('K-3 boşluk varyantları', () => {
    ele('Doğru   cevap A.'); ele('cevap:A'); ele('Cevap B, düşün.'); ele('A   seçeneğini seç.');
  });
  it('K-4 "A doğru" (seçeneği kelimesi olmadan) ele vermedir', () => ele('A doğru, bence de.'));
  it('K-5 harf ve seçenek adı olmadan öneri fiili', () => ele('Bunu tercih et, sonra düşünürüz.', 'K2'));
  it('K-6 seçenek metni + öneri (başka hiçbir kural olmadan)', () => ele('Eski sürüme (v2.3) geri dön, en iyi yol bu.'));
  it('K-7 bilinmeyen sahne çökertmez', () => expect(checkGuard('merhaba', 'K9' as never)).toBe(false));
  it('K-8 "evet" cümle başında değilse onay sayılmaz', () => gecer('Sana evet ya da hayır diyemem, A ile B arasındaki farkı nasıl tartarsın?'));
  it('K-9 JSON tırnaksız da yakalanır', () => ele('dogru_secenek: B'));
  it('K-10 JSON boşluklu da yakalanır', () => ele('{"dogru_secenek" :  "A"}'));
  it('K-11 uzun çekim: "doğru seçeneğini söyleyeyim"', () => ele('Peki, doğru seçeneğini söyleyeyim: biraz düşün.'));
  it('K-12 boşluklu "doğru  cevabı söyleyeyim"', () => ele('Doğru  cevabı söyleyeyim mi?'));
  it('K-13 olumsuz çekimler engellenmez: söylemem / söylemeyeceğim / söyleyemem', () => {
    gecer('Doğru cevabı söylemem; şemayı nasıl kontrol edersin?');
    gecer('Doğru seçeneği söylemeyeceğim. Logda hangi bilgi gerekli?');
    gecer('Doğru cevabı söyleyemem. Sence neden?');
  });
  // İkinci kampanya: koruma kuralları birbirini kısmen örttüğü için bazı boşluk mutantları yaşıyordu.
  // Her vaka yalnızca TEK bir kuralın yakalayabildiği bir ele vermedir.
  it('K-14 iki boşluklu "doğru  cevap" (kural 1, \\s+)', () => ele('Doğru  cevap budur.'));
  it('K-15 iki nokta öncesi boşluk: "Cevap  : B" (kural 2)', () => ele('Cevap  : B'));
  it('K-16 "B şıkkı   daha iyi" (kural 3, ikinci boşluk grubu)', () => ele('B şıkkı   daha iyi.'));
  it('K-17 çekimli "doğru  seçeneği A" ve bitişik "doğru cevabı:A" (ek kural 1)', () => {
    ele('Doğru  seçeneği A.'); ele('Doğru cevabı:A'); ele('Doğru seçeneği  : B');
  });
  it('K-18 baştaki boşluktan sonra "Evet, A" (ek kural 2)', () => ele('  Evet, A.'));
  it('K-19 "doğru cevabı  söyleyeyim" (ek kural 4, ikinci boşluk)', () => ele('Doğru cevabı  söyleyeyim mi?'));
  it('K-20 bunlar reddetme biçiminde gelirse geçer', () => {
    gecer('Doğru seçeneği söylemem; A ile B arasındaki fark ne olabilir?');
    gecer('Evet ya da hayır diyemem. Sence hangi risk daha büyük?');
  });
});
