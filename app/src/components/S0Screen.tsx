/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rol, ROLES, S0_CONTENT } from '../content';

interface S0ScreenProps {
  rol: Rol;
  timeStr: string;
  onEnterCrisis: () => void;
}

export const S0Screen: React.FC<S0ScreenProps> = ({ rol, timeStr, onEnterCrisis }) => {
  const roleInfo = ROLES[rol];

  return (
    <div
      data-testid="sahne"
      className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 py-5 gap-5 pb-10"
    >
      {/* Top Bar HUD */}
      <section className="w-full bg-[#131F37] rounded-xl p-3 flex items-center justify-between shadow-md border border-[#29344E]/40">
        <div className="flex items-center gap-2 pl-1">
          <span className="material-symbols-outlined text-[#FFBC7C] text-[18px]" aria-hidden="true">
            nest_clock_farsight_analog
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#CAC6BD] tracking-wider uppercase">
              VARDİYA SAATİ
            </span>
            <div className="flex items-baseline gap-1">
              <span
                data-testid="saat"
                className="text-[16px] text-[#D8E2FF] font-bold tracking-widest"
              >
                {timeStr}
              </span>
              <span className="text-[10px] text-[#74DEA6] font-semibold">
                SABAH NÖBETİ
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#1E2A42] px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#D9483B] animate-ping" />
          <span className="text-[11px] font-bold text-[#FFB4AB] tracking-wider">
            KRİZ BAŞLANGICI
          </span>
        </div>
      </section>

      {/* Main Crisis Paper Leaf Card */}
      <article className="w-full bg-[#FBF6EC] text-[#182238] rounded-[20px] p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden border border-[#E7E2D8]">
        <div className="flex items-center justify-between border-b border-[#182238]/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9483B]" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#5A6578]">
              RandevuNet Olay Raporu
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#8C5000] bg-[#F29A3B]/15 px-2 py-0.5 rounded">
            v2.4 Dağıtımı
          </span>
        </div>

        <h2 className="font-serif text-[22px] font-bold leading-snug text-[#182238]">
          {S0_CONTENT.title}
        </h2>

        <p className="font-serif text-[16px] leading-relaxed text-[#182238] font-normal">
          {S0_CONTENT.narrative}
        </p>

        {/* Role perspective callout */}
        <div className="bg-[#F3EDE0] rounded-xl p-3 border-l-4 border-[#F29A3B] flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#633700] flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">{roleInfo.icon}</span>
            {roleInfo.label} Perspektifi
          </span>
          <p className="font-serif text-[14px] italic text-[#3E495D]">
            {roleInfo.intro}
          </p>
        </div>
      </article>

      {/* Action Button */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          data-testid="krize-gir"
          onClick={onEnterCrisis}
          className="w-full min-h-[52px] px-6 rounded-xl bg-[#F29A3B] hover:bg-[#FFBC7C] text-[#4B2800] font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-[0.99] transition-all"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            crisis_alert
          </span>
          <span>{S0_CONTENT.buttonText} →</span>
        </button>

        <p className="text-[12px] text-center text-[#CAC6BD]">
          Hastanede 300 hasta bekliyor. Kararların sistemi kurtaracak veya çökertecek.
        </p>
      </div>
    </div>
  );
};
