/** Thái cực và vòng tám quái theo thứ tự Tiên thiên (Càn trên, Khôn dưới). */
const XIANTIAN = ['☰', '☴', '☵', '☶', '☷', '☳', '☲', '☱'];

export function Taiji({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={'taiji ' + className} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden>
      <circle r="48" className="taiji-yang" />
      <path className="taiji-yin" d="M0-48a48 48 0 0 1 0 96a24 24 0 0 1 0-48a24 24 0 0 0 0-48z" />
      <circle cy="-24" r="7" className="taiji-yin" />
      <circle cy="24" r="7" className="taiji-yang" />
      <circle r="48" className="taiji-rim" />
    </svg>
  );
}

export function BaguaRing({ size = 420, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={'bagua-ring ' + className} width={size} height={size} viewBox="-100 -100 200 200" aria-hidden>
      <circle r="96" className="ring-line" />
      <circle r="70" className="ring-line faint" />
      {XIANTIAN.map((s, i) => {
        const a = (i * 45 - 90) * (Math.PI / 180);
        const x = Math.cos(a) * 83;
        const y = Math.sin(a) * 83;
        return (
          <text key={i} x={x} y={y} className="ring-symbol" textAnchor="middle" dominantBaseline="central" transform={`rotate(${i * 45} ${x} ${y})`}>
            {s}
          </text>
        );
      })}
    </svg>
  );
}
