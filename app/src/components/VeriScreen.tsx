/**
 * Veri ekranı (spec §13.6): bu cihazda toplanan anonim karar satırlarını CSV olarak dışa aktarır.
 */
import React, { useState } from 'react';
import { csv, oturumSayisi, satirlar, satirlariSil, toplamaModuAcik } from '../olcum';

export const VeriScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [rows, setRows] = useState(satirlar());
  const [mesaj, setMesaj] = useState('');
  const [silOnay, setSilOnay] = useState(false);
  const { tam, satir } = oturumSayisi(rows);
  const icerik = csv(rows);
  const dosyaAdi = `oturumlar-${new Date().toISOString().slice(0, 10)}-${rows[0]?.oturum_id.slice(0, 4) ?? 'bos'}.csv`;

  const indir = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([icerik], { type: 'text/csv;charset=utf-8' }));
    a.download = dosyaAdi;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMesaj(`${dosyaAdi} indirildi.`);
  };

  const paylas = async () => {
    const dosya = new File([icerik], dosyaAdi, { type: 'text/csv' });
    try {
      if (navigator.canShare?.({ files: [dosya] })) {
        await navigator.share({ files: [dosya], title: 'SE Primer oturum verisi' });
        setMesaj('Paylaşıldı.');
        return;
      }
      await navigator.clipboard.writeText(icerik);
      setMesaj('CSV panoya kopyalandı; mesajla gönderebilirsin.');
    } catch {
      setMesaj('Paylaşılamadı; "CSV indir"i kullan.');
    }
  };

  return (
    <div data-testid="veri-ekrani" className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-[22px] font-bold text-[#FBF6EC]">Toplanan veri</h1>
        <button type="button" onClick={onClose} className="text-[13px] text-[#FFBC7C] underline">
          Kapat ✕
        </button>
      </div>
      <p className="text-[13px] text-[#CAC6BD] leading-relaxed">
        Her karar bir satır. Satırlar yalnız bu cihazda durur; ad, e-posta, konum ya da tutor'a yazılan metin yoktur.
        {!toplamaModuAcik() && ' Veri toplama modu kapalı: açmak için adresin sonuna ?toplama=1 ekle.'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#131F37] border border-[#29344E] p-4">
          <b data-testid="veri-sayac" className="block font-serif text-[30px] text-[#FBF6EC]">{tam}</b>
          <span className="text-[12px] text-[#CAC6BD]">tamamlanmış oturum</span>
        </div>
        <div className="rounded-xl bg-[#131F37] border border-[#29344E] p-4">
          <b className="block font-serif text-[30px] text-[#FBF6EC]">{satir}</b>
          <span className="text-[12px] text-[#CAC6BD]">karar satırı</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="veri-indir" onClick={indir} disabled={!satir}
          className="px-4 py-2.5 rounded-lg bg-[#F29A3B] text-[#4B2800] font-bold text-[14px] disabled:opacity-40">
          CSV indir
        </button>
        <button type="button" data-testid="veri-kopyala" onClick={paylas} disabled={!satir}
          className="px-4 py-2.5 rounded-lg bg-[#1E2A42] text-[#FFBC7C] font-bold text-[14px] border border-[#29344E] disabled:opacity-40">
          Paylaş / kopyala
        </button>
        <button type="button" onClick={() => {
            if (!silOnay) return setSilOnay(true);
            satirlariSil(); setRows([]); setSilOnay(false); setMesaj('Bu cihazdaki veri silindi.');
          }} disabled={!satir}
          className="px-4 py-2.5 rounded-lg text-[#FFB4AB] text-[13px] underline disabled:opacity-40">
          {silOnay ? 'Emin misin? Tekrar bas' : 'Sil'}
        </button>
      </div>
      {mesaj && <p role="status" className="text-[13px] text-[#74DEA6]">{mesaj}</p>}
      <pre className="text-[10px] leading-snug bg-[#05090F] text-[#A6B3CB] rounded-lg p-3 overflow-x-auto max-h-72">{icerik}</pre>
    </div>
  );
};
