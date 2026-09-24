/**
 * Hình quẻ sáu hào, vẽ từ dưới lên. Hào được đánh dấu tô màu nhấn; hào động
 * có chấm bên phải. `binary` ngắn hơn 6 = đang gieo dở: hào chưa có vẽ mờ.
 */
export function HexagramFigure({
  binary,
  highlight,
  moving,
  size = 64,
  label,
}: {
  binary: string;
  highlight?: number;
  moving?: number[];
  size?: number;
  label?: string;
}) {
  const bars = 60;
  const w = moving ? bars + 14 : bars;
  const bar = 6;
  const gap = 4;
  const h = 6 * bar + 5 * gap;
  return (
    <svg
      className="hexagram-figure"
      viewBox={`0 0 ${w} ${h}`}
      width={(size * w) / bars}
      height={(size * h) / bars}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: 6 }, (_, i) => {
        const y = h - (i + 1) * bar - i * gap;
        const c = binary[i];
        if (c === undefined) return <rect key={i} className="bar-empty" x={0} y={y} width={bars} height={bar} rx={1} />;
        const cls = highlight === i + 1 ? 'bar bar-hl' : 'bar';
        return (
          <g key={i}>
            {c === '1' ? (
              <rect className={cls} x={0} y={y} width={bars} height={bar} rx={1} />
            ) : (
              <g className={cls}>
                <rect x={0} y={y} width={26} height={bar} rx={1} />
                <rect x={34} y={y} width={26} height={bar} rx={1} />
              </g>
            )}
            {moving?.includes(i + 1) && <circle className="moving-dot" cx={bars + 8} cy={y + bar / 2} r={3} />}
          </g>
        );
      })}
    </svg>
  );
}
