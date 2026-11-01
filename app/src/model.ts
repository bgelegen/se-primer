/**
 * Nöbet Arkadaşı modelinin tarayıcı tüketicisi (onnxruntime-web, spec §13).
 *
 * Sözleşme (config.json):
 *   features[].name  → girdi tensörü "input" float32 [n, f] sütun sırası
 *   classes          → çıktı "probabilities" float32 [n, c] sütun sırası; "1" = riskli seçim
 * Model ve config, Hugging Face'teki COMMIT'E SABİT URL'den indirilir (main'den değil).
 * İndirilemezse tahmin null döner ve oyun v1 kurallarıyla sürer.
 */
import * as ort from 'onnxruntime-web/wasm';
import type { KararId } from './content';
import { OZELLIK_ADLARI, type Ozellikler } from './olcum';

/** Yayınlanan sürüm: RELEASE.md'deki commit ile aynı olmalı. */
export const MODEL_TABAN: string =
  (import.meta as any).env?.VITE_MODEL_TABAN || 'https://huggingface.co/bgelegen/se-primer-nobet-arkadasi/resolve/YAYINLANMADI/';

/** Müdahale eşiği τ (spec §13.3). */
export const TAU = 0.5;

export interface ModelConfig {
  version: string;
  features: { name: string }[];
  classes: string[];
  positive_class: string;
  threshold: number;
  metrics: Record<string, number>;
}

let yukleme: Promise<{ oturum: ort.InferenceSession; config: ModelConfig } | null> | null = null;
export let modelDurumu: 'yukleniyor' | 'hazir' | 'yok' = 'yukleniyor';

export function modeliYukle(taban: string = MODEL_TABAN) {
  if (yukleme) return yukleme;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('ort/', document.baseURI).href;
  yukleme = (async () => {
    try {
      const [cfgYanit, modelYanit] = await Promise.all([fetch(taban + 'config.json'), fetch(taban + 'model.onnx')]);
      if (!cfgYanit.ok || !modelYanit.ok) throw new Error(`model indirilemedi (${cfgYanit.status}/${modelYanit.status})`);
      const config: ModelConfig = await cfgYanit.json();
      // Sözleşme kontrolü: uygulamanın ölçtüğü özellikler, modelin beklediğiyle aynı adda olmalı.
      const eksik = config.features.map((f) => f.name).filter((n) => !(OZELLIK_ADLARI as readonly string[]).includes(n));
      if (eksik.length) throw new Error(`sözleşme uyuşmuyor: ${eksik.join(', ')}`);
      const oturum = await ort.InferenceSession.create(new Uint8Array(await modelYanit.arrayBuffer()));
      modelDurumu = 'hazir';
      return { oturum, config };
    } catch (e) {
      console.warn('[Nöbet Arkadaşı] model yok, oyun kural tabanlı sürüyor:', e);
      modelDurumu = 'yok';
      return null;
    }
  })();
  return yukleme;
}

/** Ham girdi satırları (özellik adı → değer) için riskli seçim olasılıkları. */
export async function olasiliklar(girdiler: Record<string, number>[], taban?: string): Promise<number[] | null> {
  const m = await modeliYukle(taban);
  if (!m) return null;
  const adlar = m.config.features.map((f) => f.name);
  const veri = Float32Array.from(girdiler.flatMap((g) => adlar.map((a) => Number(g[a]))));
  const sonuc = await m.oturum.run({ input: new ort.Tensor('float32', veri, [girdiler.length, adlar.length]) });
  const p = sonuc.probabilities.data as Float32Array;
  const c = m.config.classes.length;
  const k = m.config.classes.indexOf(m.config.positive_class ?? '1');
  return girdiler.map((_, i) => p[i * c + k]);
}

export async function tahmin(oz: Ozellikler): Promise<number | null> {
  try {
    const p = await olasiliklar([oz]);
    return p ? p[0] : null;
  } catch (e) {
    console.warn('[Nöbet Arkadaşı] tahmin başarısız:', e);
    return null;
  }
}

/** Spec §13.3: K1 gölge mod; K2/K3'te p ≥ τ ise Nöbet Arkadaşı devreye girer. */
export function nobetArkadasiDevrede(kararId: KararId, p: number | null, tau: number = TAU): boolean {
  if (kararId === 'K1' || p === null || Number.isNaN(p)) return false;
  return p >= tau;
}
