import { useLiveQuery } from 'dexie-react-hooks';
import { activeProfileData, db } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { formatPeriod, periodOf } from '../lib/period';
import { domainTrajectory, hasTrajectory, hexagramHistory, periodOverview } from '../lib/trajectory';
import { TrajectoryChart } from '../ui/TrajectoryChart';

export function TrajectoryPage() {
  const { data } = useStaticData();
  const q = useLiveQuery(() => activeProfileData(db));
  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;

  const period = periodOf(new Date(), q.settings.cycle);
  const rows = periodOverview(q.domains, q.positionings, period, (n) => data.hexagram(n).stageInCycle);
  const withTrajectory = q.domains.filter((d) => hasTrajectory(q.positionings.filter((p) => p.domainId === d.id)));

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
          </section>
        );
      })}
      <p className="muted small">{t('trajectory.noPrediction')}</p>
    </div>
  );
}
