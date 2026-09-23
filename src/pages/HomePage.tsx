import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { t } from '../i18n';
import { formatPeriod, periodOf } from '../lib/period';
import { domainStatus, type DomainStatus } from '../lib/status';
import { newId } from '../lib/id';

const STATUS_KEY = {
  needsReview: 'home.status.needsReview',
  needsPositioning: 'home.status.needsPositioning',
  draft: 'home.status.draft',
  done: 'home.status.done',
} as const satisfies Record<DomainStatus, string>;

export function HomePage() {
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
  const period = periodOf(new Date(), data.settings.cycle);

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
      <ul className="domain-list">
        {data.domains.map((d) => {
          const status = domainStatus(d.id, period, data.positionings, data.drafts);
          return (
            <li key={d.id} className={`domain status-${status}`}>
              <span className="domain-name">{d.name}</span>
              <span className="domain-status">{t(STATUS_KEY[status])}</span>
              <button className="link" onClick={() => db.domains.update(d.id, { archived: true })}>
                {t('home.archive')}
              </button>
            </li>
          );
        })}
      </ul>
      <form className="row" onSubmit={addDomain}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('home.domainPlaceholder')} />
        <button type="submit">{t('home.addDomain')}</button>
      </form>
    </section>
  );
}
