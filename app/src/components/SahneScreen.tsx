/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  KararId,
  SecenekId,
  Seviye,
  Rol,
  Hedef,
  DECISIONS,
} from '../content';
import { askTutor, TutorResponse } from '../tutor';
import { DecisionRecord } from '../game';

interface SahneScreenProps {
  kararId: KararId;
  isResult: boolean;
  seviye: Seviye;
  rol: Rol;
  hedef: Hedef;
  timeStr: string;
  prevDecisions: {
    K1?: DecisionRecord;
    K2?: DecisionRecord;
    K3?: DecisionRecord;
  };
  currentDecisionRecord?: DecisionRecord;
  onMakeDecision: (choice: SecenekId, timedOut?: boolean) => void;
  onAdvance: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  guarded?: boolean;
}

export const SahneScreen: React.FC<SahneScreenProps> = ({
  kararId,
  isResult,
  seviye,
  rol,
  hedef,
  timeStr,
  prevDecisions,
  currentDecisionRecord,
  onMakeDecision,
  onAdvance,
}) => {
  const decision = DECISIONS[kararId];
  const isGoalTarget = hedef === decision.targetGoal;

  // Level hint handling
  // "Yeni başladım" -> hint card always open
  // "Biraz deneyimliyim" -> hint behind "İpucu göster" button
  // "Deneyimliyim" -> no hint
  const [hintOpen, setHintOpen] = useState(seviye === 'yeni');

  // Level countdown handling
  // "Deneyimliyim" -> 60s countdown
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset hint open for new decisions
    setHintOpen(seviye === 'yeni');
    setTimeLeft(60);

    if (seviye === 'deneyimli' && !isResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Timed out: apply option B
            onMakeDecision('B', true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [kararId, isResult, seviye]);

  // Tutor chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAskingTutor, setIsAskingTutor] = useState(false);

  // Clear tutor replies when switching to a new scene
  useEffect(() => {
    setChatMessages([]);
    setInputText('');
  }, [kararId]);

  const handleTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query || isAskingTutor) return;

    setInputText('');
    const studentMsgId = `st_${Date.now()}`;
    setChatMessages((prev) => [...prev, { id: studentMsgId, sender: 'student', text: query }]);

    setIsAskingTutor(true);
    try {
      const res: TutorResponse = await askTutor(kararId, query);
      const tutorMsgId = `tut_${Date.now()}`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: tutorMsgId,
          sender: 'tutor',
          text: res.shown,
          guarded: res.guarded,
        },
      ]);
    } catch (_err) {
      const fallbackMsgId = `tut_${Date.now()}`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: fallbackMsgId,
          sender: 'tutor',
          text: decision.tutorOpeningQuestion,
          guarded: false,
        },
      ]);
    } finally {
      setIsAskingTutor(false);
    }
  };

  const choice = currentDecisionRecord?.choice;
  const isTimedOut = Boolean(currentDecisionRecord?.timedOut);

  // Calculate percentage for circular progress
  const timerOffset = ((60 - timeLeft) / 60) * 100;

  return (
    <div
      data-testid="sahne"
      className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 py-4 gap-4 pb-10"
    >
      {/* Top Bar: only game clock (`saat`), progress 'Karar n/3' (`ilerleme`), and for Deneyimliyim countdown (`geri-sayim`) */}
      <section className="w-full bg-[#131F37] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md border border-[#29344E]/40">
        {/* Shift Clock */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FFBC7C] text-[18px]" aria-hidden="true">
            nest_clock_farsight_analog
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#CAC6BD] tracking-wider uppercase">
              VARDİYA SAATİ
            </span>
            <span
              data-testid="saat"
              className="text-[16px] text-[#D8E2FF] font-bold tracking-widest leading-tight"
            >
              {timeStr}
            </span>
          </div>
        </div>

        {/* Segmented Decision Progress Rail */}
        <div className="flex flex-col items-center gap-1">
          <span data-testid="ilerleme" className="text-[12px] font-bold text-[#D8E2FF]">
            Karar {decision.stepNum}/3
          </span>
          <div className="flex items-center gap-1 w-20 h-1.5 bg-[#29344E] rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full w-1/3 rounded-full ${
                decision.stepNum >= 1 ? 'bg-[#F29A3B]' : 'bg-[#29344E]'
              }`}
            />
            <div
              className={`h-full w-1/3 rounded-full ${
                decision.stepNum >= 2 ? 'bg-[#F29A3B]' : 'bg-[#29344E]'
              }`}
            />
            <div
              className={`h-full w-1/3 rounded-full ${
                decision.stepNum >= 3 ? 'bg-[#F29A3B]' : 'bg-[#29344E]'
              }`}
            />
          </div>
        </div>

        {/* 60-Second Countdown (ONLY for Deneyimliyim level) */}
        {seviye === 'deneyimli' ? (
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#29344E]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-[#F29A3B] transition-all duration-1000 ease-linear"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="100, 100"
                strokeDashoffset={timerOffset}
                strokeLinecap="round"
                strokeWidth="3.2"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                data-testid="geri-sayim"
                className="text-[11px] font-bold text-[#FFBC7C]"
              >
                {timeLeft}s
              </span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center text-[#74DEA6]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">verified_user</span>
          </div>
        )}
      </section>

      {/* Narrative Paper Leaf Card */}
      <article className="w-full bg-[#FBF6EC] text-[#182238] rounded-[20px] p-5 shadow-xl flex flex-col gap-3 relative overflow-hidden border border-[#E7E2D8]">
        {/* Header Meta Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap z-10 border-b border-[#182238]/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F29A3B]" />
            <h2 className="font-serif text-[18px] font-bold text-[#182238] tracking-tight">
              {decision.title}
            </h2>
          </div>

          {isGoalTarget && (
            <span
              data-testid="hedef-rozeti"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F29A3B]/20 text-[#633700] text-[11px] font-bold"
            >
              🎯 Hedefinle ilgili
            </span>
          )}
        </div>

        {/* Narrative Body */}
        <p className="font-serif text-[16px] text-[#182238] leading-relaxed font-normal">
          {decision.narrative}
        </p>

        {/* Role line */}
        <div className="bg-[#F3EDE0] rounded-lg p-2.5 border-l-3 border-[#A18D7D] flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6578]">
            Rol Satırı
          </span>
          <p
            data-testid="rol-satiri"
            className="font-serif text-[13px] italic text-[#3E495D] leading-snug"
          >
            {decision.roleLines[rol]}
          </p>
        </div>
      </article>

      {/* Hint Component */}
      {seviye === 'yeni' && (
        <div
          data-testid="ipucu"
          className="rounded-xl bg-[#1E2A42] text-[#D8E2FF] p-3.5 border border-[#29344E] flex items-start gap-2.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[#FFBC7C] text-[20px] flex-shrink-0 mt-0.5" aria-hidden="true">
            tips_and_updates
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-[#FFBC7C] uppercase tracking-wider">
              İpucu
            </span>
            <p className="font-serif text-[13px] text-[#D8E2FF] leading-snug">
              {decision.hint}
            </p>
          </div>
        </div>
      )}

      {seviye === 'orta' && (
        <div className="flex flex-col gap-2">
          {!hintOpen ? (
            <button
              type="button"
              data-testid="ipucu-goster"
              onClick={() => setHintOpen(true)}
              className="self-start px-3 py-1.5 rounded-lg bg-[#1E2A42] hover:bg-[#2E3952] text-[#FFBC7C] text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#29344E]"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">tips_and_updates</span>
              <span>İpucu göster</span>
            </button>
          ) : (
            <div
              data-testid="ipucu"
              className="rounded-xl bg-[#1E2A42] text-[#D8E2FF] p-3.5 border border-[#29344E] flex items-start gap-2.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[#FFBC7C] text-[20px] flex-shrink-0 mt-0.5" aria-hidden="true">
                tips_and_updates
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-[#FFBC7C] uppercase tracking-wider">
                  İpucu
                </span>
                <p className="font-serif text-[13px] text-[#D8E2FF] leading-snug">
                  {decision.hint}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Options (if not in result state) */}
      {!isResult && (
        <section aria-label="Karar Seçenekleri" className="flex flex-col gap-2.5 w-full">
          {/* Choice Card A - NO RISK/DURATION TAGS */}
          <button
            type="button"
            data-testid="secenek-A"
            onClick={() => onMakeDecision('A')}
            className="group relative w-full text-left bg-[#131F37] hover:bg-[#1E2A42] active:scale-[0.99] rounded-xl p-4 shadow-md transition-all duration-150 flex items-start gap-3 border border-[#29344E] cursor-pointer min-h-[52px]"
          >
            <span className="w-7 h-7 rounded-full bg-[#29344E] text-[#74DEA6] flex items-center justify-center text-[13px] font-bold flex-shrink-0 group-hover:bg-[#74DEA6] group-hover:text-[#06132A] transition-colors mt-0.5">
              A
            </span>
            <span className="font-serif text-[15px] leading-snug text-[#D8E2FF] font-semibold pt-0.5">
              {decision.options.A.text}
            </span>
          </button>

          {/* Choice Card B - NO RISK/DURATION TAGS */}
          <button
            type="button"
            data-testid="secenek-B"
            onClick={() => onMakeDecision('B')}
            className="group relative w-full text-left bg-[#131F37] hover:bg-[#1E2A42] active:scale-[0.99] rounded-xl p-4 shadow-md transition-all duration-150 flex items-start gap-3 border border-[#29344E] cursor-pointer min-h-[52px]"
          >
            <span className="w-7 h-7 rounded-full bg-[#29344E] text-[#FFBC7C] flex items-center justify-center text-[13px] font-bold flex-shrink-0 group-hover:bg-[#F29A3B] group-hover:text-[#06132A] transition-colors mt-0.5">
              B
            </span>
            <span className="font-serif text-[15px] leading-snug text-[#D8E2FF] font-semibold pt-0.5">
              {decision.options.B.text}
            </span>
          </button>
        </section>
      )}

      {/* Result Panel (Shown when decision made) */}
      {isResult && choice && (
        <section
          data-testid="sonuc"
          aria-live="polite"
          className="rounded-xl bg-[#1E2A42] border-2 border-[#F29A3B] p-4 flex flex-col gap-3 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-[#29344E] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F29A3B] text-[#4B2800] text-[12px] font-bold flex items-center justify-center">
                {choice}
              </span>
              <span className="text-[13px] font-bold text-[#FFBC7C]">
                {decision.options[choice].text}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#74DEA6]">Sonuç Kaydedildi</span>
          </div>

          {/* Timed out notice */}
          {isTimedOut && (
            <div
              data-testid="sure-doldu"
              className="bg-[#D9483B]/20 border border-[#D9483B] text-[#FFB4AB] px-3 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2"
            >
              <span>⏱ Süre doldu: baskı altında en hızlı görünen seçenek uygulandı.</span>
            </div>
          )}

          {/* Ne oldu */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#FFBC7C] uppercase tracking-wider">
              Ne oldu?
            </span>
            <p
              data-testid="ne-oldu"
              className="font-serif text-[14px] text-[#D8E2FF] leading-relaxed"
            >
              {decision.getNeOldu(choice, {
                K1: prevDecisions.K1?.choice,
                K2: prevDecisions.K2?.choice,
              })}
            </p>
          </div>

          {/* Neden oldu */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#74DEA6] uppercase tracking-wider">
              Neden oldu?
            </span>
            <p
              data-testid="neden-oldu"
              className="font-serif text-[14px] text-[#D8E2FF] leading-relaxed"
            >
              {decision.getNedenOldu(choice, {
                K1: prevDecisions.K1?.choice,
                K2: prevDecisions.K2?.choice,
              })}
            </p>
          </div>

          {/* Derinleş (if goal matches) */}
          {isGoalTarget && (
            <div className="bg-[#131F37] rounded-lg p-3 border-l-4 border-[#F29A3B] flex flex-col gap-1 mt-1">
              <span className="text-[11px] font-bold text-[#FFDCBF] uppercase tracking-wider flex items-center gap-1">
                <span>🎯</span> Derinleş
              </span>
              <p
                data-testid="derinles"
                className="font-serif text-[13px] text-[#D8E2FF] leading-relaxed italic"
              >
                {decision.deepenText}
              </p>
            </div>
          )}

          {/* Devam button */}
          <div className="pt-2">
            <button
              type="button"
              data-testid="devam"
              onClick={onAdvance}
              className="w-full min-h-[48px] px-5 rounded-lg bg-[#F29A3B] hover:bg-[#FFBC7C] text-[#4B2800] text-[15px] font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-[0.99] transition-all"
            >
              <span>Devam →</span>
            </button>
          </div>
        </section>
      )}

      {/* AI Tutor Terminal */}
      <section
        data-testid="tutor"
        className="w-full bg-[#182848] rounded-xl p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden border border-[#29344E]"
      >
        {/* Tutor Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">🦉</span>
            <span className="text-[15px] text-[#D8E2FF] font-bold tracking-tight">AI Tutor</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#020D25]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#74DEA6] animate-pulse" />
            <span className="text-[11px] text-[#74DEA6] font-semibold">Çevrimiçi</span>
          </div>
        </div>

        {/* Opening Question Bubble */}
        <div className="bg-[#0F1B33]/80 rounded-lg p-3 flex items-start gap-2.5 shadow-inner border border-[#1E2A42]">
          <span className="material-symbols-outlined text-[#FFBC7C] text-[18px] flex-shrink-0 mt-0.5" aria-hidden="true">
            psychology_alt
          </span>
          <p
            data-testid="tutor-soru"
            className="font-serif text-[14px] text-[#D8E2FF] leading-snug"
          >
            "{decision.tutorOpeningQuestion}"
          </p>
        </div>

        {/* Conversation history */}
        {chatMessages.length > 0 && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'student' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-snug ${
                    msg.sender === 'student'
                      ? 'bg-[#F29A3B] text-[#4B2800] font-semibold'
                      : 'bg-[#131F37] text-[#D8E2FF] border border-[#29344E]'
                  }`}
                >
                  {msg.sender === 'tutor' ? (
                    <span data-testid="tutor-yanit" className="font-serif">
                      {msg.text}
                      {msg.guarded && <span className="ml-1 text-[12px]" title="Koruma katmanı devreye girdi">🛡</span>}
                    </span>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Tutor Input Field */}
        <form onSubmit={handleTutorSubmit} className="flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <input
              type="text"
              data-testid="tutor-girdi"
              value={inputText}
              disabled={isAskingTutor}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isAskingTutor ? 'Tutor düşünüyor...' : "Tutor'a yaz…"}
              className="w-full h-11 bg-[#020D25]/80 text-[#D8E2FF] placeholder:text-[#CAC6BD]/60 rounded-lg pl-3 pr-2 text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-[#F29A3B] border border-[#29344E]"
            />
          </div>
          <button
            type="submit"
            data-testid="tutor-gonder"
            disabled={isAskingTutor || !inputText.trim()}
            aria-label="Gönder"
            className="h-11 w-11 bg-[#F29A3B] hover:bg-[#FFBC7C] active:scale-95 text-[#4B2800] rounded-lg flex items-center justify-center shadow-md transition-all flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              send
            </span>
          </button>
        </form>

        {/* Tutor Guidance Microcopy */}
        <p className="text-[11px] text-[#CAC6BD]/80 text-center flex items-center justify-center gap-1 pt-0.5">
          <span className="material-symbols-outlined text-[13px] text-[#CAC6BD]" aria-hidden="true">info</span>
          <span>Tutor cevabı söylemez, soru sorar. Kişisel bilgi yazma.</span>
        </p>
      </section>
    </div>
  );
};
