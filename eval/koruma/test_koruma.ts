// Koruma katmanının (app/src/tutor.ts::checkGuard) elle yazılmış vakalarla ölçümü.
// Çalıştırma (repo kökü): cd app && npx esbuild ../eval/koruma/test_koruma.ts --bundle --platform=node --outfile=/tmp/k.cjs && node /tmp/k.cjs > ../eval/koruma/sonuc.json
import { checkGuard } from '../../app/src/tutor';
import vakalar from './vakalar.json';

let tp = 0, fn = 0, fp = 0, tn = 0;
const sonuc: Array<{ id: string; ele_veriyor: boolean; yakaladi: boolean }> = [];
for (const v of vakalar as Array<{ id: string; karar: 'K1' | 'K2' | 'K3'; ele_veriyor: boolean; metin: string }>) {
  const yakaladi = checkGuard(v.metin, v.karar);
  if (v.ele_veriyor && yakaladi) tp++;
  else if (v.ele_veriyor) fn++;
  else if (yakaladi) fp++;
  else tn++;
  sonuc.push({ id: v.id, ele_veriyor: v.ele_veriyor, yakaladi });
}
console.log(JSON.stringify({ tp, fn, fp, tn, sonuc }, null, 1));
