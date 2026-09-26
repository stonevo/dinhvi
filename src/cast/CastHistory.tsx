import { useState } from 'react';
import { db } from '../db/db';
import type { StaticData } from '../data/load';
import { t } from '../i18n';
import { dueChecks, hitRate, outcomeStats, vnDateString, type OutcomeTally } from '../lib/castLog';
import type { CastOutcome, CastRecord } from '../types/schema';

/** Lịch sử gieo: đến hạn đối chiếu, đánh dấu ứng nghiệm, thống kê. */
export function CastHistory({
  history, data, viewing, onView,
}: {
  history: CastRecord[];
  data: StaticData;
  viewing: string | null;
  onView: (id: string | null) => void;
}) {
  const today = vnDateString(new Date());
  const due = dueChecks(history, today);
  const stats = outcomeStats(history);

  return (
    <section className="stack">
      {due.length > 0 && (
        <div className="card warning stack">
          <p>
            <strong>{t('log.due', { n: due.length })}</strong>
          </p>
          {due.map((c) => (
            <OutcomeForm key={c.id} cast={c} data={data} />
          ))}
        </div>
      )}

      <h2>{t('cast.history')}</h2>
      {history.length === 0 ? (
        <p className="muted">{t('cast.empty')}</p>
      ) : (
        <ul className="domain-list">
          {history.map((c) => (
            <li key={c.id} className="domain">
              <span className="domain-name">
                {data.hexagram(c.primary).nameHanViet}
                {c.transformed && <> → {data.hexagram(c.transformed).nameHanViet}</>}
                <span className="muted small"> · {c.question || new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
              </span>
              <span className="domain-status small">
                {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                {' · '}
                {t(`method.${c.method ?? 'coins'}` as 'method.coins')}
                {c.context && <> · {t(`context.${c.context}` as 'context.work')}</>}
                {c.outcome ? (
                  <> · {t(`log.verdict.${c.outcome.verdict}` as 'log.verdict.yes')}</>
                ) : c.checkOn ? (
                  <> · {t('log.checkOn', { date: new Date(`${c.checkOn}T00:00:00`).toLocaleDateString('vi-VN') })}</>
                ) : null}
              </span>
              <button type="button" className="link" onClick={() => onView(viewing === c.id ? null : c.id)}>
                {t('cast.view')}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  if (window.confirm(t('cast.delete.confirm'))) void db.casts.delete(c.id);
                }}
              >
                {t('cast.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {stats.total.n > 0 && <Stats stats={stats} />}
    </section>
  );
}

/** Đánh dấu kết quả một lần gieo: ứng nghiệm / một phần / không, kèm ghi chú. */
export function OutcomeForm({ cast, data }: { cast: CastRecord; data: StaticData }) {
  const [verdict, setVerdict] = useState<CastOutcome['verdict'] | ''>(cast.outcome?.verdict ?? '');
  const [note, setNote] = useState(cast.outcome?.note ?? '');
  async function save() {
    if (!verdict) return;
    await db.casts.update(cast.id, { outcome: { verdict, note: note.trim(), at: new Date().toISOString() } });
  }
  return (
    <div className="outcome stack">
      <p className="small">
        <strong>{cast.question || data.hexagram(cast.primary).nameHanViet}</strong> — {data.hexagram(cast.primary).nameHanViet}
        {cast.transformed && <> → {data.hexagram(cast.transformed).nameHanViet}</>} ·{' '}
        {new Date(cast.createdAt).toLocaleDateString('vi-VN')}
      </p>
      <div className="deck-chips" role="radiogroup" aria-label={t('log.verdictLabel')}>
        {(['yes', 'partial', 'no'] as const).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={verdict === v} className={verdict === v ? 'chip on' : 'chip'} onClick={() => setVerdict(v)}>
            {t(`log.verdict.${v}` as 'log.verdict.yes')}
          </button>
        ))}
      </div>
      <textarea rows={2} value={note} placeholder={t('log.notePlaceholder')} onChange={(e) => setNote(e.target.value)} />
      <div className="row">
        <button type="button" className="primary" disabled={!verdict} onClick={save}>
          {t('log.save')}
        </button>
      </div>
    </div>
  );
}

function pct(tally: OutcomeTally) {
  const r = hitRate(tally);
  return r === null ? '—' : `${Math.round(r * 100)}%`;
}

function Stats({ stats }: { stats: ReturnType<typeof outcomeStats> }) {
  const rows = (m: Map<string, OutcomeTally>, label: (k: string) => string) =>
    [...m.entries()].map(([k, v]) => (
      <tr key={k}>
        <td>{label(k)}</td>
        <td>{v.n}</td>
        <td>
          {v.yes} / {v.partial} / {v.no}
        </td>
        <td>{pct(v)}</td>
      </tr>
    ));
  return (
    <section className="stack">
      <h3>{t('log.stats')}</h3>
      <p className="small muted">{t('log.statsHint')}</p>
      <div className="table-scroll">
        <table className="study-progress">
          <thead>
            <tr>
              <th />
              <th>n</th>
              <th>{t('log.statsCols')}</th>
              <th>{t('log.hitRate')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{t('log.total')}</strong>
              </td>
              <td>{stats.total.n}</td>
              <td>
                {stats.total.yes} / {stats.total.partial} / {stats.total.no}
              </td>
              <td>{pct(stats.total)}</td>
            </tr>
            {rows(stats.byMethod, (k) => t(`method.${k}` as 'method.coins'))}
            {rows(stats.byContext, (k) => (k === 'none' ? t('log.noContext') : t(`context.${k}` as 'context.work')))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
