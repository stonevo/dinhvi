import { NavLink, Route, Routes } from 'react-router-dom';
import { t } from './i18n';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">{t('app.name')}</span>
        <nav>
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/trajectory">{t('nav.trajectory')}</NavLink>
          <NavLink to="/calibration">{t('nav.calibration')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
        </nav>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trajectory" element={<PlaceholderPage title={t('nav.trajectory')} />} />
          <Route path="/calibration" element={<PlaceholderPage title={t('nav.calibration')} />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
