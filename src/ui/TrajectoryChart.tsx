import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { TrajectoryPoint } from '../lib/trajectory';
import type { StaticData } from '../data/load';
import { formatPeriod } from '../lib/period';
import { t } from '../i18n';

const COL = 96;
const PAD_X = 48;
const TOP = 28;
const ROW = 36;
const HEIGHT = TOP + ROW * 5 + 40;

/**
 * Quỹ đạo một lĩnh vực: trục ngang là kỳ, trục dọc là hào 1–6. Chấm đặc = tự
 * định vị; hình thoi rỗng = nhìn lại; nét đứt giữa hai cái là độ lệch.
 */
export function TrajectoryChart({ points, data }: { points: TrajectoryPoint[]; data: StaticData }) {
  const [selected, setSelected] = useState<string | null>(null);
  const width = Math.max(PAD_X * 2 + COL * (points.length - 1), 320);
  const x = (i: number) => PAD_X + i * COL;
  const y = (line: number) => TOP + (6 - line) * ROW;
  const sel = points.find((p) => p.positioningId === selected);

  return (
    <div>
      <div className="chart-scroll">
        <svg className="trajectory" viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="group">
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <g key={l}>
              <line className="grid" x1={PAD_X - 24} x2={width - 16} y1={y(l)} y2={y(l)} />
              <text className="axis" x={8} y={y(l) + 4}>
                {l}
              </text>
            </g>
          ))}
          <polyline
            className="path"
            points={points.map((p, i) => `${x(i)},${y(p.line)}`).join(' ')}
          />
          {points.map((p, i) => {
            const h = data.hexagram(p.hexagram);
            const hs = p.hindsight;
            const label = `${formatPeriod(p.period)}: ${h.nameHanViet}, ${t('line.n', { n: p.line })}`;
            return (
              <g key={p.positioningId}>
                {hs?.line && (
                  <>
                    <line className="gap" x1={x(i)} x2={x(i)} y1={y(p.line)} y2={y(hs.line)} />
                    <rect
                      className="hindsight"
                      x={x(i) - 6}
                      y={y(hs.line) - 6}
                      width={12}
                      height={12}
                      transform={`rotate(45 ${x(i)} ${y(hs.line)})`}
                    >
                      <title>
                        {t('trajectory.legend.hindsight')}:{' '}
                        {hs.hexagram ? data.hexagram(hs.hexagram).nameHanViet : '—'}, {t('line.n', { n: hs.line })}
                      </title>
                    </rect>
                  </>
                )}
                <g
                  className={`point${selected === p.positioningId ? ' selected' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                  aria-pressed={selected === p.positioningId}
                  onClick={() => setSelected(selected === p.positioningId ? null : p.positioningId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(selected === p.positioningId ? null : p.positioningId);
                    }
                  }}
                >
                  <title>
                    {label}
                    {'\n'}
                    {t('hindsight.willNotDo')}: {p.willNotDo}
                    {p.painfulSentence ? `\n${t('hindsight.pain')}: ${p.painfulSentence}` : ''}
                  </title>
                  <circle cx={x(i)} cy={y(p.line)} r={7} />
                  <text className="point-label" x={x(i)} y={y(p.line) - 12} textAnchor="middle">
                    {h.nameHanViet}
                  </text>
                </g>
                <text className="axis" x={x(i)} y={HEIGHT - 12} textAnchor="middle">
                  {p.period}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="legend small muted">
        <span className="legend-dot" /> {t('trajectory.legend.self')} <span className="legend-diamond" />{' '}
        {t('trajectory.legend.hindsight')} · {t('trajectory.gapNote')}
      </p>
      {sel && (
        <div className="card small">
          <p>
            <strong>
              {formatPeriod(sel.period)} · {data.hexagram(sel.hexagram).nameHanViet} · {t('line.n', { n: sel.line })}
            </strong>{' '}
            <Link to={`/record/${sel.positioningId}`}>{t('home.action.view')}</Link>
          </p>
          <p>
            {t('hindsight.willNotDo')}: {sel.willNotDo}
          </p>
          {sel.painfulSentence && (
            <p>
              {t('hindsight.pain')}: {sel.painfulSentence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
