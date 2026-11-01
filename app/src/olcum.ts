/**
 * Nöbet Arkadaşı (spec §13): oyuncu davranışının ölçümü ve veri toplama.
 *
 * - Karar ekranı açıldığında modelin 10 özelliği burada hesaplanır (aynı anlık görüntü hem modele
 *   verilir hem de veri satırına yazılır; eğitim ile çıkarım aynı tanımı kullanır).
 * - Veri toplama modu açıksa her karar bir satır olarak yalnız bu cihazda (localStorage) tutulur.
 * - Kişisel veri yok: ad, e-posta, cihaz kimliği, konum, IP, tutor'a yazılan metin tutulmaz.
 *   Oturum kimliği her oyunda rastgele üretilir.
 */
import type { KararId, SecenekId, Seviye } from './content';

/** Modelin girdi sırası. config.json → features ile aynı olmalı (sözleşme). */
export const OZELLIK_ADLARI = [
  'seviye_no',
  'sahne_no',
  'hedef_bu_sahne',
  'giris_suresi_sn',
  'kriz_okuma_sn',
  'onceki_riskli',
  'onceki_ort_karar_sn',
  'onceki_ipucu',
  'onceki_tutor',
  'onceki_sure_doldu',
] as const;
export type OzellikAdi = (typeof OZELLIK_ADLARI)[number];
export type Ozellikler = Record<OzellikAdi, number>;

export const SEVIYE_NO: Record<Seviye, number> = { yeni: 0, orta: 1, deneyimli: 2 };
const SAHNE_NO: Record<KararId, number> = { K1: 1, K2: 2, K3: 3 };

const sinirla = (x: number, alt: number, ust: number) => Math.min(ust, Math.max(alt, x));
const yuvarla = (x: number) => Math.round(x * 10) / 10; // 0,1 sn çözünürlük

interface GecmisKarar {
  sure: number;
  riskli: boolean;
  ipucu: boolean;
  tutor: number;
  sureDoldu: boolean;
}

export interface VeriSatiri extends Ozellikler {
  oturum_id: string;
  kaynak: 'gercek' | 'otomasyon';
  uygulama_surumu: string;
  rol: string;
  hedef: string;
  karar_id: KararId;
  secim: SecenekId;
  riskli_secim: number;
  karar_suresi_sn: number;
  sure_doldu: number;
  ipucu_bu_sahne: number;
  tutor_bu_sahne: number;
  model_p: number | '';
  model_mudahale: number;
}

export const UYGULAMA_SURUMU = '2.0.0';
const DEPO = 'sep_veri_v2';
const MOD = 'sep_toplama';
const IZIN = 'sep_kayit_izni';

function depoOku(anahtar: string): string | null {
  try {
    return window.localStorage.getItem(anahtar);
  } catch {
    return null;
  }
}
function depoYaz(anahtar: string, deger: string | null) {
  try {
    if (deger === null) window.localStorage.removeItem(anahtar);
    else window.localStorage.setItem(anahtar, deger);
  } catch {
    /* gizli pencere vb.: veri toplanmaz, oyun sürer */
  }
}

/** ?toplama=1 → mod açık (cihazda hatırlanır), ?toplama=0 → kapalı. */
export function toplamaModuAyarla(arama: string = window.location.search) {
  const q = new URLSearchParams(arama).get('toplama');
  if (q === '1') depoYaz(MOD, '1');
  if (q === '0') depoYaz(MOD, null);
}
export const toplamaModuAcik = () => depoOku(MOD) === '1';
export const kayitIzni = () => depoOku(IZIN) !== '0';
export const kayitIzniAyarla = (acik: boolean) => depoYaz(IZIN, acik ? null : '0');

export function satirlar(): VeriSatiri[] {
  try {
    return JSON.parse(depoOku(DEPO) || '[]');
  } catch {
    return [];
  }
}
export function satirlariSil() {
  depoYaz(DEPO, null);
}

