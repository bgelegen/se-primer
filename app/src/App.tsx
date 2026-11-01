/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Seviye, Rol, Hedef, SecenekId, KararId, DECISIONS } from './content';
import { Olcer, Ozellikler, toplamaModuAyarla } from './olcum';
import { modeliYukle, nobetArkadasiDevrede, tahmin } from './model';
import { VeriScreen } from './components/VeriScreen';
import { PariteScreen } from './components/PariteScreen';
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
  const arama = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [isVeriOpen, setIsVeriOpen] = useState(arama.has('veri'));

  // Nöbet Arkadaşı (spec §13): davranış ölçümü + model
  const olcer = useRef(new Olcer());
  const [sahneModel, setSahneModel] = useState<{ kararId: KararId; oz: Ozellikler; p: number | null; devrede: boolean } | null>(null);
  const sahneModelRef = useRef(sahneModel);
  sahneModelRef.current = sahneModel;

  useEffect(() => {
    toplamaModuAyarla();
    olcer.current.girisAcildi();
    modeliYukle(); // önceden indir: ilk karar ekranında hazır olsun
  }, []);

  // Karar ekranı açıldığında özellikleri sabitle ve modeli bir kez çalıştır.
  useEffect(() => {
    const k = session.state;
    if ((k !== 'K1' && k !== 'K2' && k !== 'K3') || !session.seviye || !session.hedef) return;
    const oz = olcer.current.sahneAcildi(k, session.seviye, session.hedef === DECISIONS[k].targetGoal, session.seviye === 'yeni');
    setSahneModel({ kararId: k, oz, p: null, devrede: false });
    let iptal = false;
    tahmin(oz).then((p) => {
      if (iptal) return;
      setSahneModel({ kararId: k, oz, p, devrede: nobetArkadasiDevrede(k, p) });
    });
    return () => {
      iptal = true;
    };
  }, [session.state]);

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
    olcer.current.baslaTiklandi();
    setSession((prev) => startCrisis(prev));
  };

  const handleEnterCrisis = () => {
    olcer.current.krizeGirildi();
    setSession((prev) => enterCrisis(prev));
  };

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handleMakeDecision = (choice: SecenekId, timedOut = false) => {
    const sm = sahneModelRef.current;
    const st = sessionRef.current;
    if (sm && st.state === sm.kararId && st.rol && st.hedef) {
      olcer.current.kararVerildi({
        kararId: sm.kararId, secim: choice, sureDoldu: timedOut, ozellikler: sm.oz,
        rol: st.rol, hedef: st.hedef, p: sm.p, mudahale: sm.devrede,
      });
    }
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
    olcer.current.yeniOturum();
    setSession((prev) => replayGame(prev));
  };

  const handleSwitchProfile = () => {
    olcer.current = new Olcer();
    setSession(switchProfile());
  };

  if (arama.has('parite')) {
    return (
      <main className="min-h-screen bg-[#0F1B33] text-[#D8E2FF]">
        <PariteScreen />
      </main>
    );
  }

  if (isVeriOpen) {
    return (
      <main className="min-h-screen bg-[#0F1B33] text-[#D8E2FF]">
        <VeriScreen onClose={() => setIsVeriOpen(false)} />
      </main>
    );
  }

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
          onOpenVeri={() => setIsVeriOpen(true)}
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
            modelP={sahneModel?.kararId === 'K1' ? sahneModel.p : null}
            nobetArkadasi={sahneModel?.kararId === 'K1' ? sahneModel.devrede : false}
            onIpucu={() => olcer.current.ipucuGoruldu()}
            onTutorMesaji={() => olcer.current.tutorMesaji()}
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
            modelP={sahneModel?.kararId === 'K2' ? sahneModel.p : null}
            nobetArkadasi={sahneModel?.kararId === 'K2' ? sahneModel.devrede : false}
            onIpucu={() => olcer.current.ipucuGoruldu()}
            onTutorMesaji={() => olcer.current.tutorMesaji()}
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
            modelP={sahneModel?.kararId === 'K3' ? sahneModel.p : null}
            nobetArkadasi={sahneModel?.kararId === 'K3' ? sahneModel.devrede : false}
            onIpucu={() => olcer.current.ipucuGoruldu()}
            onTutorMesaji={() => olcer.current.tutorMesaji()}
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
