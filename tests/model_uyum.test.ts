// Nöbet Arkadaşı (spec §13): uygulamanın ölçtüğü girdiler, eğitimdeki ve Oracle'daki tanımla aynı mı?
// Bu testler eğitim ↔ çıkarım arasındaki "sessiz kayma"yı (training/serving skew) yakalar.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CSV_SUTUNLARI, Olcer, OZELLIK_ADLARI } from '../app/src/olcum';
import { nobetArkadasiDevrede, TAU } from '../app/src/model';

const metin = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf-8');
const pyListe = (kaynak: string, ad: string) => {
  const blok = kaynak.split(`${ad} = [`)[1].split(']')[0];
  return [...blok.matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]);
};

describe('sözleşme: özellik adları ve sırası her yerde aynı', () => {
  it('train.py OZELLIKLER sırası = uygulamanın OZELLIK_ADLARI', () => {
    const train = metin('../train.py');
    const adlar = [...train.split('OZELLIKLER = [')[1].split('\n]')[0].matchAll(/\("([a-z_]+)"/g)].map((m) => m[1]);
    expect(adlar).toEqual([...OZELLIK_ADLARI]);
  });
  it('veri satırı sütunları = sentetik üreticinin sütunları (data/oturumlar.csv başlığı)', () => {
    expect([...CSV_SUTUNLARI]).toEqual(pyListe(metin('../tools/sentetik_uret.py'), 'SUTUNLAR'));
    expect(metin('../data/oturumlar.csv').split('\n')[0].split(',')).toEqual([...CSV_SUTUNLARI]);
  });
});

describe('müdahale kuralı (spec §13.3)', () => {
  it.each([
    ['K1', 0.99, false], ['K1', null, false], ['K2', null, false], ['K2', TAU, true],
    ['K2', TAU - 1e-6, false], ['K3', 0.8, true], ['K3', Number.NaN, false],
  ] as const)('%s, p=%s → %s', (k, p, beklenen) => {
    expect(nobetArkadasiDevrede(k, p)).toBe(beklenen);
  });
});

describe('ölçer: oyuncunun temposu doğru özelliklere dönüşür', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  const sn = (s: number) => vi.advanceTimersByTime(s * 1000);

  it('KÖ-7 oyuncusu, Oracle referansı R1 ile birebir aynı girdiyi üretir', () => {
    const o = new Olcer();
    o.girisAcildi();
    sn(3); o.baslaTiklandi();
    sn(2); o.krizeGirildi();
    const k1 = o.sahneAcildi('K1', 'deneyimli', false, false);
    sn(4);
    o.kararVerildi({ kararId: 'K1', secim: 'B', sureDoldu: false, ozellikler: k1, rol: 'gelistirici', hedef: 'mimari', p: null, mudahale: false });
    const k2 = o.sahneAcildi('K2', 'deneyimli', false, false);
    const r1 = JSON.parse(metin('./parite_referanslar.json')).find((r: { id: string }) => r.id.startsWith('R1')).girdi;
    expect(k2).toEqual(r1);
  });

  it('ilk kararda "önceki" özellikler sıfırdır; ipucu/tutor/süre doldu sonraki karara taşınır', () => {
    const o = new Olcer();
    sn(10); o.baslaTiklandi();
    sn(20); o.krizeGirildi();
    const k1 = o.sahneAcildi('K1', 'orta', true, false);
    expect(k1).toMatchObject({ sahne_no: 1, hedef_bu_sahne: 1, onceki_riskli: 0, onceki_ort_karar_sn: 0, onceki_ipucu: 0, onceki_tutor: 0 });
    o.ipucuGoruldu(); o.tutorMesaji(); o.tutorMesaji();
    sn(12);
    o.kararVerildi({ kararId: 'K1', secim: 'A', sureDoldu: false, ozellikler: k1, rol: 'test', hedef: 'mimari', p: 0.2, mudahale: false });
    const k2 = o.sahneAcildi('K2', 'orta', false, false);
    expect(k2).toMatchObject({ sahne_no: 2, onceki_riskli: 0, onceki_ort_karar_sn: 12, onceki_ipucu: 1, onceki_tutor: 2, onceki_sure_doldu: 0 });
    sn(60);
    o.kararVerildi({ kararId: 'K2', secim: 'B', sureDoldu: true, ozellikler: k2, rol: 'test', hedef: 'mimari', p: 0.7, mudahale: true });
    expect(o.sahneAcildi('K3', 'orta', false, false)).toMatchObject({ onceki_riskli: 1, onceki_ort_karar_sn: 36, onceki_sure_doldu: 1 });
  });

  it('süreler sınırlanır (600 sn) ve 0,1 sn çözünürlüğe yuvarlanır', () => {
    const o = new Olcer();
    sn(1234.567); o.baslaTiklandi();
    sn(0.04); o.krizeGirildi();
    const k1 = o.sahneAcildi('K1', 'yeni', false, true);
    expect(k1.giris_suresi_sn).toBe(600);
    expect(k1.kriz_okuma_sn).toBe(0);
  });

  it('"Tekrar oyna" yeni oturum kimliği üretir, geçmişi sıfırlar, giriş süresini korur', () => {
    const o = new Olcer();
    sn(7); o.baslaTiklandi(); o.krizeGirildi();
    const k1 = o.sahneAcildi('K1', 'yeni', false, true);
    o.kararVerildi({ kararId: 'K1', secim: 'B', sureDoldu: false, ozellikler: k1, rol: 'urun', hedef: 'kvkk', p: null, mudahale: false });
    const ilk = o.oturumId;
    o.yeniOturum();
    sn(5); o.krizeGirildi();
    const yeni = o.sahneAcildi('K1', 'yeni', false, true);
    expect(o.oturumId).not.toBe(ilk);
    expect(o.oturumId).toMatch(/^[0-9a-f]{12}$/);
    expect(yeni).toMatchObject({ giris_suresi_sn: 7, kriz_okuma_sn: 5, onceki_riskli: 0 });
  });
});
