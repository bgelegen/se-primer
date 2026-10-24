// Durum makinesi (spec §7) — app/src/game.ts birim testleri.
import { describe, expect, it } from 'vitest';
import {
  advanceFromSonuc, createInitialSession, formatClock, getCurrentTime, getFinalOutcome,
  replayGame, startCrisis, switchProfile, type GameSession,
} from '../app/src/game';
import { oyna, type Yol } from './yardimci';

// spec §6 "Saat" + §7 "Son kuralı" tablosu, birebir
const TABLO: Array<[string, string, boolean, string]> = [
  ['AAA', '08:25', true, '08:25 · Sistem ayakta, veri güvende'],
  ['AAB', '08:23', false, 'Sistem ayakta ama KVKK ihlali'],
  ['ABA', '08:17', true, '08:17 · Sistem ayakta, veri güvende'],
  ['ABB', '08:15', false, 'Sistem ayakta ama KVKK ihlali'],
  ['BAA', '08:19', true, '08:19 · Sistem ayakta, veri güvende'],
  ['BAB', '08:17', false, 'Sistem ayakta ama KVKK ihlali'],
  ['BBA', '08:41', false, 'Sistem ayakta ama ikinci kesinti yaşandı'],
  ['BBB', '08:39', false, 'İkinci kesinti ve KVKK ihlali'],
];

describe('8 yolun hepsi (spec §7 son kuralı)', () => {
  it.each(TABLO)('%s → %s', (yol, saat, iyi, baslik) => {
    const s = oyna([...yol] as Yol);
    const son = getFinalOutcome(s)!;
    expect(getCurrentTime(s.decisions)).toBe(saat);
    expect(son.isGood).toBe(iyi);
    expect(son.tag).toBe(iyi ? 'SON A · İYİ' : 'SON B · KÖTÜ');
    expect(son.getTitle(saat)).toBe(baslik);
  });
});

describe('Geçişler', () => {
  it('üç seçim yapılmadan krize girilmez', () => {
    const eksikler: Array<Partial<GameSession>> = [
      { seviye: null, rol: 'test', hedef: 'kvkk' }, { seviye: 'yeni', rol: null, hedef: 'kvkk' },
      { seviye: 'yeni', rol: 'test', hedef: null }, {},
    ];
    for (const e of eksikler) expect(startCrisis({ ...createInitialSession(), ...e }).state).toBe('GIRIS');
  });

  it('süre dolması kayda geçer, hızlı seçeneğin süresiyle sayılır', () => {
    const s = oyna(['B', 'A', 'A'], [true, false, false]);
    expect(s.decisions.K1).toEqual({ choice: 'B', timedOut: true, minutes: 6 });
  });

  it('Tekrar oyna profili korur, kararları siler', () => {
    const s = replayGame(oyna(['A', 'A', 'A']));
    expect(s.state).toBe('S0');
    expect(s.decisions).toEqual({});
    expect([s.seviye, s.rol, s.hedef]).toEqual(['orta', 'gelistirici', 'test']);
  });

  it('Profili değiştir her şeyi sıfırlar', () => {
    expect(switchProfile()).toEqual(createInitialSession());
  });

  it('sonuç durumu dışında Devam etkisizdir', () => {
    const s = createInitialSession();
    expect(advanceFromSonuc(s)).toBe(s);
  });

  it('karar verilmeden son yoktur', () => {
    expect(getFinalOutcome(createInitialSession())).toBeNull();
  });

  it('saat biçimi', () => {
    expect(formatClock(480)).toBe('08:00');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(1439)).toBe('23:59');
  });
});
