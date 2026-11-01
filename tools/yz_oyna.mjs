// YZ oyuncuları (data/yz_oyuncular/oyuncular.json) uygulamanın kendisinde oynatır ve CSV'yi alır.
// Her oyuncu kendi tarayıcı bağlamında (kendi "cihazı", kendi localStorage'ı) oynar; süreler sahte saatle
// planlandığı gibi geçer, ölçümü uygulamanın kendi kodu (app/src/olcum.ts) yapar.
//
//   node tools/yz_oyna.mjs <uygulama-adresi>        ör. http://127.0.0.1:8801/
// Çıktı: data/gercek/yz-<ad>.csv  (oynayan = yz_ajan, kaynak = gercek; hocanın 01.11.2026 duyurusu)
import fs from 'node:fs';
import path from 'node:path';

let pw;
try { pw = await import('playwright'); } catch { pw = (await import('/opt/npm-tools/node_modules/playwright/index.js')).default; }
const { chromium } = pw;
const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ADRES = process.argv[2] || 'http://127.0.0.1:8801/';
const plan = JSON.parse(fs.readFileSync(path.join(KOK, 'data/yz_oyuncular/oyuncular.json'), 'utf8'));
fs.mkdirSync(path.join(KOK, 'data/gercek'), { recursive: true });

const b = await chromium.launch();
for (const o of plan.oyuncular) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'tr-TR' });
  await ctx.route(/fonts\.(googleapis|gstatic)|huggingface\.co|generativelanguage/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-11-01T18:00:00') });
  const t = (id) => p.locator(`[data-testid=${id}]`);
  const bekle = (sn) => p.clock.runFor(Math.round(sn * 1000));
  await p.goto(ADRES + '?toplama=1&oynayan=yz');
  let seviye = null;

  for (const [i, s] of o.oturumlar.entries()) {
    if (s.profil) {
      if (i > 0) { await bekle(2); await t('profili-degistir').click(); }
      [seviye] = s.profil;
      const [sv, rol, hedef] = s.profil;
      // Profil seçme süresi: okumak, üç seçim ve "Nöbete başla" arasında bölünür.
      await bekle(s.giris * 0.45); await t(`seviye-${sv}`).click();
      await bekle(s.giris * 0.2); await t(`rol-${rol}`).click();
      await bekle(s.giris * 0.2); await t(`hedef-${hedef}`).click();
      await bekle(s.giris * 0.15); await t('basla').click();
    } else {
      await bekle(2); await t('tekrar-oyna').click();
    }
    await bekle(s.kriz); await t('krize-gir').click();

    for (const k of s.kararlar) {
      let gecen = 0;
      if (k.ipucu && seviye === 'orta') { await bekle(k.ipucu); gecen += k.ipucu; await t('ipucu-goster').click(); }
      for (const m of k.tutor || []) {
        await bekle(3); gecen += 3;
        await t('tutor-girdi').fill(m); await t('tutor-gonder').click();
        await t('tutor-yanit').last().waitFor();
      }
      if (seviye === 'deneyimli' && k.sn >= 60) {
        await bekle(61 - gecen); // sayaç dolar, uygulama B'yi uygular
        await t('sure-doldu').waitFor();
      } else {
        await bekle(k.sn - gecen); await t(`secenek-${k.secim}`).click();
      }
      await bekle(3); await t('devam').click();
    }
    await t('son').waitFor();
    console.log(`  ${o.ad} #${i + 1}: ${(await t('son-etiket').innerText()).trim()}`);
  }
  await p.goto(ADRES + '?veri=1');
  const csv = await p.locator('pre').innerText();
  const yol = path.join(KOK, `data/gercek/yz-${o.ad}.csv`);
  fs.writeFileSync(yol, csv.endsWith('\n') ? csv : csv + '\n');
  console.log(`✓ ${o.ad}: ${csv.trim().split('\n').length - 1} satır → ${path.relative(KOK, yol)}`);
  await ctx.close();
}
await b.close();
