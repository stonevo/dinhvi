import { Link } from 'react-router-dom';
import type { StaticData } from '../data/load';
import {
  DIRECTION_ANGLE, HETU, LUOSHU, XIANTIAN_DIRECTION, HOUTIAN_DIRECTION, XIANTIAN_ORDER,
  binaryOfFuxi, circleAngle, squareIndex, type Direction,
} from '../lib/diagrams';
import { hexagramFromBinary } from '../lib/iching';
import { TRIGRAM_KEYS, type TrigramKey } from '../types/schema';
import { t } from '../i18n';

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Các hào của một quái/quẻ vẽ quanh tâm (0,0), hào sơ ở gần tâm vòng tròn (xoay
 * theo `angle`): dùng cho hình vòng. `len` = độ dài hào, `th` = độ dày.
 */
function Lines({ binary, len, th, gap }: { binary: string; len: number; th: number; gap: number }) {
  const n = binary.length;
  const total = n * th + (n - 1) * gap;
  return (
    <>
      {binary.split('').map((b, i) => {
        // i = 0 là hào sơ: nằm ở phía tâm (y dương sau khi xoay về tâm).
        const y = total / 2 - (i + 1) * th - i * gap;
        return b === '1' ? (
          <rect key={i} x={-len / 2} y={y} width={len} height={th} className="dg-bar" />
        ) : (
          <g key={i} className="dg-bar">
            <rect x={-len / 2} y={y} width={len * 0.42} height={th} />
            <rect x={len * 0.08} y={y} width={len * 0.42} height={th} />
          </g>
        );
      })}
    </>
  );
}

const DIR_LABEL: Record<Direction, string> = {
  S: 'Nam', SW: 'Tây Nam', W: 'Tây', NW: 'Tây Bắc', N: 'Bắc', NE: 'Đông Bắc', E: 'Đông', SE: 'Đông Nam',
};

