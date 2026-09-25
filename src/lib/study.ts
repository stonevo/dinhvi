// Trang "Học": bộ thẻ, lịch ôn lặp lại ngắt quãng, và cách chọn đáp án nhiễu.
// Không dùng nguồn ngẫu nhiên: thứ tự đáp án xáo theo hạt giống suy từ id thẻ và
// số lần đã ôn, nên kiểm thử được và mỗi lần ôn lại thấy thứ tự khác.
import { TRIGRAM_KEYS, type StudyState, type TrigramKey } from '../types/schema';
import { oppositeHexagram, reversedHexagram, trigramsOf } from './iching';

export const DECKS = ['trigram', 'name', 'build', 'keyword', 'order', 'pair', 'line'] as const;
export type DeckKey = (typeof DECKS)[number];

/** `n`: số quẻ 1..64; chỉ số quái 0..7 với bộ "trigram"; số hào 1..384 với bộ "line" ((quẻ − 1) × 6 + hào). */
export type Card = { id: string; deck: DeckKey; n: number };

export const DAY = 86_400_000;
/** Ôn lại sau khi trả lời sai (trong cùng buổi). */
export const RELEARN_MS = 10 * 60_000;
/** Thẻ có khoảng cách từ chừng này ngày trở lên coi là đã thuộc. */
export const MASTERED_DAYS = 7;
/** Số thẻ mới tối đa mỗi ngày. */
export const NEW_PER_DAY = 15;

export function allCards(): Card[] {
  const out: Card[] = TRIGRAM_KEYS.map((_, i) => ({ id: `trigram:${i}`, deck: 'trigram' as const, n: i }));
  for (const deck of DECKS) {
    if (deck === 'trigram') continue;
    const count = deck === 'line' ? 384 : 64;
    for (let n = 1; n <= count; n++) out.push({ id: `${deck}:${n}`, deck, n });
  }
  return out;
}

/** Thẻ hào: số hào 1..384 ↔ (quẻ, vị trí). */
export const lineOf = (n: number) => ({ hexagram: Math.ceil(n / 6), position: ((n - 1) % 6) + 1 });
export const lineCardNumber = (hexagram: number, position: number) => (hexagram - 1) * 6 + position;

/** Thứ tự học thẻ mới: theo số quẻ (hào tính theo quẻ của nó). */
const orderKey = (c: Card) => (c.deck === 'line' ? lineOf(c.n).hexagram : c.n);

/** Quẻ cặp: quẻ lộn ngược; tám quẻ lộn ngược vẫn y nguyên thì cặp với quẻ đổi hết hào. */
export function pairOf(n: number): number {
  const r = reversedHexagram(n);
  return r === n ? oppositeHexagram(n) : r;
}

export type Review = Omit<StudyState, 'id' | 'profileId' | 'cardId'>;

/** Lịch ôn: đúng thì giãn dần 1 → 3 → ×ease ngày; sai thì học lại sau 10 phút. */
export function review(prev: Review | undefined, correct: boolean, now: number): Review {
  const base: Review = prev ?? { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, firstSeen: now, lastReviewed: now };
  if (!correct) {
    return {
      ...base,
      reps: 0,
      lapses: prev ? base.lapses + 1 : 0,
      ease: Math.max(1.3, base.ease - 0.2),
      interval: 0,
      due: now + RELEARN_MS,
      lastReviewed: now,
    };
  }
  const reps = base.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(Math.max(base.interval, 1) * base.ease);
  return { ...base, reps, interval, ease: Math.min(3, base.ease + 0.05), due: now + interval * DAY, lastReviewed: now };
}

export const isMastered = (s: Pick<StudyState, 'interval'> | undefined) => !!s && s.interval >= MASTERED_DAYS;

const startOfDay = (now: number) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Số thẻ mới đã học hôm nay. */
export function newToday(states: Iterable<Pick<StudyState, 'firstSeen'>>, now: number): number {
  const from = startOfDay(now);
  let k = 0;
  for (const s of states) if (s.firstSeen >= from) k++;
  return k;
}

/**
 * Thẻ tiếp theo trong các bộ đang chọn: thẻ đến hạn sớm nhất trước, rồi thẻ mới
 * theo thứ tự tự nhiên (quái 1..8, quẻ 1..64) nếu chưa quá hạn mức mỗi ngày.
 */
