import { t } from '../i18n';

/** Mặt một đồng tiền cổ lỗ vuông: mặt chữ (ngửa) có bốn chữ, mặt lưng (sấp) để trơn. */
function CoinFace({ side }: { side: 'heads' | 'tails' }) {
  return (
    <svg viewBox="-50 -50 100 100" className={'coin-face ' + side} aria-hidden>
      <defs>
        <radialGradient id={`bronze-${side}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={side === 'heads' ? '#f1d489' : '#dcbc6f'} />
          <stop offset="55%" stopColor={side === 'heads' ? '#c49a45' : '#aa843a'} />
          <stop offset="100%" stopColor="#6f5220" />
        </radialGradient>
      </defs>
      <circle r="48" fill={`url(#bronze-${side})`} />
      <circle r="44" fill="none" stroke="#5b4216" strokeOpacity="0.55" strokeWidth="2.5" />
      <rect x="-12" y="-12" width="24" height="24" fill="#1a1422" stroke="#5b4216" strokeWidth="3" />
      {side === 'heads' ? (
        <g className="coin-chars" fill="#4a3510" fontSize="17" fontWeight="700" textAnchor="middle" dominantBaseline="central">
          <text y="-29">開</text>
          <text y="29">元</text>
          <text x="29">通</text>
          <text x="-29">寶</text>
        </g>
      ) : (
        <g stroke="#5b4216" strokeOpacity="0.45" strokeWidth="2" fill="none">
          <path d="M-30 0a30 30 0 0 1 60 0" />
          <circle r="30" strokeDasharray="2 6" />
        </g>
      )}
    </svg>
  );
}

/**
 * Ba đồng tiền cổ. `coins`: 3 = ngửa (mặt chữ), 2 = sấp (mặt lưng). `tossing`:
 * đang tung (bay lên, xoay, rơi xuống; tắt khi người dùng chọn giảm chuyển động).
 */
export function CoinToss({ coins, tossing }: { coins: (2 | 3)[] | null; tossing: boolean }) {
  return (
    <div className={'coins' + (tossing ? ' tossing' : '')} aria-live="polite">
      {[0, 1, 2].map((i) => {
        const face = coins?.[i];
        return (
          <div key={i} className="coin" style={{ animationDelay: `${i * 90}ms` }}>
            <div className={'coin-inner' + (face === 2 ? ' tails' : '')} style={{ animationDelay: `${i * 90}ms` }}>
              <CoinFace side="heads" />
              <CoinFace side="tails" />
            </div>
            <div className="coin-shadow" style={{ animationDelay: `${i * 90}ms` }} />
          </div>
        );
      })}
      {coins && !tossing && (
        <span className="sr-only">{coins.map((c) => (c === 3 ? t('cast.heads') : t('cast.tails'))).join(', ')}</span>
      )}
    </div>
  );
}
