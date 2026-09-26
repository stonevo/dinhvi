import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { t } from '../i18n';

/** Mục trong menu xổ; `children` = menu cấp 2 (vd. các bài Nhập môn). */
export type NavMenuItem = { to: string; label: string; separated?: boolean; children?: NavMenuItem[] };

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
          {items.map((it) =>
            it.children?.length ? (
              <SubMenu key={it.to} item={it} canHover={canHover} onPick={() => setOpen(false)} />
            ) : (
              <Link key={it.to} role="menuitem" className={it.separated ? 'nav-menu-sep' : undefined} to={it.to} onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Menu cấp 2: máy có chuột — rê vào thì bật sang phải; máy cảm ứng — chạm ▸ để mở
 * danh sách ngay bên dưới. Chữ của mục vẫn là link tới trang chính của mục.
 */
function SubMenu({ item, canHover, onPick }: { item: NavMenuItem; canHover: () => boolean; onPick: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={'nav-sub' + (open ? ' open' : '')}
      onMouseEnter={() => canHover() && setOpen(true)}
      onMouseLeave={() => canHover() && setOpen(false)}
    >
      <div className="nav-sub-head">
        <Link role="menuitem" to={item.to} onClick={onPick}>
          {item.label}
        </Link>
        <button type="button" className="nav-sub-toggle" aria-expanded={open} aria-label={t('nav.subMenu', { label: item.label })} onClick={() => setOpen((o) => !o)}>
          <span aria-hidden>▸</span>
        </button>
      </div>
      {open && (
        <div className="nav-sub-list" role="menu">
          {item.children!.map((c) => (
            <Link key={c.to} role="menuitem" to={c.to} onClick={onPick}>
              {c.label}
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
