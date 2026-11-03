// Spec ↔ kod uyumu: spec.md'deki tablolar ve alıntılar okunur, uygulamanın içeriğiyle BİREBİR karşılaştırılır.
// Spec değişip kod değişmezse (ya da tersi) bu test kırmızı olur. Hangi metnin hangi seçeneğe ait olduğu da denetlenir.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DECISIONS, getEnding, GOALS, LEVELS, ROLES, S0_CONTENT, type Hedef, type KararId, type Rol, type SecenekId,
} from '../app/src/content';
import { calculateDecisionMinutes } from '../app/src/game';

const spec = readFileSync(new URL('../spec.md', import.meta.url), 'utf-8');
const norm = (s: string) => s.replace(/`\*\*\*`/g, '\u0000').replace(/\*\*/g, '').replace(/`/g, '').replace(/\*\(.*?\)\*/g, '').replace(/\s+/g, ' ').replace(/\u0000/g, '***').trim();
const bolum = (bas: string, son: string) => {
  const i = spec.indexOf(bas);
  return spec.slice(i, spec.indexOf(son, i + bas.length));
};
const hucreler = (satir: string) => satir.split('|').slice(1, -1).map(norm);
const satirlar = (b: string, bas = '| **') => b.split('\n').filter((l) => l.startsWith(bas));
const alinti = (b: string) => norm(b.split('\n').filter((l) => l.startsWith('>')).map((l) => l.slice(1)).join(' '));

/** "K1=A ise: X K1=B ise: Y" biçimindeki hücreyi {A, B} varyantlarına ayırır. */
function varyant(h: string): { A: string; B: string } {
  if (!h.includes('K1=')) return { A: h, B: h };
  const temel = h.split(/K1=[AB] ise( ek)?:/)[0].trim();
  const a = /K1=A ise( ek)?: (.*?)(?= K1=B ise|$)/.exec(h)?.[2]?.trim() ?? '';
  const b = /K1=B ise( ek)?: (.*?)(?= K1=A ise|$)/.exec(h)?.[2]?.trim() ?? '';
  return { A: [temel, a].filter(Boolean).join(' '), B: [temel, b].filter(Boolean).join(' ') };
}

const ROL_ADI: Record<string, Rol> = { 'Geliştirici': 'gelistirici', 'Test mühendisi': 'test', 'Ürün yöneticisi': 'urun' };
const KARAR_ADI: Record<string, KararId> = { 'Karar 1': 'K1', 'Karar 2': 'K2', 'Karar 3': 'K3' };

describe('§5 giriş soruları: etiketler', () => {
  it('seviye, rol ve hedef etiketleri spec tablolarıyla aynı', () => {
    expect(satirlar(bolum('### 5.1', '### 5.2')).map((l) => hucreler(l)[0])).toEqual(Object.values(LEVELS).map((x) => x.label));
    expect(satirlar(bolum('### 5.2', '### 5.3')).map((l) => hucreler(l)[0])).toEqual(Object.values(ROLES).map((x) => x.label));
    expect(satirlar(bolum('### 5.3', '## 6.')).map((l) => hucreler(l)[0])).toEqual(Object.values(GOALS).map((x) => x.label));
  });
});

describe('§5.2 rol tablosu: her rolün başlangıç ve karar satırları', () => {
  it.each(satirlar(bolum('### 5.2', '### 5.3')).map((l) => [hucreler(l)[0], hucreler(l)] as const))('%s', (ad, h) => {
    const r = ROL_ADI[ad];
    expect(ROLES[r].intro).toBe(h[1]);
    expect([DECISIONS.K1.roleLines[r], DECISIONS.K2.roleLines[r], DECISIONS.K3.roleLines[r]]).toEqual(h.slice(2, 5));
  });
});

describe('§5.3 hedef tablosu: ilgili karar, Derinleş, Bugünün dersi', () => {
  it.each(satirlar(bolum('### 5.3', '## 6.')).map((l) => [hucreler(l)[0], hucreler(l)] as const))('%s', (ad, h) => {
    const [hedef] = Object.entries(GOALS).find(([, g]) => g.label === ad)! as [Hedef, (typeof GOALS)[Hedef]];
    const k = KARAR_ADI[h[1]];
    expect(GOALS[hedef].targetDecision).toBe(k);
    expect(DECISIONS[k].targetGoal).toBe(hedef);
    expect(DECISIONS[k].deepenText).toBe(h[2]);
    expect(GOALS[hedef].lesson).toBe(h[3]);
  });
});

describe('§6 S0 başlangıç', () => {
  it('başlık, metin ve düğme', () => {
    const b = bolum('### S0', '### K1');
    expect(alinti(b)).toBe(`${S0_CONTENT.title} ${S0_CONTENT.narrative}`);
    expect(b).toContain(`**"${S0_CONTENT.buttonText}"**`);
  });
});

describe('§6 kararlar: anlatı, seçenekler, süre, ne oldu / neden oldu (seçeneğe ve K1\'e göre)', () => {
  for (const k of ['K1', 'K2', 'K3'] as KararId[]) {
    const b = bolum(`### ${k} ·`, k === 'K3' ? '### Saat' : `### K${Number(k[1]) + 1} ·`);
    it(`${k} anlatı, başlık, ipucu, açılış sorusu`, () => {
      expect(DECISIONS[k].id).toBe(k);
      expect(DECISIONS[k].narrative).toBe(alinti(b));
      expect(DECISIONS[k].title).toBe(`Karar ${k[1]} · ${b.split('\n')[0].split('·')[1].trim()}`);
      expect(DECISIONS[k].hint).toBe(norm(/\*\*İpucu:\*\* (.+)/.exec(b)![1]));
      expect(DECISIONS[k].tutorOpeningQuestion).toBe(norm(/\*\*Tutor'un açılış sorusu:\*\* (.+)/.exec(b)![1]));
    });
    for (const l of satirlar(b, '| **')) {
      const [harf, secenek, saat, ne, neden] = hucreler(l);
      const h = harf as SecenekId;
      it(`${k}-${h}: "${secenek}"`, () => {
        expect(DECISIONS[k].options[h].id).toBe(h);
        expect(DECISIONS[k].options[h].text).toBe(secenek);
        for (const k1 of ['A', 'B'] as SecenekId[]) {
          expect(DECISIONS[k].getNeOldu(h, { K1: k1 })).toBe(varyant(ne)[k1]);
          expect(DECISIONS[k].getNedenOldu(h, { K1: k1 })).toBe(varyant(neden)[k1]);
          const dk = [...saat.matchAll(/\+(\d+) dk/g)].map((m) => Number(m[1]));
          const bekle = dk[0] + (saat.includes('K1=B ise') && k1 === 'B' ? dk[1] : 0);
          expect(calculateDecisionMinutes(k, h, k1)).toBe(bekle);
        }
      });
    }
  }
});

describe('§7 son kuralı tablosu', () => {
  const t = satirlar(bolum('### Son kuralı', 'Son ekranında'), '| K3').map(hucreler);
  const ac = (i: number) => t[i][3];
  it.each([
    ['K3=A, (K1,K2)≠(B,B)', ['A', 'A', 'A'], 0], ['K3=B, (K1,K2)≠(B,B)', ['A', 'B', 'B'], 1],
    ['K3=A, (K1,K2)=(B,B)', ['B', 'B', 'A'], 2], ['K3=B, (K1,K2)=(B,B)', ['B', 'B', 'B'], 3],
  ] as const)('%s', (_ad, [k1, k2, k3], i) => {
    const son = getEnding(k1, k2, k3);
    expect(son.tag).toBe(t[i][1]);
    expect(son.getTitle('08:25')).toBe(t[i][2].replace('{saat}', '08:25'));
    expect(son.description).toBe(i === 3 ? `${ac(2)} ${ac(1)}` : ac(i));
  });
});