function rastgeleKimlik(): string {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Bir oyunun (oturumun) ölçeri. "Tekrar oyna" yeni oturum başlatır, giriş süresini korur. */
export class Olcer {
  oturumId = rastgeleKimlik();
  private girisAcilis = Date.now();
  private girisSuresi = 0;
  private krizAcilis = 0;
  private krizOkuma = 0;
  private sahneAcilis = 0;
  private sahneIpucu = false;
  private sahneTutor = 0;
  private gecmis: GecmisKarar[] = [];

  girisAcildi() {
    this.girisAcilis = Date.now();
  }
  baslaTiklandi() {
    this.girisSuresi = (Date.now() - this.girisAcilis) / 1000;
    this.krizAcilis = Date.now();
  }
  /** "Tekrar oyna": aynı profil, yeni oturum. Giriş süresi oyuncunun profil seçimine aittir, korunur. */
  yeniOturum() {
    this.oturumId = rastgeleKimlik();
    this.gecmis = [];
    this.krizAcilis = Date.now();
  }
  krizeGirildi() {
    this.krizOkuma = (Date.now() - this.krizAcilis) / 1000;
  }

  /** Karar ekranı açıldı: özellikleri sabitle. ipucuAcik: seviye "yeni" ise ipucu baştan görünür. */
  sahneAcildi(kararId: KararId, seviye: Seviye, hedefBuSahne: boolean, ipucuAcik: boolean): Ozellikler {
    this.sahneAcilis = Date.now();
    this.sahneIpucu = ipucuAcik;
    this.sahneTutor = 0;
    const g = this.gecmis;
    const ort = g.length ? g.reduce((a, x) => a + x.sure, 0) / g.length : 0;
    return {
      seviye_no: SEVIYE_NO[seviye],
      sahne_no: SAHNE_NO[kararId],
      hedef_bu_sahne: hedefBuSahne ? 1 : 0,
      giris_suresi_sn: yuvarla(sinirla(this.girisSuresi, 0, 600)),
      kriz_okuma_sn: yuvarla(sinirla(this.krizOkuma, 0, 600)),
      onceki_riskli: g.filter((x) => x.riskli).length,
      onceki_ort_karar_sn: yuvarla(sinirla(ort, 0, 120)),
      onceki_ipucu: g.filter((x) => x.ipucu).length,
      onceki_tutor: sinirla(g.reduce((a, x) => a + x.tutor, 0), 0, 20),
      onceki_sure_doldu: g.filter((x) => x.sureDoldu).length,
    };
  }
  ipucuGoruldu() {
    this.sahneIpucu = true;
  }
  tutorMesaji() {
    this.sahneTutor += 1;
  }

  kararVerildi(a: {
    kararId: KararId;
    secim: SecenekId;
    sureDoldu: boolean;
    ozellikler: Ozellikler;
    rol: string;
    hedef: string;
    p: number | null;
    mudahale: boolean;
  }) {
    const sure = (Date.now() - this.sahneAcilis) / 1000;
    this.gecmis.push({ sure, riskli: a.secim === 'B', ipucu: this.sahneIpucu, tutor: this.sahneTutor, sureDoldu: a.sureDoldu });
    if (!toplamaModuAcik() || !kayitIzni()) return;
    const satir: VeriSatiri = {
      oturum_id: this.oturumId,
      kaynak: navigator.webdriver ? 'otomasyon' : 'gercek',
      uygulama_surumu: UYGULAMA_SURUMU,
      rol: a.rol,
      hedef: a.hedef,
      karar_id: a.kararId,
      ...a.ozellikler,
      secim: a.secim,
      riskli_secim: a.secim === 'B' ? 1 : 0,
      karar_suresi_sn: yuvarla(sinirla(sure, 0, 600)),
      sure_doldu: a.sureDoldu ? 1 : 0,
      ipucu_bu_sahne: this.sahneIpucu ? 1 : 0,
      tutor_bu_sahne: this.sahneTutor,
      model_p: a.p === null ? '' : Number(a.p.toFixed(6)),
      model_mudahale: a.mudahale ? 1 : 0,
    };
    depoYaz(DEPO, JSON.stringify([...satirlar(), satir]));
  }
}

export const CSV_SUTUNLARI: (keyof VeriSatiri)[] = [
  'oturum_id', 'kaynak', 'uygulama_surumu', 'rol', 'hedef', 'karar_id',
  ...OZELLIK_ADLARI,
  'secim', 'riskli_secim', 'karar_suresi_sn', 'sure_doldu', 'ipucu_bu_sahne', 'tutor_bu_sahne',
  'model_p', 'model_mudahale',
];

export function csv(rows: VeriSatiri[] = satirlar()): string {
  return [CSV_SUTUNLARI.join(','), ...rows.map((r) => CSV_SUTUNLARI.map((c) => String(r[c] ?? '')).join(','))].join('\n') + '\n';
}

/** Tamamlanmış (3 kararlı) oturum sayısı. */
export function oturumSayisi(rows: VeriSatiri[] = satirlar()): { tam: number; satir: number } {
  const say = new Map<string, number>();
  rows.forEach((r) => say.set(r.oturum_id, (say.get(r.oturum_id) || 0) + 1));
  return { tam: [...say.values()].filter((n) => n >= 3).length, satir: rows.length };
}
