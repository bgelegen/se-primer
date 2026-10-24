import { expect } from 'vitest';
import {
  advanceFromSonuc, createInitialSession, enterCrisis, makeDecision, startCrisis, type GameSession,
} from '../app/src/game';
import type { SecenekId } from '../app/src/content';

export type Yol = [SecenekId, SecenekId, SecenekId];

/** Bir oyunu baştan sona oynatır; her adımda durum makinesinin spec'teki durumunu da denetler. */
export function oyna(yol: Yol, sureDoldu: [boolean, boolean, boolean] = [false, false, false]): GameSession {
  let s: GameSession = { ...createInitialSession(), seviye: 'orta', rol: 'gelistirici', hedef: 'test' };
  s = startCrisis(s); expect(s.state).toBe('S0');
  s = enterCrisis(s); expect(s.state).toBe('K1');
  (['K1', 'K2', 'K3'] as const).forEach((k, i) => {
    expect(s.state).toBe(k);
    s = makeDecision(s, k, yol[i], sureDoldu[i]);
    expect(s.state).toBe(`${k}_SONUC`);
    s = advanceFromSonuc(s);
  });
  expect(s.state).toBe('SON');
  return s;
}

