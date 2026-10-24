/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { Seviye, Rol, Hedef, LEVELS, ROLES, GOALS } from '../content';

interface GirisScreenProps {
  seviye: Seviye | null;
  rol: Rol | null;
  hedef: Hedef | null;
  onSelectSeviye: (s: Seviye) => void;
  onSelectRol: (r: Rol) => void;
  onSelectHedef: (h: Hedef) => void;
  onStart: () => void;
  onOpenEval: () => void;
}

export const GirisScreen: React.FC<GirisScreenProps> = ({
  seviye,
  rol,
  hedef,
  onSelectSeviye,
  onSelectRol,
  onSelectHedef,
  onStart,
  onOpenEval,
}) => {
  const isReady = Boolean(seviye && rol && hedef);

  return (
    <div
      data-testid="giris"
      className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 py-5 gap-5 pb-10"
    >
      {/* Top Night Shift Mission Control HUD */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 bg-[#1E2A42] px-3 py-1.5 rounded-full shadow-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[#F29A3B] animate-pulse" />
          <span className="text-[11px] font-bold text-[#FFBC7C] uppercase tracking-widest">
            NOKTÜRN SÜRÜMÜ · V1.4
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#CAC6BD] text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[16px] text-[#74DEA6]" aria-hidden="true">
            wifi_tethering
          </span>
          <span>08:00 NÖBET</span>
        </div>
      </div>

      {/* Decorative Illustrated Handbook Masthead */}
      <div className="relative overflow-hidden rounded-xl bg-[#131F37] p-5 flex flex-col gap-2 shadow-md border border-[#29344E]/50">
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none select-none text-[#FFBC7C] overflow-hidden">
          <BookOpen size={140} className="w-[140px] h-[140px]" aria-hidden="true" />
        </div>

        {/* Editorial Seal Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1E2A42] flex items-center justify-center text-[#FFBC7C] shadow-sm">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              terminal
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#A18D7D] tracking-wider uppercase">
              Sistem Günlüğü
            </span>
            <span className="text-[13px] font-semibold text-[#CAC6BD]">
              Nöbet El Kitabı
            </span>
          </div>
        </div>

        <h1 className="font-serif text-[30px] leading-tight text-[#FFDCBF] mt-1 tracking-tight">
          SE Primer
        </h1>
        <p className="font-serif text-[15px] italic text-[#D9C2B1] leading-relaxed">
          Her seçim bir durum geçişi. Her son bir kabul kriteri.
        </p>

        {/* Shift Read Segment Indicator */}
        <div className="flex items-center gap-1.5 pt-2">
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              seviye ? 'bg-[#F29A3B]' : 'bg-[#29344E]'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              rol ? 'bg-[#F29A3B]' : 'bg-[#29344E]'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              hedef ? 'bg-[#F29A3B]' : 'bg-[#29344E]'
            }`}
          />
        </div>
      </div>

      {/* Interactive Form Questions */}
      <div className="flex flex-col gap-4">
        {/* 1. Question Card: Seviyen? */}
        <div className="rounded-xl bg-[#131F37] p-4 flex flex-col gap-3 shadow-sm border border-[#29344E]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#29344E] text-[#FFBC7C] text-[11px] font-bold">
                1
              </span>
              <span className="font-serif text-[18px] font-bold text-[#D8E2FF]">
                Seviyen?
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#A18D7D]">Tek seçim</span>
          </div>

          <div className="flex flex-col gap-2 pt-1" role="radiogroup" aria-label="Seviyen?">
            {(['yeni', 'orta', 'deneyimli'] as Seviye[]).map((key) => {
              const active = seviye === key;
              const testId =
                key === 'yeni'
                  ? 'seviye-yeni'
                  : key === 'orta'
                  ? 'seviye-orta'
                  : 'seviye-deneyimli';

              return (
                <button
                  key={key}
                  type="button"
                  data-testid={testId}
                  onClick={() => onSelectSeviye(key)}
                  className={`w-full min-h-[48px] px-4 py-3 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F29A3B] text-[#4B2800] shadow-md font-bold'
                      : 'bg-[#1E2A42] text-[#D8E2FF] hover:bg-[#2E3952]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        active ? 'text-[#4B2800]' : 'text-[#A18D7D]'
                      }`}
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                      aria-hidden="true"
                    >
                      {LEVELS[key].icon}
                    </span>
                    <span className="text-[14px]">{LEVELS[key].label}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? 'text-[#4B2800]' : 'text-[#534436] opacity-0'
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Question Card: Rolün? */}
        <div className="rounded-xl bg-[#131F37] p-4 flex flex-col gap-3 shadow-sm border border-[#29344E]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#29344E] text-[#FFBC7C] text-[11px] font-bold">
                2
              </span>
              <span className="font-serif text-[18px] font-bold text-[#D8E2FF]">
                Rolün?
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#A18D7D]">Mühendislik alanı</span>
          </div>

          <div className="flex flex-col gap-2 pt-1" role="radiogroup" aria-label="Rolün?">
            {(['gelistirici', 'test', 'urun'] as Rol[]).map((key) => {
              const active = rol === key;
              const testId =
                key === 'gelistirici'
                  ? 'rol-gelistirici'
                  : key === 'test'
                  ? 'rol-test'
                  : 'rol-urun';

              return (
                <button
                  key={key}
                  type="button"
                  data-testid={testId}
                  onClick={() => onSelectRol(key)}
                  className={`w-full min-h-[48px] px-4 py-3 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F29A3B] text-[#4B2800] shadow-md font-bold'
                      : 'bg-[#1E2A42] text-[#D8E2FF] hover:bg-[#2E3952]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        active ? 'text-[#4B2800]' : 'text-[#A18D7D]'
                      }`}
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                      aria-hidden="true"
                    >
                      {ROLES[key].icon}
                    </span>
                    <span className="text-[14px]">{ROLES[key].label}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? 'text-[#4B2800]' : 'text-[#534436] opacity-0'
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Question Card: Hedefin? */}
        <div className="rounded-xl bg-[#131F37] p-4 flex flex-col gap-3 shadow-sm border border-[#29344E]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#29344E] text-[#FFBC7C] text-[11px] font-bold">
                3
              </span>
              <span className="font-serif text-[18px] font-bold text-[#D8E2FF]">
                Hedefin?
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#A18D7D]">Öğrenme rotası</span>
          </div>

          <div className="flex flex-col gap-2 pt-1" role="radiogroup" aria-label="Hedefin?">
            {(['mimari', 'test', 'kvkk'] as Hedef[]).map((key) => {
              const active = hedef === key;
              const testId =
                key === 'mimari'
                  ? 'hedef-mimari'
                  : key === 'test'
                  ? 'hedef-test'
                  : 'hedef-kvkk';

              return (
                <button
                  key={key}
                  type="button"
                  data-testid={testId}
                  onClick={() => onSelectHedef(key)}
                  className={`w-full min-h-[48px] px-4 py-3 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F29A3B] text-[#4B2800] shadow-md font-bold'
                      : 'bg-[#1E2A42] text-[#D8E2FF] hover:bg-[#2E3952]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        active ? 'text-[#4B2800]' : 'text-[#A18D7D]'
                      }`}
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                      aria-hidden="true"
                    >
                      {GOALS[key].icon}
                    </span>
                    <span className="text-[14px]">{GOALS[key].label}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? 'text-[#4B2800]' : 'text-[#534436] opacity-0'
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Narrative Briefing Card (Tactile Paper Texture) */}
      <div className="rounded-xl bg-[#E7E2D8] text-[#1D1C16] p-4 shadow-lg flex flex-col gap-1 border border-[#CAC6BD]">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-[18px] text-[#494740]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              auto_stories
            </span>
            <span className="text-[11px] font-bold tracking-wide text-[#494740] uppercase">
              Vardiya Giriş Notu
            </span>
          </div>
          <span className="text-[11px] text-[#494740] font-semibold">Sayfa 01/12</span>
        </div>
        <p className="font-serif text-[13px] text-[#32302A] leading-relaxed">
          Prodüksiyon kuyruğunda beklenmeyen bir gecikme var. Seçtiğin profil doğrultusunda sistem seni ilk kriz anına taşıyacak.
        </p>
      </div>

      {/* Bottom Action Block */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          data-testid="basla"
          disabled={!isReady}
          onClick={onStart}
          className={`w-full min-h-[52px] px-6 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-xl transition-all ${
            isReady
              ? 'bg-[#F29A3B] text-[#4B2800] hover:bg-[#FFBC7C] cursor-pointer active:scale-[0.99]'
              : 'bg-[#29344E] text-[#CAC6BD]/50 cursor-not-allowed opacity-60'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            menu_book
          </span>
          <span>Nöbete başla →</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-center">
          <span className="material-symbols-outlined text-[15px] text-[#FFBC7C]" aria-hidden="true">
            notifications_active
          </span>
          <p className="text-[11px] text-[#CAC6BD]">
            Gece vardiyası simülasyonu · 3 kritik karar seni bekliyor.
          </p>
        </div>
      </div>

      {/* Footer Evaluation Link */}
      <div className="pt-4 mt-2 border-t border-[#1E2A42] flex justify-center">
        <button
          type="button"
          data-testid="eval-link"
          onClick={onOpenEval}
          className="text-[12px] text-[#A18D7D] hover:text-[#FFBC7C] transition-colors underline cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">science</span>
          <span>Tutor değerlendirmesi</span>
        </button>
      </div>
    </div>
  );
};
