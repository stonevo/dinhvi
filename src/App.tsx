import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
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
import { NavMenu, castMenuItems } from './ui/NavMenu';
import { CAST_METHODS } from './types/schema';
import { IntroPage, IntroSectionPage } from './pages/IntroPage';
import { useIntro, useTenWings } from './data/load';
import { TenWingsBookPage, TenWingsPage } from './pages/TenWingsPage';
import { SharePage } from './pages/SharePage';
import { QuickNotePage } from './pages/QuickNotePage';
import { WitnessPage } from './pages/WitnessPage';

export function App() {
  // Tên các bài Nhập môn cho menu cấp 2 (file nhỏ, đã precache).
  const intro = useIntro();
  const tenWings = useTenWings();
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
        <Link to="/" className="brand" aria-label={t('nav.homeFromLogo')}>
          {t('app.name')}
        </Link>
        <nav>
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/trajectory">{t('nav.trajectory')}</NavLink>
          <NavLink to="/calibration">{t('nav.calibration')}</NavLink>
          <NavMenu
            label={t('nav.cast')}
            to="/cast"
            items={castMenuItems(CAST_METHODS)}
            activeWhen={(p) => p === '/cast'}
            menuLabel={t('nav.castMenu')}
          />
          <NavMenu
            label={t('nav.library')}
            to="/library"
            items={[
              { to: '/library', label: t('nav.library64') },
              { to: '/intro', label: t('nav.intro'), children: (intro ?? []).map((s) => ({ to: `/intro/${s.id}`, label: s.title })) },
              { to: '/tenwings', label: t('nav.tenwings'), children: (tenWings ?? []).map((b) => ({ to: `/tenwings/${b.id}`, label: b.title })) },
            ]}
            activeWhen={(p) => p.startsWith('/library') || p.startsWith('/intro') || p.startsWith('/tenwings')}
            menuLabel={t('nav.libraryMenu')}
          />
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
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/intro/:id" element={<IntroSectionPage />} />
          <Route path="/tenwings" element={<TenWingsPage />} />
          <Route path="/tenwings/:id" element={<TenWingsBookPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
