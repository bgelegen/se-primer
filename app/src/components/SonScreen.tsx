/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Hedef, GOALS, DECISIONS } from '../content';
import { GameSession, getFinalOutcome, getCurrentTime } from '../game';

interface SonScreenProps {
  session: GameSession;
  onReplay: () => void;
  onSwitchProfile: () => void;
}

export const SonScreen: React.FC<SonScreenProps> = ({
  session,
  onReplay,
  onSwitchProfile,
}) => {
  const outcome = getFinalOutcome(session);
  const currentTime = getCurrentTime(session.decisions);
  const hedef = session.hedef as Hedef;
  const goalInfo = GOALS[hedef];

  const titleText = outcome
    ? outcome.getTitle(currentTime)
    : 'Nöbet Tamamlandı';

  const k1Record = session.decisions.K1;
  const k2Record = session.decisions.K2;
  const k3Record = session.decisions.K3;

  return (
    <div
      data-testid="son"
      className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 py-5 gap-5 pb-10"
    >
      {/* Top Shift Status */}
      <div className="flex items-center justify-between pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131F37] shadow-sm border border-[#29344E]">
          <span
            className={`w-2 h-2 rounded-full ${
              outcome?.isGood
                ? 'bg-[#74DEA6] shadow-[0_0_8px_#74dea6]'
                : 'bg-[#D9483B] shadow-[0_0_8px_#d9483b]'
            }`}
          />
          <span
            className={`text-[11px] font-bold tracking-wide uppercase ${
              outcome?.isGood ? 'text-[#74DEA6]' : 'text-[#FFB4AB]'
            }`}
          >
            Nöbet Tamamlandı
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#CAC6BD] text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[16px] text-[#FFBC7C]">
            wb_twilight
          </span>
          <span>Sabah Devir Saati</span>
        </div>
      </div>

      {/* Hero Incident Result Panel */}
      <div className="relative overflow-hidden rounded-xl bg-[#1E2A42] p-5 shadow-xl border border-[#29344E]">
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          {/* Ending Verdict Pill */}
          <div
            data-testid="son-etiket"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold shadow-sm ${
              outcome?.isGood
                ? 'bg-[#74DEA6]/20 text-[#74DEA6] border border-[#74DEA6]/40'
                : 'bg-[#D9483B]/20 text-[#FFB4AB] border border-[#D9483B]/40'
            }`}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {outcome?.isGood ? 'check_circle' : 'error'}
            </span>
            <span>{outcome?.tag}</span>
          </div>

          {/* Clock Display */}
          <div className="flex flex-col items-center">
            <span
              data-testid="saat"
              className="font-serif text-[42px] leading-none text-[#FFBC7C] font-bold tracking-tight"
            >
              {currentTime}
            </span>
            <span className="text-[10px] text-[#CAC6BD] uppercase tracking-widest mt-1">
              Devir Saati
            </span>
          </div>

          {/* Main Headline & Description */}
          <h2
            data-testid="son-baslik"
            className="font-serif text-[22px] font-bold text-[#D8E2FF] leading-snug"
          >
            {titleText}
          </h2>

          <p className="font-serif text-[14px] text-[#CAC6BD] max-w-sm leading-relaxed">
            {outcome?.description}
          </p>
        </div>
      </div>

      {/* Tactile Engineering Notebook / Incident Log Sheet */}
      <div className="relative rounded-xl bg-[#FBF6EC] text-[#182238] p-5 shadow-xl border border-[#E7E2D8] flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#182238]/10 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[#8C5000] text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history_edu
            </span>
            <h3 className="font-serif text-[16px] text-[#182238] font-bold tracking-tight">
              Nöbet Karar Özeti
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#182238]/10 text-[#182238]">
            3 / 3 Karar
          </span>
        </div>

        {/* Notebook Decisions Stack */}
        <div className="flex flex-col gap-2.5">
          {/* Decision 1: Mimari */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F3EDE0]">
            <div className="w-8 h-8 rounded-full bg-[#182238]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[#182238] text-[18px]">
                database
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-[#182238]">Mimari</span>
                <span className="text-[#8C5000] text-xs">•</span>
                <span className="text-[13px] font-bold text-[#182238]">
                  {k1Record ? DECISIONS.K1.options[k1Record.choice].text : '-'}
                </span>
                {k1Record?.timedOut && (
                  <span className="text-[10px] font-bold bg-[#D9483B]/20 text-[#D9483B] px-1.5 py-0.5 rounded">
                    ⏱ Süre doldu
                  </span>
                )}
              </div>
              <p className="font-serif text-[12px] text-[#3E495D] mt-0.5 leading-snug">
                {k1Record?.choice === 'A'
                  ? 'Kritik yük anında güvenli geri dönüş seçildi'
                  : 'Canlıda denenmemiş yama yapıldı'}
              </p>
            </div>
          </div>

          {/* Decision 2: Test */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F3EDE0]">
            <div className="w-8 h-8 rounded-full bg-[#182238]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[#182238] text-[18px]">
                rule
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-[#182238]">Test</span>
                <span className="text-[#8C5000] text-xs">•</span>
                <span className="text-[13px] font-bold text-[#182238]">
                  {k2Record ? DECISIONS.K2.options[k2Record.choice].text : '-'}
                </span>
                {k2Record?.timedOut && (
                  <span className="text-[10px] font-bold bg-[#D9483B]/20 text-[#D9483B] px-1.5 py-0.5 rounded">
                    ⏱ Süre doldu
                  </span>
                )}
              </div>
              <p className="font-serif text-[12px] text-[#3E495D] mt-0.5 leading-snug">
                {k2Record?.choice === 'A'
                  ? 'Hızlı duman testiyle canlı hatası kontrol altına alındı'
                  : k1Record?.choice === 'B'
                  ? 'Denenmemiş yama hemen yayına girdi ve ikinci kez çöktü'
                  : 'Test atlandı ve doğrudan yayına alındı'}
              </p>
            </div>
          </div>

          {/* Decision 3: KVKK */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F3EDE0]">
            <div className="w-8 h-8 rounded-full bg-[#182238]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[#182238] text-[18px]">
                lock
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-[#182238]">KVKK</span>
                <span className="text-[#8C5000] text-xs">•</span>
                <span className="text-[13px] font-bold text-[#182238]">
                  {k3Record ? DECISIONS.K3.options[k3Record.choice].text : '-'}
                </span>
                {k3Record?.timedOut && (
                  <span className="text-[10px] font-bold bg-[#D9483B]/20 text-[#D9483B] px-1.5 py-0.5 rounded">
                    ⏱ Süre doldu
                  </span>
                )}
              </div>
              <p className="font-serif text-[12px] text-[#3E495D] mt-0.5 leading-snug">
                {k3Record?.choice === 'A'
                  ? 'Hasta TCKN ve hassas verileri loglardan arındırıldı'
                  : 'Gerçek hasta verisi korumasız şekilde paylaşıldı'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warm Highlight Card: Bugünün Dersi */}
      <div className="rounded-xl bg-[#1E2A42] p-5 shadow-lg border border-[#29344E] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[16px] text-[#FFBC7C] font-bold">
            💡 Bugünün dersi
          </span>
        </div>
        <p
          data-testid="son-ders"
          className="font-serif text-[14px] text-[#D8E2FF] leading-relaxed italic"
        >
          {goalInfo.lesson}
        </p>
      </div>

      {/* Interactive Action Buttons */}
      <div className="flex flex-col gap-3 pt-1">
        {/* Primary Button: Tekrar oyna */}
        <button
          type="button"
          data-testid="tekrar-oyna"
          onClick={onReplay}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-[#F29A3B] hover:bg-[#FFBC7C] text-[#4B2800] text-[15px] font-bold shadow-lg active:scale-[0.99] transition-all cursor-pointer"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            replay
          </span>
          <span>Tekrar oyna</span>
        </button>

        {/* Secondary Button: Profili değiştir */}
        <button
          type="button"
          data-testid="profili-degistir"
          onClick={onSwitchProfile}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-[#131F37] hover:bg-[#1E2A42] text-[#CAC6BD] hover:text-[#D8E2FF] text-[15px] font-semibold active:scale-[0.99] transition-colors shadow-sm border border-[#29344E] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          <span>Profili değiştir</span>
        </button>
      </div>
    </div>
  );
};
