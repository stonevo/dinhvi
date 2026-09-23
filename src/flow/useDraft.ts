import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db/db';
import { applyPatch, draftId, furthestAllowedStep, type DraftData } from './draft';

type State = { loaded: boolean; data: DraftData; step: number };

/**
 * Nháp của một lĩnh vực trong một kỳ. Giữ bản trong bộ nhớ để gõ không bị giật,
 * ghi xuống IndexedDB sau mỗi lần dừng gõ ngắn và khi rời màn hình.
 */
export function useDraft(domainId: string, period: string) {
  const id = draftId(domainId, period);
  const [state, setState] = useState<State>({ loaded: false, data: {}, step: 1 });
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const latest = useRef(state);
  latest.current = state;
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    db.drafts.get(id).then((d) => {
      if (!alive) return;
      const data = (d?.data ?? {}) as DraftData;
      // Không cho mở lại ở bước vượt quá bước được phép (dữ liệu có thể đã sửa tay).
      const step = Math.min(d?.step ?? 1, furthestAllowedStep(data));
      setState({ loaded: true, data, step: Math.max(1, step) });
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const persist = useCallback(async () => {
    if (!dirty.current || !latest.current.loaded) return;
    dirty.current = false;
    const { data, step } = latest.current;
    await db.drafts.put({ id, domainId, period, step, data: data as Record<string, unknown>, updatedAt: new Date().toISOString() });
    setSavedAt(Date.now());
  }, [id, domainId, period]);

  useEffect(() => {
    if (!state.loaded || !dirty.current) return;
    const timer = setTimeout(persist, 500);
    return () => clearTimeout(timer);
  }, [state, persist]);

  // Ghi nốt khi rời màn hình hoặc tab bị ẩn.
  useEffect(() => {
    const onHide = () => void persist();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      void persist();
    };
  }, [persist]);

  const update = useCallback((patch: Partial<DraftData>) => {
    dirty.current = true;
    setState((s) => ({ ...s, data: applyPatch(s.data, patch) }));
  }, []);

  const setStep = useCallback((step: number) => {
    dirty.current = true;
    setState((s) => ({ ...s, step: Math.max(1, Math.min(step, furthestAllowedStep(s.data))) }));
  }, []);

  /** Bỏ ghi nháp (dùng ngay sau khi đã chốt bản ghi). */
  const discard = useCallback(() => {
    dirty.current = false;
  }, []);

  return { ...state, update, setStep, savedAt, discard };
}
