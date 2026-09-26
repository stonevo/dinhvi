import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { t } from '../i18n';

export type NavMenuItem = { to: string; label: string; separated?: boolean };

/**
 * Một mục menu chính có menu xổ: chữ là link tới trang chính của mục, mũi tên ▾
 * (hoặc rê chuột trên máy tính) mở danh sách trang con.
 */
export function NavMenu({
  label, to, items, activeWhen, menuLabel,
}: {
  label: string;
  to: string;
  items: NavMenuItem[];
  /** Mục sáng lên khi đường dẫn hiện tại thoả điều kiện này. */
  activeWhen: (pathname: string) => boolean;
  /** Nhãn đọc cho nút mũi tên (trình đọc màn hình). */
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname, search, hash } = useLocation();
  const active = activeWhen(pathname);

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
  useEffect(() => setOpen(false), [pathname, search, hash]);

  const canHover = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

  return (
    <div
      ref={ref}
      className={'nav-menu' + (open ? ' open' : '')}
      onMouseEnter={() => canHover() && setOpen(true)}
      onMouseLeave={() => canHover() && setOpen(false)}
    >
      <NavLink to={to} end className={() => 'nav-menu-label' + (active ? ' active' : '')}>
        {label}
      </NavLink>
      <button type="button" className="nav-menu-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={menuLabel} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="nav-menu-list" role="menu">
          {items.map((it) => (
            <Link key={it.to} role="menuitem" className={it.separated ? 'nav-menu-sep' : undefined} to={it.to} onClick={() => setOpen(false)}>
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Các mục menu xổ dùng trong app. */
export const castMenuItems = (methods: readonly string[]): NavMenuItem[] => [
  ...methods.map((m) => ({ to: `/cast?m=${m}`, label: t(`method.${m}` as 'method.coins') })),
  { to: '/cast#history', label: t('nav.castHistory'), separated: true },
];
