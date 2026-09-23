import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { db, ensureSeeded } from './db/db';
import { remindOnOpen } from './lib/notifications';
import './styles.css';

registerSW({ immediate: true });

ensureSeeded(db).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
  void remindOnOpen();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void remindOnOpen();
  });
});
