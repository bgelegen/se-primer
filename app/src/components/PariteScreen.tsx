/**
 * Parite sayfası (?parite=1, spec §13.5 KÖ-9): referans girdileri uygulamanın kendi tüketicisiyle
 * (onnxruntime-web) çalıştırır. Cypress aynı girdilerin Python Oracle olasılıklarıyla karşılaştırır.
 * Girdiler: window.__PARITE__ (test verir) ya da uygulamayla yayınlanan parite.json.
 */
import React, { useEffect, useState } from 'react';
import { MODEL_TABAN, olasiliklar } from '../model';

interface Referans {
  id: string;
  girdi: Record<string, number>;
  p_python?: number;
}

export const PariteScreen: React.FC = () => {
  const [satirlar, setSatirlar] = useState<(Referans & { p_uygulama: number | null })[]>([]);
  const [durum, setDurum] = useState('yükleniyor');

  useEffect(() => {
    (async () => {
      try {
        const w = window as any;
        const refs: Referans[] = w.__PARITE__ ?? (await (await fetch('parite.json')).json()).referanslar;
        const p = await olasiliklar(refs.map((r) => r.girdi));
        if (!p) throw new Error('model indirilemedi');
        setSatirlar(refs.map((r, i) => ({ ...r, p_uygulama: p[i] })));
        setDurum('hazir');
      } catch (e) {
        setDurum(`hata: ${(e as Error).message}`);
      }
    })();
  }, []);

  return (
    <div data-testid="parite" data-durum={durum} className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="font-serif text-[22px] font-bold text-[#FBF6EC]">Parite: uygulama (onnxruntime-web)</h1>
      <p className="text-[12px] text-[#CAC6BD] break-all">Model: {MODEL_TABAN}model.onnx · durum: {durum}</p>
      <table className="w-full text-[12px] font-mono">
        <thead>
          <tr className="text-left text-[#FFBC7C]">
            <th className="py-1">id</th><th>p (uygulama)</th><th>p (Python)</th><th>|fark|</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.map((r) => (
            <tr key={r.id} data-testid={`parite-${r.id}`} className="border-t border-[#29344E]">
              <td className="py-1">{r.id}</td>
              <td data-cy="p">{r.p_uygulama?.toFixed(8)}</td>
              <td>{r.p_python?.toFixed(8) ?? '—'}</td>
              <td>{r.p_python !== undefined && r.p_uygulama !== null ? Math.abs(r.p_uygulama - r.p_python).toExponential(2) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
