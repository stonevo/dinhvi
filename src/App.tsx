import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from './db/db';
import { WelcomePage } from './pages/WelcomePage';
import { ErrorBoundary } from './ui/ErrorBoundary';
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
import { StudyPage } from './pages/StudyPage';
import { NavCastMenu } from './ui/NavCastMenu';
import { SharePage } from './pages/SharePage';
import { QuickNotePage } from './pages/QuickNotePage';
import { WitnessPage } from './pages/WitnessPage';

export function App() {
  const { pathname, state } = useLocation();
  const justOnboarded = (state as { onboarded?: boolean } | null)?.onboarded === true;
  const isWitness = pathname === '/witness';
  const settings = useLiveQuery(() => (isWitness ? undefined : getSettings(db)), [isWitness]);
  // Trang nhân chứng mở từ link gửi đi: đứng riêng, không có điều hướng của app.
  if (isWitness)
    return (
      <div className="shell">
        <main className="page">
          <WitnessPage />
        </main>
      </div>
    );
  return (
    <div className="shell">
      <header className="topbar no-print">
        <span className="brand">{t('app.name')}</span>
        <nav>
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/trajectory">{t('nav.trajectory')}</NavLink>
          <NavLink to="/calibration">{t('nav.calibration')}</NavLink>
          <NavCastMenu />
          <NavLink to="/library">{t('nav.library')}</NavLink>
          <NavLink to="/study">{t('nav.study')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
          <ProfileSwitcher />
          <ThemeToggle />
        </nav>
      </header>
      <main className="page">
        <ErrorBoundary resetKey={pathname}>
        <Routes>
          <Route path="/" element={settings && !settings.onboarded && !justOnboarded ? <Navigate to="/welcome" replace /> : <HomePage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/position/:domainId" element={<PositioningPage />} />
          <Route path="/quick/:domainId" element={<QuickNotePage />} />
          <Route path="/record/:id" element={<RecordPage />} />
          <Route path="/record/:id/share" element={<SharePage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/trajectory" element={<TrajectoryPage />} />
          <Route path="/calibration" element={<CalibrationPage />} />
          <Route path="/cast" element={<CastPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:n" element={<HexagramPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
