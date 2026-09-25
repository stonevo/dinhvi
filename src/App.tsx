import { NavLink, Route, Routes } from 'react-router-dom';
import { t } from './i18n';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { CalibrationPage } from './pages/CalibrationPage';
import { RecordPage } from './pages/RecordPage';
import { PositioningPage } from './flow/PositioningPage';
import { TrajectoryPage } from './pages/TrajectoryPage';
import { ThemeToggle } from './ui/ThemeToggle';
import { ProfileSwitcher } from './ui/ProfileSwitcher';
import { CastPage } from './pages/CastPage';
import { ReviewPage } from './pages/ReviewPage';
import { HexagramPage, LibraryPage } from './pages/LibraryPage';

export function App() {
  return (
    <div className="shell">
      <header className="topbar no-print">
        <span className="brand">{t('app.name')}</span>
        <nav>
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/trajectory">{t('nav.trajectory')}</NavLink>
          <NavLink to="/calibration">{t('nav.calibration')}</NavLink>
          <NavLink to="/cast">{t('nav.cast')}</NavLink>
          <NavLink to="/library">{t('nav.library')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
          <ProfileSwitcher />
          <ThemeToggle />
        </nav>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/position/:domainId" element={<PositioningPage />} />
          <Route path="/record/:id" element={<RecordPage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/trajectory" element={<TrajectoryPage />} />
          <Route path="/calibration" element={<CalibrationPage />} />
          <Route path="/cast" element={<CastPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:n" element={<HexagramPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
