import { useLiveQuery } from 'dexie-react-hooks';
import { activeProfileData, db } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { MIN_HINDSIGHT_RECORDS, calibrationReport, type Ratio } from '../lib/calibration';
import { positioningsToCsv } from '../lib/csv';
import { downloadText } from '../lib/download';
import { Term } from '../ui/Term';

const pct = (r: Ratio) => (r.rate === null ? t('cal.na') : `${Math.round(r.rate * 100)}%`);


/** Trang hiệu chỉnh (mục 6). Mọi con số kèm n; dưới ngưỡng thì nói rõ chưa đủ dữ liệu. */
export function CalibrationPage() {
  const { data } = useStaticData();
  const q = useLiveQuery(() => activeProfileData(db));
  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;

  const r = calibrationReport(q.positionings);
  const domainName = new Map(q.domains.map((d) => [d.id, d.name]));
  const exportCsv = () =>
    downloadText(
      `dinhvi-${new Date().toISOString().slice(0, 10)}.csv`,
      positioningsToCsv(q.positionings, q.domains),
      'text/csv;charset=utf-8',
    );

  return (
    <div className="stack">
      <h1>
        {t('nav.calibration')} <Term k="hieuChinh" />
      </h1>
      <div className="row">
        <button type="button" onClick={exportCsv} disabled={q.positionings.length === 0}>
          {t('cal.exportCsv')}
        </button>
      </div>

      {!r.sufficient ? (
        <p className="note">{t('cal.insufficient', { min: MIN_HINDSIGHT_RECORDS, n: r.reviewedCount })}</p>
      ) : (
        <>
          <section>
            <h2>{t('cal.byConfidence')}</h2>
            <ul className="stat-list">
              {([5, 4, 3, 2, 1] as const).map((c) => (
                <li key={c}>
                  {t('cal.byConfidence.row', { c, rate: pct(r.byConfidence[c]), n: r.byConfidence[c].n })}
                  <span className="bar-track" aria-hidden>
                    <span className="bar-fill" style={{ width: `${(r.byConfidence[c].rate ?? 0) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{t('cal.lineBias')}</h2>
            <p>
              {t('cal.lineBias.value', {
                v: r.lineBias.mean === null ? t('cal.na') : (r.lineBias.mean > 0 ? '+' : '') + r.lineBias.mean.toFixed(2),
                n: r.lineBias.n,
              })}
            </p>
            <p className="muted small">{t('cal.lineBias.explain')}</p>
          </section>

          <section>
            <h2>{t('cal.pretty')}</h2>
            <p>{t('cal.pretty.changed', { rate: pct(r.prettyBias.changed), n: r.prettyBias.changed.n })}</p>
            <p>{t('cal.pretty.toward', { rate: pct(r.prettyBias.towardCritic), n: r.prettyBias.towardCritic.n })}</p>
            <p className="muted small">{t('cal.pretty.explain')}</p>
          </section>

          <section>
            <h2>{t('cal.witness')}</h2>
            <p>
              {t('cal.witness.value', {
                closer: pct(r.witness.closer),
                tie: pct(r.witness.tie),
                farther: pct(r.witness.farther),
                n: r.witness.closer.n,
              })}
            </p>
          </section>

          <section>
            <h2>{t('cal.pain')}</h2>
            <p>
              {t('cal.pain.value', {
                a: pct(r.pain.specific),
                na: r.pain.specific.n,
                b: pct(r.pain.vagueOrNone),
                nb: r.pain.vagueOrNone.n,
              })}
            </p>
            <p className="muted small">{t('cal.pain.explain')}</p>
          </section>

          <section>
            <h2>{t('cal.willNotDo')}</h2>
            <p>
              {t('cal.willNotDo.value', {
                yes: pct(r.willNotDo.yes),
                partly: pct(r.willNotDo.partly),
                no: pct(r.willNotDo.no),
                n: r.willNotDo.yes.n,
              })}
            </p>
          </section>

          <section>
            <h2>{t('cal.method')}</h2>
            <p>
              {t('cal.method.value', {
                a: pct(r.method.self),
                na: r.method.self.n,
                b: pct(r.method.cast),
                nb: r.method.cast.n,
              })}
            </p>
          </section>

          <section>
            <h2>{t('cal.zones')}</h2>
            {Object.keys(r.zones).length === 0 && <p className="muted">{t('cal.zones.none')}</p>}
            {q.domains
              .filter((d) => r.zones[d.id])
              .map((d) => [d.id, r.zones[d.id]] as const)
              .map(([domainId, zones]) => (
              <div key={domainId}>
                <h3 className="small-caps">{domainName.get(domainId) ?? domainId}</h3>
                <ul className="stat-list">
                  {zones.slice(0, 5).map((z) => (
                    <li key={`${z.hexagram}:${z.line}`}>
                      {z.hexagram}. {data.hexagram(z.hexagram).nameHanViet}
                      {z.line && <> · {t('line.n', { n: z.line })}</>} — {z.count}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
