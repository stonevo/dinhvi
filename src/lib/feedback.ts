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

/** Tiếng gỗ trầm khi xu chạm mâm: một nhịp nhiễu ngắn qua bộ lọc thấp. */
function thud(ac: AudioContext, at: number, gain = 0.1) {
  const len = Math.floor(ac.sampleRate * 0.08);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  // Nhiễu tất định (không dùng Math.random): dãy LCG, tắt dần.
  let x = 12345;
  for (let i = 0; i < len; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    d[i] = ((x / 0x7fffffff) * 2 - 1) * (1 - i / len) ** 2;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 380;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(at);
}

/** Tiếng đồng ngân trầm: vài họa âm thấp, họa âm cao nhỏ dần, tắt chậm. */
function bronze(ac: AudioContext, at: number, pitch: number, gain = 0.06) {
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(gain, at + 0.01);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  out.connect(lp).connect(ac.destination);
  for (const [ratio, amp] of [[1, 1], [2.42, 0.35], [3.9, 0.12]] as const) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    g.gain.value = amp;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * ratio, at);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + 1.2);
  }
}

/** Tiếng ba đồng xu rơi xuống mâm gỗ: thưa, trầm, ngân nhẹ. */
export function playCoins(): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.02;
  [
    [0, 820],
    [0.17, 930],
    [0.31, 870],
  ].forEach(([dt, pitch]) => {
    thud(ac, t0 + dt);
    bronze(ac, t0 + dt + 0.005, pitch);
  });
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
