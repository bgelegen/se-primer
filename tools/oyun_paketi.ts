// Kanıt sitesindeki etkileşimli harita uygulamanın KENDİ durum makinesini ve içeriğini kullanır.
// esbuild ile docs/oyun.js olarak paketlenir (tools/site_derle.py).
export { DECISIONS, getEnding, S0_CONTENT } from '../app/src/content';
export { calculateDecisionMinutes, formatClock, INITIAL_MINUTES } from '../app/src/game';
