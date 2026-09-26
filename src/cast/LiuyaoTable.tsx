import type { StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import { LIUQIN_LABELS, type LineAssessment, type LiuyaoChart, type RoleInfo, type UseGodKey } from '../lib/liuyao';

const USE_GOD_KEYS: UseGodKey[] = ['self', 'parent', 'brother', 'child', 'wealth', 'officer'];

/** Bảng Lục Hào: hào 6 ở trên, hào 1 ở dưới, như cách an quẻ truyền thống. */
export function LiuyaoTable({
  chart, data, useGod, onUseGod,
}: {
  chart: LiuyaoChart;
  data: StaticData;
  useGod?: UseGodKey;
  onUseGod?: (k: UseGodKey | undefined) => void;
}) {
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
              <th>{t('liuyao.col.assess')}</th>
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
                <td className="small">
                  <LineFlags a={chart.assessment?.lines[l.position - 1]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chart.assessment?.useGod && <UseGodCard a={chart.assessment.useGod} />}

      {chart.missing.length > 0 && <p className="small muted">{t('liuyao.missing', { list: chart.missing.map((m) => m.label).join(', ') })}</p>}

      {onUseGod && (
        <label className="field">
          <span className="small muted">{t('liuyao.pickUseGod')}</span>
          <select value={useGod ?? ''} onChange={(e) => onUseGod((e.target.value || undefined) as UseGodKey | undefined)}>
            <option value="">{t('liuyao.pickUseGod.auto')}</option>
            {USE_GOD_KEYS.map((k) => (
              <option key={k} value={k}>
                {k === 'self' ? t('liuyao.self') : LIUQIN_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      )}
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

/** Luận một hào: vượng suy theo tháng, nguyệt phá, nhật xung, tuần không, hóa của hào động, lực. */
function LineFlags({ a }: { a?: LineAssessment }) {
  if (!a) return null;
  const flags: string[] = [a.month.label];
  if (a.month.break) flags.push(a.month.break.label.split(' (')[0]);
  if (a.day.clash) flags.push(a.day.clash.label.split(' (')[0]);
  if (a.void) flags.push(a.void.label.split(' (')[0]);
  if (a.change) {
    flags.push(a.change.relationLabel);
    if (a.change.progressLabel) flags.push(a.change.progressLabel);
    if (a.change.void) flags.push(t('liuyao.changeVoid'));
    if (a.change.monthBreak) flags.push(t('liuyao.changeBreak'));
  }
  return (
    <span title={a.strength.reasons.map((r) => `${r.label} — ${r.source}`).join('\n')}>
      <strong>{a.strength.label}</strong> · {flags.filter(Boolean).join(' · ')}
    </span>
  );
}

function RoleRow({ r }: { r: RoleInfo }) {
  return (
    <li>
      <strong>{r.roleLabel}</strong> ({r.liuqinLabel}):{' '}
      {r.present
        ? r.lines.map((l) => `${t('line.n', { n: l.position })} · ${l.strengthLabel}${l.moving ? ' · ' + t('liuyao.moving') : l.hiddenMove ? ' · ' + t('liuyao.hiddenMove') : ''}`).join('; ')
        : t('liuyao.absent')}
    </li>
  );
}

/** Luận Dụng thần: lực và lý do (kèm nguồn), nguyên – kỵ – cừu thần, ghi chú. */
function UseGodCard({ a }: { a: NonNullable<NonNullable<LiuyaoChart['assessment']>['useGod']> }) {
  return (
    <div className="card stack">
      <p className="small-caps">{t('liuyao.assessTitle', { label: a.label })}</p>
      <p>
        <strong>{a.verdict.label}</strong>
        {a.primary && <> · {t('line.n', { n: a.primary })}</>}
        {a.primaryNote && <span className="small muted"> — {a.primaryNote}</span>}
      </p>
      <ul className="small">
        {a.verdict.reasons.map((r, i) => (
          <li key={i}>
            {r.effect > 0 ? '＋' : r.effect < 0 ? '－' : '·'} {r.label} <span className="muted">({r.source})</span>
          </li>
        ))}
      </ul>
      {a.hidden.length > 0 && (
        <ul className="small">
          {a.hidden.map((h) => (
            <li key={h.position}>
              {t('liuyao.hiddenAt', { label: h.label, n: h.position })}: <strong>{h.verdictLabel}</strong>
            </li>
          ))}
        </ul>
      )}
      {a.standIns.map((s) => (
        <p key={s.pillar} className="small">
          {s.label} <span className="muted">({s.source})</span>
        </p>
      ))}
      <ul className="small">
        <RoleRow r={a.yuan} />
        <RoleRow r={a.ji} />
        <RoleRow r={a.chou} />
      </ul>
      {a.notes.map((n) => (
        <p key={n.key} className="small">
          {n.label} <span className="muted">({n.source})</span>
        </p>
      ))}
      <p className="small muted">{t('liuyao.assessNote')}</p>
    </div>
  );
}
