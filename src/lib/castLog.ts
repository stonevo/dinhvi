// Nhật ký gieo: lần gieo đến hạn đối chiếu, thống kê ứng nghiệm theo phương pháp và ngữ cảnh.
import type { CastMethod, CastRecord, ContextKey } from '../types/schema';

/** Ngày YYYY-MM-DD theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ của máy. */
export function vnDateString(d: Date): string {
  const v = new Date(d.getTime() + 7 * 3600_000);
  return v.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lần gieo đã tới ngày đối chiếu mà chưa đánh dấu kết quả, cũ nhất trước. */
export function dueChecks(casts: CastRecord[], today: string): CastRecord[] {
  return casts
    .filter((c) => c.checkOn && c.checkOn <= today && !c.outcome)
    .sort((a, b) => (a.checkOn! < b.checkOn! ? -1 : a.checkOn! > b.checkOn! ? 1 : 0));
}

export type OutcomeTally = { n: number; yes: number; partial: number; no: number };
const empty = (): OutcomeTally => ({ n: 0, yes: 0, partial: 0, no: 0 });

/** Tỉ lệ ứng nghiệm: đúng = 1, một phần = 0,5, không = 0. Null khi chưa có lần nào. */
export function hitRate(t: OutcomeTally): number | null {
  return t.n ? (t.yes + t.partial * 0.5) / t.n : null;
}

/** Thống kê các lần gieo đã đối chiếu, theo phương pháp và theo ngữ cảnh. */
export function outcomeStats(casts: CastRecord[]) {
  const total = empty();
  const byMethod = new Map<CastMethod, OutcomeTally>();
  const byContext = new Map<ContextKey | 'none', OutcomeTally>();
  for (const c of casts) {
    if (!c.outcome) continue;
    const m = c.method ?? 'coins';
    const k = c.context ?? 'none';
    for (const t of [total, get(byMethod, m), get(byContext, k)]) {
      t.n++;
      t[c.outcome.verdict]++;
    }
  }
  return { total, byMethod, byContext };
}

function get<K>(m: Map<K, OutcomeTally>, k: K): OutcomeTally {
  let t = m.get(k);
  if (!t) m.set(k, (t = empty()));
  return t;
}
