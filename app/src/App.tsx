/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Seviye, Rol, Hedef, SecenekId } from './content';
import {
  createInitialSession,
  startCrisis,
  enterCrisis,
  makeDecision,
  advanceFromSonuc,
  replayGame,
  switchProfile,
  getCurrentTime,
  GameSession,
} from './game';
import { GirisScreen } from './components/GirisScreen';
import { S0Screen } from './components/S0Screen';
import { SahneScreen } from './components/SahneScreen';
import { SonScreen } from './components/SonScreen';
import { EvalScreen } from './components/EvalScreen';

export default function App() {
  const [session, setSession] = useState<GameSession>(createInitialSession());
  const [isEvalOpen, setIsEvalOpen] = useState(false);

  const handleSelectSeviye = (s: Seviye) => {
    setSession((prev) => ({ ...prev, seviye: s }));
  };

  const handleSelectRol = (r: Rol) => {
    setSession((prev) => ({ ...prev, rol: r }));
  };

  const handleSelectHedef = (h: Hedef) => {
    setSession((prev) => ({ ...prev, hedef: h }));
  };

  const handleStartShift = () => {
    setSession((prev) => startCrisis(prev));
  };

  const handleEnterCrisis = () => {
    setSession((prev) => enterCrisis(prev));
  };

  const handleMakeDecision = (choice: SecenekId, timedOut = false) => {
    setSession((prev) => {
      if (prev.state === 'K1') {
        return makeDecision(prev, 'K1', choice, timedOut);
      }
      if (prev.state === 'K2') {
        return makeDecision(prev, 'K2', choice, timedOut);
      }
      if (prev.state === 'K3') {
        return makeDecision(prev, 'K3', choice, timedOut);
      }
      return prev;
    });
  };

  const handleAdvance = () => {
    setSession((prev) => advanceFromSonuc(prev));
  };

  const handleReplay = () => {
    setSession((prev) => replayGame(prev));
  };

  const handleSwitchProfile = () => {
    setSession(switchProfile());
  };

  if (isEvalOpen) {
    return (
      <main className="min-h-screen bg-[#0F1B33] text-[#D8E2FF]">
        <EvalScreen onClose={() => setIsEvalOpen(false)} />
      </main>
    );
  }

  const currentTime = getCurrentTime(session.decisions);

  return (
    <main className="min-h-screen bg-[#0F1B33] text-[#D8E2FF]">
      {session.state === 'GIRIS' && (
        <GirisScreen
          seviye={session.seviye}
          rol={session.rol}
          hedef={session.hedef}
          onSelectSeviye={handleSelectSeviye}
          onSelectRol={handleSelectRol}
          onSelectHedef={handleSelectHedef}
          onStart={handleStartShift}
          onOpenEval={() => setIsEvalOpen(true)}
        />
      )}

      {session.state === 'S0' && session.rol && (
        <S0Screen
          rol={session.rol}
          timeStr={currentTime}
          onEnterCrisis={handleEnterCrisis}
        />
      )}

      {(session.state === 'K1' || session.state === 'K1_SONUC') &&
        session.seviye &&
        session.rol &&
        session.hedef && (
          <SahneScreen
            kararId="K1"
            isResult={session.state === 'K1_SONUC'}
            seviye={session.seviye}
            rol={session.rol}
            hedef={session.hedef}
            timeStr={currentTime}
            prevDecisions={session.decisions}
            currentDecisionRecord={session.decisions.K1}
            onMakeDecision={(c, timedOut) => handleMakeDecision(c, timedOut)}
            onAdvance={handleAdvance}
          />
        )}

      {(session.state === 'K2' || session.state === 'K2_SONUC') &&
        session.seviye &&
        session.rol &&
        session.hedef && (
          <SahneScreen
            kararId="K2"
            isResult={session.state === 'K2_SONUC'}
            seviye={session.seviye}
            rol={session.rol}
            hedef={session.hedef}
            timeStr={currentTime}
            prevDecisions={session.decisions}
            currentDecisionRecord={session.decisions.K2}
            onMakeDecision={(c, timedOut) => handleMakeDecision(c, timedOut)}
            onAdvance={handleAdvance}
          />
        )}

      {(session.state === 'K3' || session.state === 'K3_SONUC') &&
        session.seviye &&
        session.rol &&
        session.hedef && (
          <SahneScreen
            kararId="K3"
            isResult={session.state === 'K3_SONUC'}
            seviye={session.seviye}
            rol={session.rol}
            hedef={session.hedef}
            timeStr={currentTime}
            prevDecisions={session.decisions}
            currentDecisionRecord={session.decisions.K3}
            onMakeDecision={(c, timedOut) => handleMakeDecision(c, timedOut)}
            onAdvance={handleAdvance}
          />
        )}

      {session.state === 'SON' && session.hedef && (
        <SonScreen
          session={session}
          onReplay={handleReplay}
          onSwitchProfile={handleSwitchProfile}
        />
      )}
    </main>
  );
}
