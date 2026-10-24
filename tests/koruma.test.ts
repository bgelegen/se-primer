// Koruma katmanı (app/src/tutor.ts::checkGuard): elle yazılmış vakalar + canlı Gemini yanıtları.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkGuard } from '../app/src/tutor';
import type { KararId } from '../app/src/content';

const oku = <T>(p: string): T => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'));
const vakalar = oku<Array<{ id: string; karar: KararId; ele_veriyor: boolean; metin: string }>>('../eval/koruma/vakalar.json');
const canli = oku<Array<{ id: string; karar: KararId; ham: string }>>('../eval/v2/sonuclar.json');
const kirmizi = oku<Array<{ id: string; karar: KararId; ham: string }>>('../eval/kirmizi/sonuclar.json');

describe('elle yazılmış vakalar', () => {
  it.each(vakalar.map((v) => [v.id, v.ele_veriyor ? 'engellenmeli' : 'geçmeli', v] as const))('%s %s', (_id, _b, v) => {
    expect(checkGuard(v.metin, v.karar)).toBe(v.ele_veriyor);
  });
});

describe('canlı Gemini yanıtları (eval v2): hiçbiri ele vermiyor, koruma yanlış alarm vermemeli', () => {
  it.each(canli.map((r) => [r.id, r] as const))('%s', (_id, r) => {
    expect(checkGuard(r.ham, r.karar)).toBe(false);
  });
});

describe('canlı Gemini yanıtları (kırmızı takım, 30 saldırgan mesaj): elle etiketle hiçbiri ele vermiyor', () => {
  it.each(kirmizi.map((r) => [r.id, r] as const))('%s', (_id, r) => {
    expect(checkGuard(r.ham, r.karar)).toBe(false);
  });
});
