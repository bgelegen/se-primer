/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Seviye, Rol, Hedef, SecenekId, KararId, getEnding, EndingContent, DECISIONS } from './content';

export type GameState =
  | 'GIRIS'
  | 'S0'
  | 'K1'
  | 'K1_SONUC'
  | 'K2'
  | 'K2_SONUC'
  | 'K3'
  | 'K3_SONUC'
  | 'SON';

export interface DecisionRecord {
  choice: SecenekId;
  timedOut: boolean;
  minutes: number;
}

export interface GameSession {
  state: GameState;
  seviye: Seviye | null;
  rol: Rol | null;
  hedef: Hedef | null;
  decisions: {
    K1?: DecisionRecord;
    K2?: DecisionRecord;
    K3?: DecisionRecord;
  };
}

export const INITIAL_MINUTES = 8 * 60; // 08:00 = 480 minutes

export function formatClock(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateElapsedMinutes(decisions: {
  K1?: DecisionRecord;
  K2?: DecisionRecord;
  K3?: DecisionRecord;
}): number {
  let minutes = 0;
  if (decisions.K1) minutes += decisions.K1.minutes;
  if (decisions.K2) minutes += decisions.K2.minutes;
  if (decisions.K3) minutes += decisions.K3.minutes;
  return minutes;
}

export function getCurrentTime(decisions: {
  K1?: DecisionRecord;
  K2?: DecisionRecord;
  K3?: DecisionRecord;
}): string {
  return formatClock(INITIAL_MINUTES + calculateElapsedMinutes(decisions));
}

export function calculateDecisionMinutes(
  kararId: KararId,
  choice: SecenekId,
  k1Choice?: SecenekId
): number {
  if (kararId === 'K1') {
    return choice === 'A' ? 12 : 6;
  }
  if (kararId === 'K2') {
    if (choice === 'A') {
      return 10;
    }
    // choice === 'B'
    return k1Choice === 'B' ? 32 : 2; // +2 + 30
  }
  if (kararId === 'K3') {
    return choice === 'A' ? 3 : 1;
  }
  return 0;
}

export function createInitialSession(): GameSession {
  return {
    state: 'GIRIS',
    seviye: null,
    rol: null,
    hedef: null,
    decisions: {},
  };
}

export function startCrisis(session: GameSession): GameSession {
  if (!session.seviye || !session.rol || !session.hedef) {
    return session;
  }
  return {
    ...session,
    state: 'S0',
  };
}

export function enterCrisis(session: GameSession): GameSession {
  return {
    ...session,
    state: 'K1',
  };
}

export function makeDecision(
  session: GameSession,
  kararId: KararId,
  choice: SecenekId,
  timedOut = false
): GameSession {
  const k1Choice = session.decisions.K1?.choice;
  const minutes = calculateDecisionMinutes(kararId, choice, k1Choice);
  const updatedDecisions = {
    ...session.decisions,
    [kararId]: { choice, timedOut, minutes },
  };

  let nextState: GameState = session.state;
  if (kararId === 'K1') nextState = 'K1_SONUC';
  else if (kararId === 'K2') nextState = 'K2_SONUC';
  else if (kararId === 'K3') nextState = 'K3_SONUC';

  return {
    ...session,
    state: nextState,
    decisions: updatedDecisions,
  };
}

export function advanceFromSonuc(session: GameSession): GameSession {
  if (session.state === 'K1_SONUC') {
    return { ...session, state: 'K2' };
  }
  if (session.state === 'K2_SONUC') {
    return { ...session, state: 'K3' };
  }
  if (session.state === 'K3_SONUC') {
    return { ...session, state: 'SON' };
  }
  return session;
}

export function replayGame(session: GameSession): GameSession {
  // Same profile, clear decisions, restart from S0
  return {
    ...session,
    state: 'S0',
    decisions: {},
  };
}

export function switchProfile(): GameSession {
  // Clear profile and decisions, back to GIRIS
  return createInitialSession();
}

export function getFinalOutcome(session: GameSession): EndingContent | null {
  const k1 = session.decisions.K1?.choice;
  const k2 = session.decisions.K2?.choice;
  const k3 = session.decisions.K3?.choice;
  if (!k1 || !k2 || !k3) return null;
  return getEnding(k1, k2, k3);
}

export function getOptionText(kararId: KararId, choice: SecenekId): string {
  return DECISIONS[kararId].options[choice].text;
}
