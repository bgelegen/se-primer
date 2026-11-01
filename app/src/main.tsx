import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {toplamaModuAyarla} from './olcum';

// ?toplama=1 / ?toplama=0 ilk çizimden önce okunur (giriş ekranındaki not hemen doğru görünsün).
toplamaModuAyarla();

createRoot(document.getElementById('root')!).render(<App />);
