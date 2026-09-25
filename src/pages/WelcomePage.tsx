import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, getSettings } from '../db/db';
import { t } from '../i18n';
import { HexagramFigure } from '../ui/HexagramFigure';

const SLIDES = 4;

/** Hướng dẫn lần đầu: 4 trang ngắn. Xem lại được từ Cài đặt. */
export function WelcomePage() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();

  async function finish() {
    const s = await getSettings(db);
    await db.settings.put({ ...s, onboarded: true });
    // Báo cho App biết vừa xong hướng dẫn, để không chuyển hướng lại khi cài đặt chưa kịp cập nhật.
    navigate('/', { replace: true, state: { onboarded: true } });
  }

  return (
    <div className="stack welcome">
      <p className="muted small">
        {t('welcome.progress', { n: i + 1, total: SLIDES })}
      </p>
      {i === 0 && (
        <section className="stack">
          <h1>{t('welcome.1.title')}</h1>
          <p className="lead">{t('welcome.1.body')}</p>
          <p>{t('welcome.1.body2')}</p>
        </section>
      )}
      {i === 1 && (
        <section className="stack">
          <h1>{t('welcome.2.title')}</h1>
          <div className="hex-head">
            <HexagramFigure binary="100010" highlight={3} size={72} label="Thủy Lôi Truân" />
            <p>{t('welcome.2.figure')}</p>
          </div>
          <p>{t('welcome.2.body')}</p>
          <ul>
            <li>{t('tier.earth')}: {t('welcome.2.earth')}</li>
            <li>{t('tier.human')}: {t('welcome.2.human')}</li>
            <li>{t('tier.heaven')}: {t('welcome.2.heaven')}</li>
          </ul>
        </section>
      )}
      {i === 2 && (
        <section className="stack">
          <h1>{t('welcome.3.title')}</h1>
          <p>{t('welcome.3.body')}</p>
          <ol className="welcome-steps">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <li key={n}>
                <strong>{t(`flow.stepName.${n}` as 'flow.stepName.1')}</strong> — {t(`welcome.3.step${n}` as 'welcome.3.step1')}
              </li>
            ))}
          </ol>
        </section>
      )}
      {i === 3 && (
        <section className="stack">
          <h1>{t('welcome.4.title')}</h1>
          <p>{t('welcome.4.body')}</p>
          <ul>
            <li>{t('welcome.4.profiles')}</li>
            <li>{t('welcome.4.quick')}</li>
            <li>
              {t('welcome.4.library')} <Link to="/library">{t('nav.library')}</Link>
            </li>
          </ul>
        </section>
      )}
      <div className="flow-nav">
        {i > 0 ? (
          <button type="button" onClick={() => setI(i - 1)}>
            {t('common.back')}
          </button>
        ) : (
          <button type="button" className="link" onClick={finish}>
            {t('welcome.skip')}
          </button>
        )}
        {i < SLIDES - 1 ? (
          <button type="button" className="primary" onClick={() => setI(i + 1)}>
            {t('common.next')}
          </button>
        ) : (
          <button type="button" className="primary" onClick={finish}>
            {t('welcome.start')}
          </button>
        )}
      </div>
    </div>
  );
}
