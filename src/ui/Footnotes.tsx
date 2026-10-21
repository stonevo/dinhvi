import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';

// Chú giải mở tại chỗ: bấm số chú trong câu → một ô nổi ngay dưới số đó (máy tính) hoặc trượt
// lên từ cạnh dưới (điện thoại). Mỗi trang chỉ mở một ô; bấm ra ngoài, nhấn Esc hay bấm lại số để đóng.

type Open = { key: string; anchor: HTMLElement; title: string; body: ReactNode };
type Ctx = { openKey: string | null; toggle: (o: Open) => void; popId: string };
const FootnoteCtx = createContext<Ctx | null>(null);

const NARROW = '(max-width: 640px)';
const isNarrow = () => typeof matchMedia === 'function' && matchMedia(NARROW).matches;

export function FootnoteLayer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popId = useId();
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [tick, setTick] = useState(0); // đổi cỡ cửa sổ → tính lại vị trí

  const close = useCallback((refocus: boolean) => {
    setOpen((o) => {
      if (o && refocus) o.anchor.focus();
      return null;
    });
  }, []);
  const toggle = useCallback((o: Open) => setOpen((cur) => (cur?.key === o.key ? null : o)), []);

  // Vị trí ô nổi (máy tính): ngay dưới số chú, không tràn mép màn hình.
  useLayoutEffect(() => {
    if (!open || isNarrow()) return setPos(null);
    const r = open.anchor.getBoundingClientRect();
    const width = Math.min(440, document.documentElement.clientWidth - 32);
    const left = Math.max(16, Math.min(r.left + window.scrollX - 24, window.scrollX + document.documentElement.clientWidth - width - 16));
    setPos({ top: r.bottom + window.scrollY + 8, left, width });
  }, [open, tick]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (popRef.current?.contains(el) || open.anchor.contains(el)) return;
      close(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(true);
    const onResize = () => setTick((n) => n + 1);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const narrow = open ? isNarrow() : false;
  return (
    <FootnoteCtx.Provider value={{ openKey: open?.key ?? null, toggle, popId }}>
      {children}
      {open &&
        createPortal(
          <div
            ref={popRef}
            id={popId}
            role="dialog"
            aria-label={open.title}
            className={'fn-pop' + (narrow ? ' fn-sheet' : '')}
            style={pos && !narrow ? { top: pos.top, left: pos.left, width: pos.width } : undefined}
          >
            <div className="fn-head">
              <strong>{open.title}</strong>
              <button type="button" className="fn-close" aria-label={t('books.noteClose')} onClick={() => close(true)}>
                ×
              </button>
            </div>
            <div className="fn-body">{open.body}</div>
          </div>,
          document.body,
        )}
    </FootnoteCtx.Provider>
  );
}

/** Số chú giải trong câu. Không có chú giải tương ứng (lỗi bản gốc) thì in số thường, không bấm được. */
export function FootnoteRef({ id, label, title, children }: { id: string; label: string; title: string; children?: ReactNode }) {
  const ctx = useContext(FootnoteCtx);
  if (!ctx || !children) return <sup className="fn-ref fn-missing">{label}</sup>;
  const expanded = ctx.openKey === id;
  return (
    <sup className="fn-ref">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? ctx.popId : undefined}
        aria-label={title}
        className={expanded ? 'active' : undefined}
        onClick={(e) => ctx.toggle({ key: id, anchor: e.currentTarget, title, body: children })}
      >
        {label}
      </button>
    </sup>
  );
}
