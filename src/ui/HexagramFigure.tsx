/** Hình quẻ sáu hào, vẽ từ dưới lên. Hào được đánh dấu tô màu nhấn. */
export function HexagramFigure({
  binary,
  highlight,
  size = 64,
  label,
}: {
  binary: string;
  highlight?: number;
  size?: number;
  label?: string;
}) {
  const w = 60;
  const bar = 6;
  const gap = 4;
  const h = 6 * bar + 5 * gap;
  return (
    <svg
      className="hexagram-figure"
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      role="img"
      aria-label={label}
    >
      {[...binary].map((c, i) => {
        const y = h - (i + 1) * bar - i * gap;
        const cls = highlight === i + 1 ? 'bar bar-hl' : 'bar';
        return c === '1' ? (
          <rect key={i} className={cls} x={0} y={y} width={w} height={bar} rx={1} />
        ) : (
          <g key={i} className={cls}>
            <rect x={0} y={y} width={26} height={bar} rx={1} />
            <rect x={34} y={y} width={26} height={bar} rx={1} />
          </g>
        );
      })}
    </svg>
  );
}
