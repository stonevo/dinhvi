import { useLiveQuery } from 'dexie-react-hooks';
import { activeProfileData, db } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { formatPeriod, periodOf } from '../lib/period';
import { domainTrajectory, hasTrajectory, hexagramHistory, periodOverview } from '../lib/trajectory';
import { TrajectoryChart } from '../ui/TrajectoryChart';
import type { StaticData } from '../data/load';
import type { QuickNote } from '../types/schema';

/** Ghi nhanh của một lĩnh vực, mới nhất trước. */
function QuickNotes({ notes, data }: { notes: QuickNote[]; data: StaticData }) {
  if (notes.length === 0) return null;
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <h3 className="small-caps">{t('quick.list')}</h3>
      <ul className="stat-list">
        {sorted.map((n) => (
          <li key={n.id}>
            <span className="muted small">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
            <span>
              {data.hexagram(n.hexagram).nameHanViet} · {t('line.n', { n: n.line })}
            </span>
            <span>{n.note}</span>
            <button
              type="button"
              className="link"
              onClick={() => {
                if (window.confirm(t('quick.delete.confirm'))) void db.quickNotes.delete(n.id);
              }}
            >
              {t('cast.delete')}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function TrajectoryPage() {
  const { data } = useStaticData();
  const q = useLiveQuery(() => activeProfileData(db));
  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;

  const period = periodOf(new Date(), q.settings.cycle);
  const rows = periodOverview(q.domains, q.positionings, period, (n) => data.hexagram(n).stageInCycle);
  const withTrajectory = q.domains.filter((d) => hasTrajectory(q.positionings.filter((p) => p.domainId === d.id)));
  const quickOnly = q.domains.filter((d) => !withTrajectory.includes(d) && q.quickNotes.some((x) => x.domainId === d.id));

  return (
    <div className="stack">
      <h1>{t('nav.trajectory')}</h1>

      <section>
        <h2>{t('trajectory.overview', { period: formatPeriod(period) })}</h2>
        <div className="table-scroll">
          <table className="overview">
            <thead>
              <tr>
                <th>{t('trajectory.col.domain')}</th>
                <th>{t('trajectory.col.hexagram')}</th>
                <th>{t('trajectory.col.line')}</th>
                <th>{t('trajectory.col.stage')}</th>
                <th>{t('trajectory.col.confidence')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ domain, positioning: p }) => (
                <tr key={domain.id}>
                  <td>{domain.name}</td>
                  {p ? (
                    <>
                      <td>
                        {p.hexagram}. {data.hexagram(p.hexagram).nameHanViet}
                      </td>
                      <td>{p.line}</td>
                      <td>{p.stage ? t(`stage.${p.stage}`) : '—'}</td>
                      <td>{p.confidence}/5</td>
                    </>
                  ) : (
                    <td colSpan={4} className="muted">
                      {t('trajectory.notYet')}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {withTrajectory.length === 0 && <p className="muted">{t('trajectory.empty')}</p>}

      {withTrajectory.map((d) => {
        const points = domainTrajectory(q.positionings, d.id);
        const history = hexagramHistory(q.positionings, d.id);
        return (
          <section key={d.id}>
            <h2>{d.name}</h2>
            <TrajectoryChart points={points} data={data} />
            <h3 className="small-caps">{t('trajectory.history')}</h3>
            <ol className="history">
              {history.hexagrams.map((n, i) => (
                <li key={i}>
                  {i > 0 && (
                    <span className="step-kind muted small">
                      {t(`trajectory.step.${history.steps[i - 1].kind}`, { d: Math.abs(history.steps[i - 1].distance) })}
                    </span>
                  )}
                  <span className="chip">
                    {n}. {data.hexagram(n).nameHanViet}
                  </span>
                </li>
              ))}
            </ol>
            <p className="muted small">
              {t('trajectory.follows', { k: history.followsSequence.k, n: history.followsSequence.n })}
            </p>
            <QuickNotes notes={q.quickNotes.filter((x) => x.domainId === d.id)} data={data} />
          </section>
        );
      })}
      {quickOnly.map((d) => (
        <section key={d.id}>
          <h2>{d.name}</h2>
          <QuickNotes notes={q.quickNotes.filter((x) => x.domainId === d.id)} data={data} />
        </section>
      ))}
      <p className="muted small">{t('trajectory.noPrediction')}</p>
    </div>
  );
}
