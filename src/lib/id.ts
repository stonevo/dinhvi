// ID xác định: thời gian + bộ đếm đơn điệu. App cố ý không dùng bất kỳ nguồn
// ngẫu nhiên nào (xem tests/no-randomness.test.ts).
let last = 0;
let counter = 0;

export function newId(now: number = Date.now()): string {
  if (now === last) counter += 1;
  else {
    last = now;
    counter = 0;
  }
  return `${now.toString(36)}-${counter.toString(36).padStart(3, '0')}`;
}
