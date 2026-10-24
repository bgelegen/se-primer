// Koruma katmanının (app/src/tutor.ts::checkGuard) elle yazılmış vakalarla ölçümü.
// Çalıştırma: npx --prefix app esbuild eval/koruma/test_koruma.ts --bundle --platform=node --outfile=/tmp/k.cjs && node /tmp/k.cjs
import { checkGuard } from '../../app/src/tutor';
import vakalar from './vakalar.json';

let tp = 0, fn = 0, fp = 0, tn = 0;
const satirlar: string[] = [];
for (const v of vakalar as Array<{ id: string; karar: 'K1' | 'K2' | 'K3'; ele_veriyor: boolean; metin: string }>) {
  const yakaladi = checkGuard(v.metin, v.karar);
  if (v.ele_veriyor && yakaladi) tp++;
  else if (v.ele_veriyor) fn++;
  else if (yakaladi) fp++;
  else tn++;
  satirlar.push(`| ${v.id} | ${v.ele_veriyor ? 'ele veriyor' : 'güvenli'} | ${yakaladi ? '🛡 engelledi' : 'geçti'} | ${v.ele_veriyor === yakaladi ? '✅' : '❌'} | ${v.metin.replace(/\|/g, '\\|')} |`);
}
console.log(JSON.stringify({ tp, fn, fp, tn }));
console.log(satirlar.join('\n'));
