// Âm thanh và rung khi gieo xu. Tiếng xu tổng hợp bằng Web Audio (không cần file),
// rung bằng navigator.vibrate (Android; iOS Safari không hỗ trợ — bỏ qua êm).

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Một tiếng "keng" kim loại ngắn: vài họa âm lệch nhau, tắt nhanh. */
function clink(ac: AudioContext, at: number, pitch: number, gain = 0.18) {
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(gain, at + 0.005);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
  out.connect(ac.destination);
  for (const ratio of [1, 2.76, 5.4]) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * ratio, at);
    osc.connect(out);
    osc.start(at);
    osc.stop(at + 0.4);
  }
}

/** Tiếng ba đồng xu rơi (lệch nhau vài chục mili giây). */
export function playCoins(): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.02;
  [0, 0.07, 0.13].forEach((dt, i) => clink(ac, t0 + dt, 1900 + i * 260));
}

/** Tiếng chuông xoay (singing bowl) mở đầu tĩnh tâm: âm trầm, ngân dài. */
export function playBowl(): void {
  const ac = audio();
  if (!ac) return;
  const at = ac.currentTime + 0.05;
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(0.22, at + 0.08);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 6);
  out.connect(ac.destination);
  // Họa âm của bát đồng: lệch nhẹ để có tiếng "ngân" (beating).
  for (const [f, g] of [[196, 1], [198.5, 0.7], [530, 0.35], [1010, 0.15]] as const) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    gain.gain.value = g;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, at);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + 6.2);
  }
}

/** Tiếng chuông nhỏ khi đủ sáu hào. */
export function playBell(): void {
  const ac = audio();
  if (!ac) return;
  clink(ac, ac.currentTime + 0.02, 660, 0.22);
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // không hỗ trợ
  }
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
