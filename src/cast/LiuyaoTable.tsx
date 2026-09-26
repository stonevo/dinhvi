import type { StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import type { LiuyaoChart } from '../lib/liuyao';

/** Bảng Lục Hào: hào 6 ở trên, hào 1 ở dưới, như cách an quẻ truyền thống. */
export function LiuyaoTable({ chart, data }: { chart: LiuyaoChart; data: StaticData }) {
  const rows = [...chart.lines].reverse();
  const name = (n: number) => fullHexagramName(data.hexagram(n));
  return (
    <section className="stack liuyao">
      <p>
        <strong>{name(chart.primary.number)}</strong> · {t('liuyao.palace', { palace: chart.palace.label, element: chart.palace.elementLabel })} ·{' '}
        {chart.palace.generationLabel}
        {chart.transformed && (
          <>
            {' '}
            → <strong>{name(chart.transformed.number)}</strong>
          </>
        )}
      </p>
      <p className="small muted">
        {t('liuyao.time', { day: chart.day.label, month: chart.month.label, void: chart.void.labels.join(', ') })} ·{' '}
        {t('liuyao.mutual', { name: name(chart.mutual.number) })}
      </p>

      <div className="table-scroll">
        <table className="liuyao-table">
          <thead>
            <tr>
              <th>{t('liuyao.col.spirit')}</th>
              <th>{t('liuyao.col.hidden')}</th>
              <th>{t('liuyao.col.line')}</th>
              <th aria-label={t('liuyao.col.figure')} />
              <th>{t('liuyao.col.changed')}</th>
              <th>{t('liuyao.col.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.position} className={l.moving ? 'moving' : ''}>
                <td>{l.spiritLabel}</td>
                <td className="small">{l.hidden.map((h) => h.label).join('; ')}</td>
                <td>
                  <strong>{l.liuqinLabel}</strong> {l.stemLabel} {l.branchLabel} <span className="han">{l.hanzi}</span> · {l.elementLabel}
                </td>
                <td className="liuyao-figure">
                  <span className={'bar ' + (l.yang ? 'yang' : 'yin')} aria-label={l.yang ? t('liuyao.yang') : t('liuyao.yin')} />
                  {l.moving && <span className="mark">{l.yang ? '○' : '×'}</span>}
                  {l.shi && <span className="tag">{t('liuyao.shi')}</span>}
                  {l.ying && <span className="tag">{t('liuyao.ying')}</span>}
                </td>
                <td>{l.changed ? l.changed.label : ''}</td>
                <td className="small">
                  {l.void && <span className="tag warn">{t('liuyao.void')}</span>} {t('liuyao.dayRel', { rel: l.day.label })}, {t('liuyao.monthRel', { rel: l.month.label })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chart.missing.length > 0 && <p className="small muted">{t('liuyao.missing', { list: chart.missing.map((m) => m.label).join(', ') })}</p>}

      {chart.useGod && (
        <div className="card">
          <p className="small-caps">{t('liuyao.useGod')}</p>
          <p>
            <strong>{chart.useGod.label}</strong>
            {chart.useGod.positions.length > 0
              ? ` — ${t('liuyao.useGodAt', { lines: chart.useGod.positions.join(', ') })}`
              : chart.useGod.hidden.length > 0
                ? ` — ${t('liuyao.useGodHidden', { list: chart.useGod.hidden.map((h) => h.label).join('; ') })}`
                : ''}
          </p>
          <p className="small">{chart.useGod.explanation}</p>
          {chart.useGod.notes.map((n) => (
            <p key={n.key} className="small muted">
              {n.label}: {n.text}
            </p>
          ))}
        </div>
      )}
      <p className="small muted">{t('liuyao.disclaimer')}</p>
    </section>
  );
}
