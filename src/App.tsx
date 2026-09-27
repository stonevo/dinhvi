import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { SyncBadge, startIfUsedBefore } from './sync/CloudSync';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from './db/db';
import { WelcomePage } from './pages/WelcomePage';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { t } from './i18n';
import { HomePage } from './pages/HomePage';
import { RecordPage } from './pages/RecordPage';
import { PositioningPage } from './flow/PositioningPage';
import { ThemeToggle } from './ui/ThemeToggle';
import { ProfileSwitcher } from './ui/ProfileSwitcher';
import { ReviewPage } from './pages/ReviewPage';
import { NavMenu, castMenuItems } from './ui/NavMenu';
import { CAST_METHODS } from './types/schema';
import { useIntro, useTenWings } from './data/load';
import { QuickNotePage } from './pages/QuickNotePage';

// Các trang ít dùng hoặc nặng (Lục Hào, đồ hình, Hệ từ, trang Học…) tách thành gói riêng,
// chỉ tải khi mở tới; service worker vẫn precache nên dùng offline được.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const SettingsPage = named(() => import('./pages/SettingsPage'), 'SettingsPage');
const CalibrationPage = named(() => import('./pages/CalibrationPage'), 'CalibrationPage');
const TrajectoryPage = named(() => import('./pages/TrajectoryPage'), 'TrajectoryPage');
const CastPage = named(() => import('./pages/CastPage'), 'CastPage');
const LibraryPage = named(() => import('./pages/LibraryPage'), 'LibraryPage');
const HexagramPage = named(() => import('./pages/LibraryPage'), 'HexagramPage');
const StudyPage = named(() => import('./pages/StudyPage'), 'StudyPage');
const IntroPage = named(() => import('./pages/IntroPage'), 'IntroPage');
const IntroSectionPage = named(() => import('./pages/IntroPage'), 'IntroSectionPage');
const TenWingsPage = named(() => import('./pages/TenWingsPage'), 'TenWingsPage');
const TenWingsBookPage = named(() => import('./pages/TenWingsPage'), 'TenWingsBookPage');
const DiagramsPage = named(() => import('./pages/DiagramsPage'), 'DiagramsPage');
const SharePage = named(() => import('./pages/SharePage'), 'SharePage');
const WitnessPage = named(() => import('./pages/WitnessPage'), 'WitnessPage');

export function App() {
  // Tên các bài Nhập môn cho menu cấp 2 (file nhỏ, đã precache).
  const intro = useIntro();
  const tenWings = useTenWings();
  // Đồng bộ đám mây: máy đã từng đăng nhập thì nạp Firebase ngay để kiểm bản trên mây;
  // máy chưa dùng thì chỉ nạp khi mở mục Đồng bộ trong Cài đặt.
  useEffect(() => startIfUsedBefore(), []);
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
              { to: '/diagrams', label: t('nav.diagrams') },
            ]}
            activeWhen={(p) => p.startsWith('/library') || p.startsWith('/intro') || p.startsWith('/tenwings') || p.startsWith('/diagrams')}
            menuLabel={t('nav.libraryMenu')}
          />
          <NavLink to="/study">{t('nav.study')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
          <SyncBadge />
          <ProfileSwitcher />
          <ThemeToggle />
        </nav>
      </header>
      <main className="page">
        <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<p className="muted">{t('common.loading')}</p>}>
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
          <Route path="/diagrams" element={<DiagramsPage />} />
          <Route path="/tenwings/:id" element={<TenWingsBookPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