export function pickNext(
  cards: Card[],
  states: Map<string, Pick<StudyState, 'due' | 'firstSeen'>>,
  decks: ReadonlySet<DeckKey>,
  now: number,
  newLimit = NEW_PER_DAY,
): Card | null {
  const pool = cards.filter((c) => decks.has(c.deck));
  let due: Card | null = null;
  let dueAt = Infinity;
  for (const c of pool) {
    const s = states.get(c.id);
    if (s && s.due <= now && s.due < dueAt) {
      due = c;
      dueAt = s.due;
    }
  }
  if (due) return due;
  if (newToday(states.values(), now) >= newLimit) return null;
  // Xen kẽ các bộ để một buổi không chỉ toàn một kiểu hỏi.
  const fresh = pool.filter((c) => !states.has(c.id));
  if (!fresh.length) return null;
  const minKey = Math.min(...fresh.map(orderKey));
  return fresh.find((c) => orderKey(c) === minKey)!;
}

/** Lần ôn gần nhất sắp tới (để báo "quay lại lúc…"). */
export function nextDue(states: Iterable<Pick<StudyState, 'due'>>, now: number): number | null {
  let best: number | null = null;
  for (const s of states) if (s.due > now && (best === null || s.due < best)) best = s.due;
  return best;
}

// ---- Xáo có hạt giống ----

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rnd = mulberry32(hash(seed));
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Bốn lựa chọn (gồm đáp án) cho thẻ trắc nghiệm. Với quẻ: số quẻ; với quái: chỉ
 * số quái. Đáp án nhiễu ưu tiên quẻ dễ nhầm (chung một quái với đáp án).
 */
export function choices(card: Card, seed: string): number[] {
  if (card.deck === 'trigram') {
    const others = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== card.n), seed).slice(0, 3);
    return seededShuffle([card.n, ...others], seed + '/o');
  }
  if (card.deck === 'line') return lineChoices(card.n, seed);
  const answer = answerOf(card);
  const { lower, upper } = trigramsOf(answer);
  const all = Array.from({ length: 64 }, (_, i) => i + 1).filter((m) => m !== answer && m !== card.n);
  const near = all.filter((m) => {
    const t = trigramsOf(m);
    return t.lower === lower || t.upper === upper;
  });
  const far = all.filter((m) => !near.includes(m));
  const picked = [...seededShuffle(near, seed).slice(0, 2), ...seededShuffle(far, seed + '/f')].slice(0, 3);
  return seededShuffle([answer, ...picked], seed + '/o');
}

/**
 * Lựa chọn cho thẻ hào: một hào khác của cùng quẻ, một hào cùng vị trí ở quẻ
 * chung quái, và một hào bất kỳ — để phải nhớ cả quẻ lẫn vị trí.
 */
function lineChoices(n: number, seed: string): number[] {
  const { hexagram, position } = lineOf(n);
  const sameHex = seededShuffle([1, 2, 3, 4, 5, 6].filter((p) => p !== position), seed + '/h').map((p) => lineCardNumber(hexagram, p));
  const { lower, upper } = trigramsOf(hexagram);
  const near = Array.from({ length: 64 }, (_, i) => i + 1).filter((m) => {
    if (m === hexagram) return false;
    const t = trigramsOf(m);
    return t.lower === lower || t.upper === upper;
  });
  const samePos = seededShuffle(near, seed + '/p').map((m) => lineCardNumber(m, position));
  const any = seededShuffle(Array.from({ length: 384 }, (_, i) => i + 1), seed + '/a');
  const picked: number[] = [];
  for (const x of [sameHex[0], samePos[0], ...any]) {
    if (picked.length === 3) break;
    if (x !== n && !picked.includes(x)) picked.push(x);
  }
  return seededShuffle([n, ...picked], seed + '/o');
}

/** Đáp án của thẻ trắc nghiệm (số quẻ hoặc chỉ số quái). Bộ "build" dùng answerTrigrams. */
export function answerOf(card: Card): number {
  return card.deck === 'pair' ? pairOf(card.n) : card.n;
}

export function answerTrigrams(n: number): { upper: TrigramKey; lower: TrigramKey } {
  return trigramsOf(n);
}
