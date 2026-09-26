import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { t } from '../i18n';
import { CAST_METHODS } from '../types/schema';

/**
 * Mục "Gieo quẻ ▾" trên menu chính: rê chuột (máy tính) hoặc chạm (điện thoại) để
 * xổ các cách lập quẻ; chọn một cách là vào thẳng trang gieo với cách đó.
 */
export function NavCastMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname, search } = useLocation();
  const active = pathname === '/cast';

  // Đóng khi chạm ra ngoài hoặc bấm Esc; đóng khi đổi trang.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  useEffect(() => setOpen(false), [pathname, search]);

  const canHover = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

  return (
    <div
      ref={ref}
      className={'nav-menu' + (open ? ' open' : '')}
      onMouseEnter={() => canHover() && setOpen(true)}
      onMouseLeave={() => canHover() && setOpen(false)}
    >
      <button
        type="button"
        className={'nav-menu-trigger' + (active ? ' active' : '')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {t('nav.cast')} <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="nav-menu-list" role="menu">
          {CAST_METHODS.map((m) => (
            <Link key={m} role="menuitem" to={`/cast?m=${m}`} onClick={() => setOpen(false)}>
              {t(`method.${m}` as 'method.coins')}
            </Link>
          ))}
          <Link role="menuitem" className="nav-menu-sep" to="/cast#history" onClick={() => setOpen(false)}>
            {t('nav.castHistory')}
          </Link>
        </div>
      )}
    </div>
  );
}
