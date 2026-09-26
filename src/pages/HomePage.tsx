import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { activeProfileData, db } from '../db/db';
import { useStaticData, type StaticData } from '../data/load';
import { t } from '../i18n';
import { comparePeriods, formatPeriod, periodOf } from '../lib/period';
import { domainStatus, unreviewedBefore, type DomainStatus } from '../lib/status';
import { newId } from '../lib/id';
import { reminderState } from '../lib/reminder';
import { dueChecks, vnDateString } from '../lib/castLog';
import { HexagramFigure } from '../ui/HexagramFigure';
import { monthHexagram, TIEU_TUC_NOTES } from '../lib/tieuTuc';
import type { Domain, Positioning } from '../types/schema';

const STATUS_KEY = {
  needsPositioning: 'home.status.needsPositioning',
  draft: 'home.status.draft',
  done: 'home.status.done',
} as const satisfies Record<DomainStatus, string>;

const ACTION_KEY = {
  needsPositioning: 'home.action.start',
  draft: 'home.action.continue',
  done: 'home.action.view',
} as const satisfies Record<DomainStatus, string>;

/** Trang chủ: bức tranh hiện tại — mỗi lĩnh vực một thẻ với quẻ, hào và điều chọn không làm. */
export function HomePage() {
  const { data: staticData } = useStaticData();
  const data = useLiveQuery(async () => {
    const p = await activeProfileData(db);
    const casts = await db.casts.where('profileId').equals(p.profileId).toArray();
    return { ...p, domains: p.domains.filter((d) => !d.archived), castDue: dueChecks(casts, vnDateString(new Date())).length };
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
    await db.domains.add({ id: newId(), profileId: data!.profileId, name: trimmed, createdAt: new Date().toISOString(), archived: false });
    setName('');
  }

  return (
    <section className="stack">
      <p className="intro">{t('home.intro')}</p>
      {data.castDue > 0 && (
        <p className="warning">
          {t('home.castDue', { n: data.castDue })} <Link to="/cast">{t('home.castDueLink')}</Link>
        </p>
      )}
      <h2 className="period">{t('home.period', { period: formatPeriod(period) })}</h2>
      {reminder.inAppDue && <p className="note">{t('home.reminderDue')}</p>}
      <MonthHexagramCard now={now} staticData={staticData} />

      <div className="domain-cards">
        {data.domains.map((d) => (
          <DomainCard
            key={d.id}
            domain={d}
            period={period}
            positionings={data.positionings.filter((p) => p.domainId === d.id)}
            status={domainStatus(d.id, period, data.positionings, data.drafts)}
            staticData={staticData}
          />
        ))}
      </div>

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

/** Chi tháng hiện tại theo tiết khí và quẻ tiêu tức ứng với tháng đó (tham khảo). */
function MonthHexagramCard({ now, staticData }: { now: Date; staticData: StaticData | null }) {
  const m = monthHexagram(now);
  const hex = staticData?.hexagram(m.hexagram);
  if (!hex) return null;
  const date = m.term.date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  return (
    <aside className="card month-hex">
      <HexagramFigure binary={hex.binary} size={40} label={hex.nameHanViet} />
      <div className="month-hex-body">
        <p className="small-caps">{t('home.monthHex.title')}</p>
        <p>
          <Link to={`/library/${hex.kingWenNumber}`}>
            {hex.nameHanViet} <span className="han">{hex.nameHan}</span>
          </Link>{' '}
          · {t('home.monthHex.month', { branch: m.branchName, term: m.term.name, date })}
        </p>
        <p className="muted small">{TIEU_TUC_NOTES[m.branch]}</p>
        <p className="muted small">
          {t('home.monthHex.convention')} <Link to="/intro/tieu-tuc">{t('home.monthHex.more')} →</Link>
        </p>
      </div>
    </aside>
  );
}

function DomainCard({
  domain,
  period,
  positionings,
  status,
  staticData,
}: {
  domain: Domain;
  period: string;
  positionings: Positioning[];
  status: DomainStatus;
  staticData: StaticData | null;
}) {
  const current = positionings.find((p) => p.period === period);
  const latest = current ?? [...positionings].sort((a, b) => comparePeriods(b.period, a.period))[0];
  const hex = latest && staticData ? staticData.hexagram(latest.finalHexagram) : null;
  const pending = unreviewedBefore(domain.id, period, positionings);
  const to = current ? `/record/${current.id}` : `/position/${domain.id}`;

  return (
    <article className={`domain-card status-${status}${current ? '' : ' is-stale'}`}>
      <header className="domain-card-head">
        <h3>{domain.name}</h3>
        <span className="domain-status">{t(STATUS_KEY[status])}</span>
      </header>

      {latest && hex ? (
        <div className="hex-head">
          <HexagramFigure binary={hex.binary} highlight={latest.finalLine} size={44} label={hex.nameHanViet} />
          <div>
            <p className="domain-card-hex">
              {hex.nameHanViet} <span className="han">{hex.nameHan}</span> · {t('line.n', { n: latest.finalLine })}
            </p>
            <p className="muted small">
              {current ? t(`stage.${hex.stageInCycle}`) : t('home.lastPeriod', { period: formatPeriod(latest.period) })}
            </p>
          </div>
        </div>
      ) : (
        <p className="muted small">{t('home.noRecord')}</p>
      )}

      {current && <p className="domain-card-wnd">{current.willNotDo}</p>}

      <footer className="domain-card-foot">
        <Link className="domain-action" to={to}>
          {t(ACTION_KEY[status])}
        </Link>
        <Link className="small" to={`/quick/${domain.id}`}>
          {t('quick.open')}
        </Link>
        {pending && (
          <Link className="review-link small" to={`/review/${pending.id}`}>
            {t('home.reviewPrev')}
          </Link>
        )}
        <button
          className="link"
          onClick={() => {
            if (window.confirm(t('home.archive.confirm', { name: domain.name }))) void db.domains.update(domain.id, { archived: true });
          }}
        >
          {t('home.archive')}
        </button>
      </footer>
    </article>
  );
}
