import {
  positioningSchema, type LinePosition, type Positioning, type Tier, type TrigramKey, type Witness,
} from '../types/schema';
import { distanceToStage, hexagramFromTrigrams, linesOfTier } from '../lib/iching';

// Logic thuần của luồng 8 bước: dữ liệu nháp, điều kiện qua bước, chốt bản ghi.
// Không có hàm nào ở đây chọn quẻ/hào thay người dùng — chỉ tính quẻ từ hai
// quái người dùng chọn, và đếm dấu hiệu người dùng tự đánh dấu.

export type DraftData = {
  facts?: string[];
  innerTrigram?: TrigramKey;
  innerEvidence?: string;
  outerTrigram?: TrigramKey;
  outerEvidence?: string;
  sequenceCheck?: Positioning['sequenceCheck'];
  sequenceNote?: string;
  tier?: Tier;
  tierEvidence?: string;
  line?: LinePosition;
  tierChecklistAnswers?: Record<string, boolean>;
  /** Dấu hiệu hành vi đã đánh dấu, theo từng hào ứng viên của tầng. */
  signalsByLine?: Partial<Record<LinePosition, number[]>>;
  painfulSentence?: string;
  painType?: Positioning['painType'];
  reflectionAnswers?: string[];
  criticHexagram?: number | null;
  criticLine?: number | null;
  criticComparison?: string;
  witnessSkipped?: boolean;
  witness?: Witness | null;
  finalHexagram?: number;
  finalLine?: number;
  confidence?: Positioning['confidence'];
  willNotDo?: string;
  notes?: string;
};

export const STEP_COUNT = 8;

/** Quẻ suy ra từ hai quái — không có đường nào khác để đặt quẻ ở bước 2. */
export function derivedHexagram(d: DraftData): number | null {
  return d.innerTrigram && d.outerTrigram ? hexagramFromTrigrams(d.innerTrigram, d.outerTrigram) : null;
}

const filled = (s: string | undefined) => !!s && s.trim().length > 0;

/** Điều kiện để rời bước `step` (1..8) đi tiếp. */
export function stepComplete(step: number, d: DraftData): boolean {
  switch (step) {
    case 1:
      return (d.facts ?? []).filter(filled).length === 3;
    case 2:
      return !!d.innerTrigram && !!d.outerTrigram && filled(d.innerEvidence) && filled(d.outerEvidence);
    case 3:
      return !!d.sequenceCheck;
    case 4:
      return !!d.tier && !!d.line && linesOfTier(d.tier).includes(d.line) && filled(d.tierEvidence);
    case 5:
      return !!d.painType && (d.painType === 'none' || filled(d.painfulSentence));
    case 6:
      return !!d.criticHexagram && !!d.criticLine && filled(d.criticComparison);
    case 7:
      return !!d.witnessSkipped || (!!d.witness && filled(d.witness.who) && !!d.witness.theirStage);
    case 8:
      return !!finalHexagramOf(d) && !!finalLineOf(d) && !!d.confidence && filled(d.willNotDo);
    default:
      return false;
  }
}

/** Bước xa nhất được phép mở: không nhảy qua bước chưa xong. */
export function furthestAllowedStep(d: DraftData): number {
  let s = 1;
  while (s < STEP_COUNT && stepComplete(s, d)) s++;
  return s;
}

export const finalHexagramOf = (d: DraftData) => d.finalHexagram ?? derivedHexagram(d) ?? undefined;
export const finalLineOf = (d: DraftData) => d.finalLine ?? d.line;

/**
 * Áp một thay đổi, và xoá những gì phụ thuộc vào phần vừa đổi — đọc lời hào
 * của quẻ cũ không còn giá trị khi quẻ đã khác.
 */
export function applyPatch(d: DraftData, patch: Partial<DraftData>): DraftData {
  const next: DraftData = { ...d, ...patch };
  const hexChanged = derivedHexagram(next) !== derivedHexagram(d);
  if (hexChanged) {
    delete next.sequenceCheck;
    delete next.sequenceNote;
    delete next.signalsByLine;
  }
  if (next.tier !== d.tier && next.line && next.tier && !linesOfTier(next.tier).includes(next.line)) {
    delete next.line;
  }
  if (hexChanged || next.line !== d.line) {
    delete next.painfulSentence;
    delete next.painType;
    delete next.reflectionAnswers;
    delete next.finalHexagram;
    delete next.finalLine;
  }
  return next;
}

/** Số dấu hiệu người dùng tự đánh dấu cho một hào — chỉ để hiển thị. */
export function signalCount(d: DraftData, line: LinePosition, total: number): { marked: number; total: number } {
  return { marked: (d.signalsByLine?.[line] ?? []).filter((i) => i < total).length, total };
}

/**
 * Nhân chứng có lệch với mình không (theo hào). Nếu họ đoán hào thì so trực
 * tiếp; không thì xem hào của mình có nằm trong giai đoạn họ nêu.
 */
export function witnessDiffers(w: Witness | null | undefined, line: number | undefined): boolean {
  if (!w || !line) return false;
  if (w.theirLineGuess !== null) return w.theirLineGuess !== line;
  if (w.theirStage === 'unknown') return false;
  return distanceToStage(line, w.theirStage) > 0;
}

/** Tách đoạn văn thành câu để người dùng bấm chọn câu làm mình khó chịu. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export class IncompleteDraftError extends Error {}

/** Chốt nháp thành bản ghi hoàn chỉnh. Ném lỗi nếu còn bước chưa xong. */
export function finalizeDraft(
  d: DraftData,
  meta: { id: string; domainId: string; period: string; createdAt: string },
): Positioning {
  for (let s = 1; s <= STEP_COUNT; s++)
    if (!stepComplete(s, d)) throw new IncompleteDraftError(`Bước ${s} chưa xong`);
  const hexagram = derivedHexagram(d)!;
  const line = d.line!;
  const finalHexagram = finalHexagramOf(d)!;
  const finalLine = finalLineOf(d)!;
  return positioningSchema.parse({
    ...meta,
    facts: d.facts!.map((f) => f.trim()),
    innerTrigram: d.innerTrigram,
    innerEvidence: d.innerEvidence!.trim(),
    outerTrigram: d.outerTrigram,
    outerEvidence: d.outerEvidence!.trim(),
    hexagram,
    sequenceCheck: d.sequenceCheck,
    sequenceNote: d.sequenceNote?.trim() ?? '',
    tier: d.tier,
    tierEvidence: d.tierEvidence!.trim(),
    line,
    tierChecklistAnswers: d.tierChecklistAnswers ?? {},
    behavioralSignalsMatched: [...(d.signalsByLine?.[line] ?? [])].sort((a, b) => a - b),
    painfulSentence: d.painType === 'none' ? (d.painfulSentence ?? '').trim() : d.painfulSentence!.trim(),
    painType: d.painType,
    reflectionAnswers: d.reflectionAnswers ?? [],
    criticHexagram: d.criticHexagram ?? null,
    criticLine: d.criticLine ?? null,
    criticComparison: d.criticComparison!.trim(),
    witness: d.witnessSkipped ? null : d.witness,
    finalHexagram,
    finalLine,
    confidence: d.confidence,
    changedAfterTests: finalHexagram !== hexagram || finalLine !== line,
    willNotDo: d.willNotDo!.trim(),
    notes: d.notes?.trim() ?? '',
    hindsight: null,
  });
}

export const draftId = (domainId: string, period: string) => `${domainId}:${period}`;
