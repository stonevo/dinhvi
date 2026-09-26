import { t } from '../i18n';

/**
 * Ba đồng xu. `coins`: 3 = ngửa, 2 = sấp. `tossing`: đang lật (hiệu ứng CSS 3D;
 * tắt khi người dùng chọn giảm chuyển động).
 */
export function CoinToss({ coins, tossing }: { coins: (2 | 3)[] | null; tossing: boolean }) {
  return (
    <div className={'coins' + (tossing ? ' tossing' : '')} aria-live="polite">
      {[0, 1, 2].map((i) => {
        const face = coins?.[i];
        return (
          <div key={i} className="coin" style={{ animationDelay: `${i * 70}ms` }}>
            <div className={'coin-inner' + (face === 2 ? ' tails' : '')}>
              <span className="coin-face heads" aria-hidden>
                {t('coin.heads')}
              </span>
              <span className="coin-face tails" aria-hidden>
                {t('coin.tails')}
              </span>
            </div>
          </div>
        );
      })}
      {coins && !tossing && (
        <span className="sr-only">{coins.map((c) => (c === 3 ? t('cast.heads') : t('cast.tails'))).join(', ')}</span>
      )}
    </div>
  );
}
