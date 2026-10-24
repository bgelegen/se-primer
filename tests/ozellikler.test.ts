// Özellik tabanlı testler (fast-check): rastgele yollar ve rastgele metinler üzerinde değişmezler.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkGuard } from '../app/src/tutor';
import { DECISIONS, GOALS, ROLES, type KararId, type SecenekId } from '../app/src/content';
import { formatClock, getCurrentTime, getFinalOutcome, INITIAL_MINUTES } from '../app/src/game';
import { oyna } from './yardimci';

const harf = fc.constantFrom<SecenekId>('A', 'B');
const yol = fc.tuple(harf, harf, harf);
const sure = fc.tuple(fc.boolean(), fc.boolean(), fc.boolean());
const dk = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));

describe('Oyun değişmezleri', () => {
  it('Ö1 belirlenebilirlik: aynı seçimler hep aynı saati ve sonu verir', () => {
    fc.assert(fc.property(yol, sure, sure, (y, s1, s2) => {
      const a = oyna(y, s1), b = oyna(y, s2);
      return getCurrentTime(a.decisions) === getCurrentTime(b.decisions)
        && getFinalOutcome(a)!.tag === getFinalOutcome(b)!.tag;
    }));
  });

  it('Ö2 son kuralı: iyi son ⇔ K3=A ∧ ¬(K1=B ∧ K2=B)', () => {
    fc.assert(fc.property(yol, ([k1, k2, k3]) =>
      getFinalOutcome(oyna([k1, k2, k3]))!.isGood === (k3 === 'A' && !(k1 === 'B' && k2 === 'B'))));
  });

  it('Ö3 KVKK tek başına sonu bozar: K3 A→B iyileştirmez', () => {
    fc.assert(fc.property(harf, harf, (k1, k2) =>
      !(getFinalOutcome(oyna([k1, k2, 'B']))!.isGood) || getFinalOutcome(oyna([k1, k2, 'A']))!.isGood));
  });

  it('Ö4 saat ilerler: her karar en az 1 dk ekler, sonuç 08:15–08:41 aralığında', () => {
    fc.assert(fc.property(yol, (y) => {
      const s = oyna(y);
      const t = dk(getCurrentTime(s.decisions));
      return Object.values(s.decisions).every((d) => d!.minutes >= 1) && t >= dk('08:15') && t <= dk('08:41');
    }));
  });

  it('Ö5 testi atlamanın bedeli: K1=B iken K2=B, K2=A\'dan en az 20 dk daha uzun sürer', () => {
    fc.assert(fc.property(harf, (k3) =>
      dk(getCurrentTime(oyna(['B', 'B', k3]).decisions)) - dk(getCurrentTime(oyna(['B', 'A', k3]).decisions)) >= 20));
  });

  it('Ö6 saat biçimi gidiş-dönüş', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1439 }), (m) => dk(formatClock(m)) === m));
    expect(formatClock(INITIAL_MINUTES)).toBe('08:00');
  });
});

describe('İçerik değişmezleri', () => {
  it('Ö7 her rol × her karar için rol satırı, her hedef için bir karar var', () => {
    for (const k of ['K1', 'K2', 'K3'] as KararId[]) {
      for (const r of Object.keys(ROLES)) expect(DECISIONS[k].roleLines[r as keyof typeof ROLES].length).toBeGreaterThan(10);
    }
    expect(new Set(Object.values(GOALS).map((g) => g.targetDecision))).toEqual(new Set(['K1', 'K2', 'K3']));
  });

  it('Ö8 seçenek metinleri cevabı ele vermez (risk/öneri sözcüğü yok)', () => {
    for (const k of ['K1', 'K2', 'K3'] as KararId[]) {
      for (const h of ['A', 'B'] as SecenekId[]) {
        expect(DECISIONS[k].options[h].text).not.toMatch(/risk|güvenli|önerilen|doğru|yanlış|tehlikeli/i);
      }
    }
  });
});

describe('Koruma katmanı değişmezleri', () => {
  const karar = fc.constantFrom<KararId>('K1', 'K2', 'K3');
  const eleVeren = fc.oneof(
    fc.tuple(fc.constantFrom('Doğru cevap', 'Doğru seçenek', 'doğru şık', 'Cevap:', 'Doğru seçeneğin', 'Doğru cevabın'), harf)
      .map(([o, h]) => `${o} ${h}.`),
    fc.tuple(fc.constantFrom('Evet,', 'Hayır,', 'evet'), harf, fc.constantFrom('doğru.', 'yanlış.', 'kesinlikle'))
      .map(([e, h, s]) => `${e} ${h} ${s}`),
    harf.map((h) => `{"dogru_secenek": "${h}"}`),
    harf.map((h) => `${h} seçeneğini seç.`),
  );
  const reddeden = fc.tuple(fc.constantFrom('Doğru seçeneği', 'Doğru cevabı', 'Hangi seçeneğin doğru olduğunu'),
    fc.constantFrom('söyleyemem.', 'ben vermeyeyim.', 'doğrudan söylemem.'),
    fc.constantFrom('Sence en küçük kanıt ne olurdu?', 'Logda hangi bilgiye ihtiyaç var?', 'Şema değişti mi?'))
    .map((p) => p.join(' '));

  it('Ö9 şablonla üretilen her ele verme yakalanır', () => {
    fc.assert(fc.property(eleVeren, karar, (m, k) => checkGuard(m, k)));
  });

  it('Ö10 reddeden Sokratik yanıt engellenmez (yanlış alarm yok)', () => {
    fc.assert(fc.property(reddeden, karar, (m, k) => !checkGuard(m, k)));
  });
});