/** Bát quái xếp vòng theo phương vị (Tiên thiên hoặc Hậu thiên). */
export function BaguaWheel({ kind, data }: { kind: 'xiantian' | 'houtian'; data: StaticData }) {
  const dirs = kind === 'xiantian' ? XIANTIAN_DIRECTION : HOUTIAN_DIRECTION;
  const R = 105;
  return (
    <svg className="diagram" viewBox="-170 -170 340 340" role="img" aria-label={t(`diagrams.fig.${kind}`)}>
      <circle r={52} className="dg-ring" />
      {TRIGRAM_KEYS.map((k: TrigramKey) => {
        const a = DIRECTION_ANGLE[dirs[k]];
        const x = R * Math.cos(rad(a));
        const y = R * Math.sin(rad(a));
        const tr = data.trigrams[k];
        const order = kind === 'xiantian' ? XIANTIAN_ORDER.indexOf(k) + 1 : null;
        const lx = 150 * Math.cos(rad(a));
        const ly = 150 * Math.sin(rad(a));
        return (
          <g key={k}>
            {/* xoay để hào sơ hướng vào tâm */}
            <g transform={`translate(${x} ${y}) rotate(${a + 90})`}>
              <Lines binary={tr.binary} len={40} th={6} gap={5} />
            </g>
            <text x={lx} y={ly - 4} className="dg-label" textAnchor="middle">
              {tr.nameHanViet} {order ? `(${order})` : ''}
            </text>
            <text x={lx} y={ly + 11} className="dg-sub" textAnchor="middle">
              {DIR_LABEL[dirs[k]]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** 64 quẻ Phục Hy xếp vòng tròn. */
export function FuxiCircle({ data }: { data: StaticData }) {
  const R = 190;
  return (
    <svg className="diagram diagram-lg" viewBox="-240 -240 480 480" role="img" aria-label={t('diagrams.fig.fuxi-circle')}>
      <circle r={150} className="dg-ring" />
      {Array.from({ length: 64 }, (_, k) => {
        const i = k + 1;
        const bin = binaryOfFuxi(i);
        const h = data.hexagram(hexagramFromBinary(bin));
        const a = circleAngle(i);
        const x = R * Math.cos(rad(a));
        const y = R * Math.sin(rad(a));
        return (
          <Link key={i} to={`/library/${h.kingWenNumber}`} aria-label={`${i}. ${h.nameHanViet}`}>
            <title>{`${i}. ${h.nameHanViet}`}</title>
            <g transform={`translate(${x} ${y}) rotate(${a + 90})`}>
              <Lines binary={bin} len={12} th={2.4} gap={1.6} />
            </g>
          </Link>
        );
      })}
      {(['S', 'N', 'E', 'W'] as Direction[]).map((d) => {
        const a = DIRECTION_ANGLE[d];
        return (
          <text key={d} x={228 * Math.cos(rad(a))} y={228 * Math.sin(rad(a)) + 4} className="dg-sub" textAnchor="middle">
            {DIR_LABEL[d]}
          </text>
        );
      })}
    </svg>
  );
}

/** 64 quẻ Phục Hy xếp hình vuông 8×8. */
export function FuxiSquare({ data }: { data: StaticData }) {
  const cell = 40;
  return (
    <svg className="diagram" viewBox={`-4 -4 ${8 * cell + 8} ${8 * cell + 8}`} role="img" aria-label={t('diagrams.fig.fuxi-square')}>
      {Array.from({ length: 64 }, (_, k) => {
        const r = Math.floor(k / 8) + 1;
        const c = (k % 8) + 1;
        const i = squareIndex(r, c);
        const bin = binaryOfFuxi(i);
        const h = data.hexagram(hexagramFromBinary(bin));
        return (
          <Link key={k} to={`/library/${h.kingWenNumber}`} aria-label={`${i}. ${h.nameHanViet}`}>
            <title>{`${i}. ${h.nameHanViet}`}</title>
            <rect x={(c - 1) * cell} y={(r - 1) * cell} width={cell} height={cell} className="dg-cell" />
            {/* hình vuông: hào sơ ở dưới như cách vẽ quẻ thường */}
            <g transform={`translate(${(c - 0.5) * cell} ${(r - 0.5) * cell})`}>
              <Lines binary={bin} len={22} th={3} gap={2} />
            </g>
          </Link>
        );
      })}
    </svg>
  );
}

function Dots({ n, x, y, yang, r = 5 }: { n: number; x: number; y: number; yang: boolean; r?: number }) {
  const step = 14;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={x + (i - (n - 1) / 2) * step} cy={y} r={r} className={yang ? 'dg-dot-yang' : 'dg-dot-yin'} />
      ))}
    </>
  );
}

/** Hà đồ: số lẻ (dương) chấm rỗng, số chẵn (âm) chấm đặc; mỗi phương hai số. */
export function HeTu() {
  const pos = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0], C: [0, 0] } as const;
  return (
    <svg className="diagram" viewBox="-190 -190 380 380" role="img" aria-label={t('diagrams.fig.hetu')}>
      {HETU.map(({ dir, inner, outer }) => {
        const [dx, dy] = pos[dir];
        if (dir === 'C') {
          return (
            <g key={dir}>
              <Dots n={5} x={0} y={0} yang />
              <Dots n={5} x={0} y={-26} yang={false} />
              <Dots n={5} x={0} y={26} yang={false} />
            </g>
          );
        }
        const vertical = dx === 0;
        const place = (dist: number, n: number, yang: boolean) =>
          vertical ? (
            <Dots n={n} x={0} y={dy * dist} yang={yang} />
          ) : (
            <g transform={`translate(${dx * dist} 0) rotate(90)`}>
              <Dots n={n} x={0} y={0} yang={yang} />
            </g>
          );
        return (
          <g key={dir}>
            {place(70, inner, inner % 2 === 1)}
            {place(110, outer, outer % 2 === 1)}
          </g>
        );
      })}
    </svg>
  );
}

/** Lạc thư: ô 3×3, số lẻ chấm rỗng, số chẵn chấm đặc. */
export function LuoShu() {
  const cell = 100;
  return (
    <svg className="diagram" viewBox="-10 -10 320 320" role="img" aria-label={t('diagrams.fig.luoshu')}>
      {LUOSHU.map((row, r) =>
        row.map((n, c) => {
          const cx = c * cell + cell / 2;
          const cy = r * cell + cell / 2;
          const top = Math.min(n, 5);
          return (
            <g key={`${r}-${c}`}>
              <rect x={c * cell} y={r * cell} width={cell} height={cell} className="dg-cell" />
              <Dots n={top} x={cx} y={n > 5 ? cy - 9 : cy} yang={n % 2 === 1} r={4.5} />
              {n > 5 && <Dots n={n - 5} x={cx} y={cy + 9} yang={n % 2 === 1} r={4.5} />}
              <text x={c * cell + 8} y={r * cell + 18} className="dg-sub">
                {n}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}

/** Bảng số nhị phân ↔ quẻ theo thứ tự Phục Hy (64 − số thứ tự = giá trị nhị phân, dương = 1, hào sơ là chữ số cao nhất). */
export function BinaryTable({ data }: { data: StaticData }) {
  return (
    <div className="table-scroll">
      <table className="intro-table dg-binary">
        <thead>
          <tr>
            <th>{t('diagrams.binary.fuxi')}</th>
            <th>{t('diagrams.binary.hex')}</th>
            <th>{t('diagrams.binary.bits')}</th>
            <th>{t('diagrams.binary.value')}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 64 }, (_, k) => {
            const i = k + 1;
            const bin = binaryOfFuxi(i);
            const h = data.hexagram(hexagramFromBinary(bin));
            return (
              <tr key={i}>
                <td>{i}</td>
                <td>
                  <Link to={`/library/${h.kingWenNumber}`}>{h.nameHanViet}</Link>
                </td>
                <td className="mono">{bin}</td>
                <td>{parseInt(bin, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
