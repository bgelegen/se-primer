import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // [SE Primer eki] AI Studio'da anahtarı çalışma ortamı sağlar. Yerelde ve CI'da aynı kodun
  // tutoru çağırabilmesi için process.env.GEMINI_API_KEY derleme anında gömülür (CI'da sahte anahtar,
  // istekler Cypress'te taklit edilir). Vite istemci derlemesinde process.env'i {} yaptığı için üç biçim de tanımlı.
  const key = process.env.GEMINI_API_KEY || loadEnv(mode, '.', '').GEMINI_API_KEY || '';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(key),
      'process.env': JSON.stringify({GEMINI_API_KEY: key}),
      process: JSON.stringify({env: {GEMINI_API_KEY: key}}),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
