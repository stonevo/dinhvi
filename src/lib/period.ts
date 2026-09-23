export type Cycle = 'quarter' | 'month';

/** "2026-Q3" hoặc "2026-09" theo giờ địa phương. */
export function periodOf(date: Date, cycle: Cycle): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return cycle === 'quarter' ? `${y}-Q${Math.ceil(m / 3)}` : `${y}-${String(m).padStart(2, '0')}`;
}

/** Khoá sắp xếp tuyệt đối theo tháng bắt đầu kỳ, để so sánh kỳ khác loại. */
export function periodStartIndex(period: string): number {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return Number(q[1]) * 12 + (Number(q[2]) - 1) * 3;
  const mo = /^(\d{4})-(\d{2})$/.exec(period);
  if (mo) return Number(mo[1]) * 12 + Number(mo[2]) - 1;
  throw new Error(`Kỳ không hợp lệ: ${period}`);
}

export function comparePeriods(a: string, b: string): number {
  return periodStartIndex(a) - periodStartIndex(b);
}

export function formatPeriod(period: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return `Quý ${q[2]}/${q[1]}`;
  const mo = /^(\d{4})-(\d{2})$/.exec(period);
  if (mo) return `Tháng ${Number(mo[2])}/${mo[1]}`;
  return period;
}
