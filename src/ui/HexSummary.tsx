import { useSummary } from '../data/load';
import { t } from '../i18n';

/** Tóm lược một quẻ (đọc trong một phút). `moving`: các hào động cần làm nổi (khi xem kết quả gieo). */
export function HexSummary({ n, moving = [], title }: { n: number; moving?: number[]; title?: string }) {
  const s = useSummary(n);
  if (!s) return null;
  return (
    <section className="card hex-summary stack">
      <p className="small-caps">{title ?? t('summary.title')}</p>
      <p>
        <strong>{t('summary.image')}</strong> {s.image}
      </p>
      <p>
        <strong>{t('summary.time')}</strong> {s.time}
      </p>
      <div className="summary-do">
        <p>
          <strong>{t('summary.do')}</strong> {s.do.join('; ')}.
        </p>
        <p>
          <strong>{t('summary.avoid')}</strong> {s.avoid.join('; ')}.
        </p>
      </div>
      <div>
        <p>
          <strong>{t('summary.lines')}</strong>
        </p>
        <ol className="summary-lines">
          {s.lines.map((l, i) => (
            <li key={i} className={moving.includes(i + 1) ? 'moving' : undefined}>
              {l}
              {moving.includes(i + 1) && <span className="muted small"> · {t('summary.moving')}</span>}
            </li>
          ))}
        </ol>
        {s.allMoving && <p className="small">{s.allMoving}</p>}
      </div>
    </section>
  );
}
