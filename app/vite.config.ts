import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// AI Studio şablonu: GEMINI_API_KEY derleme anında process.env'e gömülür.
// Anahtar yoksa tutor yedek soruyla çalışır (spec §8.2).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  return {
    plugins: [react(), tailwindcss()],
    // AI Studio çalışma ortamı process.env'i sağlar; yerelde/CI'da aynı kod çalışsın diye
    // 'process' tanımlayıcısı derleme anında { env: { GEMINI_API_KEY } } nesnesiyle değiştirilir.
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(key),
      'process.env': JSON.stringify({ GEMINI_API_KEY: key }),
      process: JSON.stringify({ env: { GEMINI_API_KEY: key } }),
    },
  };
});
