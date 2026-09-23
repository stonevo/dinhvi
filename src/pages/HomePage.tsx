import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { formatPeriod, periodOf } from '../lib/period';
import { domainStatus, type DomainStatus } from '../lib/status';
import { newId } from '../lib/id';
import { reminderState } from '../lib/reminder';

const STATUS_KEY = {
  needsReview: 'home.status.needsReview',
  needsPositioning: 'home.status.needsPositioning',
  draft: 'home.status.draft',
  done: 'home.status.done',
} as const satisfies Record<DomainStatus, string>;

const ACTION_KEY = {
  needsReview: 'home.action.review',
  needsPositioning: 'home.action.start',
  draft: 'home.action.continue',
  done: 'home.action.view',
} as const satisfies Record<DomainStatus, string>;

export function HomePage() {
  const { data: staticData } = useStaticData();
  const data = useLiveQuery(async () => {
    const [settings, domains, positionings, drafts] = await Promise.all([
      getSettings(db),
      db.domains.filter((d) => !d.archived).sortBy('createdAt'),
      db.positionings.toArray(),
      db.drafts.toArray(),
    ]);
    return { settings, domains, positionings, drafts };
  });
  const [name, setName] = useState('');

  if (!data) return <p className="muted">{t('common.loading')}</p>;
  const now = new Date();
  const period = periodOf(now, data.settings.cycle);
  const reminder = reminderState(now, data.settings, data.domains, data.positionings, data.drafts);

  async function addDomain(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await db.domains.add({ id: newId(), name: trimmed, createdAt: new Date().toISOString(), archived: false });
    setName('');
  }

  return (
    <section>
      <p className="intro">{t('home.intro')}</p>
      <h2 className="period">{t('home.period', { period: formatPeriod(period) })}</h2>
      {reminder.inAppDue && <p className="note">{t('home.reminderDue')}</p>}
      <ul className="domain-list">
        {data.domains.map((d) => {
          const status = domainStatus(d.id, period, data.positionings, data.drafts);
          const current = data.positionings.find((p) => p.domainId === d.id && p.period === period);
          const hex = current && staticData ? staticData.hexagram(current.finalHexagram) : null;
          const to = current ? `/record/${current.id}` : `/position/${d.id}`;
          return (
            <li key={d.id} className={`domain status-${status}`}>
              <span className="domain-name">
                {d.name}
                {hex && current && (
                  <span className="muted small">
                    {' '}
                    · {hex.nameHanViet} · {t('line.n', { n: current.finalLine })}
                  </span>
                )}
              </span>
              <span className="domain-status">{t(STATUS_KEY[status])}</span>
              <Link className="domain-action" to={to}>
                {t(ACTION_KEY[status])}
              </Link>
              <button
                className="link"
                onClick={() => {
                  if (window.confirm(t('home.archive.confirm', { name: d.name }))) void db.domains.update(d.id, { archived: true });
                }}
              >
                {t('home.archive')}
              </button>
            </li>
          );
        })}
      </ul>
      <form className="row" onSubmit={addDomain}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('home.domainPlaceholder')}
          aria-label={t('home.domainPlaceholder')}
        />
        <button type="submit">{t('home.addDomain')}</button>
      </form>
      <p className="muted small">{t('home.aloneNote')}</p>
    </section>
  );
}
