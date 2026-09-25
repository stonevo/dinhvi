import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { db, ensureSeeded } from './db/db';
import { remindOnOpen } from './lib/notifications';
import { applyTheme, getTheme } from './lib/theme';
// Merriweather cho tiêu đề (như VnExpress); nhúng sẵn để dùng offline.
import '@fontsource/merriweather/latin-400.css';
import '@fontsource/merriweather/latin-ext-400.css';
import '@fontsource/merriweather/vietnamese-400.css';
import '@fontsource/merriweather/latin-700.css';
import '@fontsource/merriweather/latin-ext-700.css';
import '@fontsource/merriweather/vietnamese-700.css';
import './styles.css';

registerSW({ immediate: true });
applyTheme(getTheme());

// Trang nhân chứng (mở từ link) không tạo dữ liệu trên máy người trả lời.
const isWitness = window.location.hash.startsWith('#/witness');

(isWitness ? Promise.resolve() : ensureSeeded(db)).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
  if (isWitness) return;
  void remindOnOpen();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void remindOnOpen();
  });
});
