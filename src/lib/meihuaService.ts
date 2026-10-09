// Điểm gọi chung của Mai Hoa cho giao diện: một hàm nhận cách lấy quẻ + thời điểm, trả về
// phép tính, phân tích Thể – Dụng và kết luận. Thuần: thời điểm do người gọi đưa vào
// (dùng lại lunar.ts — giờ Việt Nam UTC+7, quy ước giờ Tý theo `ziStartsNextDay`).
import { canChiName, vnParts, type VnParts } from './lunar';
import {
  analyze, byCount, byManual, byNumber, byObject, byNumberString, byNumbers, byText, byTime, monthElementOfBranch, verdict,
  type ByTextOptions, type MeihuaAnalysis, type MeihuaCast, type MeihuaVerdict, type MovingLine,
} from './meihua';
import { hexagramBinary, hexagramFromTrigrams } from './iching';
import type { CastRecord, MeihuaRecord, TrigramKey } from '../types/schema';

export type MeihuaInput =
  /** Niên nguyệt nhật thời: chi năm âm + tháng âm + ngày âm + chi giờ của thời điểm `at`. */
  | { method: 'time' }
  /** Hai số (quái trên, quái dưới); `withHour`: cộng chi giờ khi lấy hào động. */
  | { method: 'numbers'; a: number; b: number; withHour?: boolean }
  /** Một số nghe / thấy (聲音占): trên = số, dưới = số + giờ, hào = số + giờ. */
  | { method: 'number'; n: number }
  /** Vật đếm được (物數占): trên = số, dưới = chi giờ, hào = số + giờ. */
  | { method: 'count'; n: number }
  /** Hậu thiên: quái của vật (trên) + quái của phương (dưới), hào = số Tiên thiên hai quái + giờ. */
  | { method: 'object'; object: TrigramKey; direction: TrigramKey }
  /** Một dãy chữ số (vd. số điện thoại): chia đôi. */
  | { method: 'number-string'; s: string; withHour?: boolean }
  /** Chữ: Hán đếm nét (cần `strokes`), Quốc ngữ đếm chữ cái (chuyển thể, xem QUOCNGU_NOTE). */
  | { method: 'text'; text: string; strokes?: ByTextOptions['strokes']; singleCharLeftRight?: [number, number]; withHour?: boolean }
  /** Nhập tay. */
  | { method: 'manual'; upper: TrigramKey; lower: TrigramKey; movingLine: MovingLine };

export interface MeihuaResult {
  cast: MeihuaCast;
  analysis: MeihuaAnalysis;
  verdict: MeihuaVerdict;
  /** Thời điểm và lịch Việt Nam đã dùng (để hiển thị, lưu lại). */
  at: string;
  calendar: { lunar: VnParts['lunar']; yearCanChi: string; monthCanChi: string; dayCanChi: string; hourCanChi: string; solarTerm: string };
  /** Mô tả ngắn đầu vào gốc, để lưu vào lịch sử (`methodInput`). */
  inputLabel: string;
}

/** Lập quẻ Mai Hoa và phân tích. Ném RangeError / Error khi đầu vào không hợp lệ (thông điệp tiếng Việt). */
export function castMeihua(input: MeihuaInput, at: Date, opts: { ziStartsNextDay?: boolean } = {}): MeihuaResult {
  const p = vnParts(at, { ziStartsNextDay: opts.ziStartsNextDay ?? true });
  const hour = p.hourBranchNumber;
  let cast: MeihuaCast;
  let inputLabel: string;
  switch (input.method) {
    case 'time':
      cast = byTime({ yearBranchNumber: p.yearBranchNumber, lunarMonth: p.lunar.month, lunarDay: p.lunar.day, hourBranchNumber: hour });
      inputLabel = `${canChiName(p.yearCanChi)} ${p.lunar.day}/${p.lunar.month} ${canChiName(p.hourCanChi)}`;
      break;
    case 'numbers':
      cast = byNumbers(input.a, input.b, input.withHour ? hour : undefined);
      inputLabel = `${input.a} · ${input.b}`;
      break;
    case 'number':
      cast = byNumber(input.n, hour);
      inputLabel = String(input.n);
      break;
    case 'count':
      cast = byCount(input.n, hour);
      inputLabel = String(input.n);
      break;
    case 'object':
      cast = byObject(input.object, input.direction, hour);
      inputLabel = `${input.object}@${input.direction}`;
      break;
    case 'number-string':
      cast = byNumberString(input.s, input.withHour ? hour : undefined);
      inputLabel = input.s;
      break;
    case 'text':
      cast = byText(input.text, { strokes: input.strokes, singleCharLeftRight: input.singleCharLeftRight, hourBranchNumber: input.withHour ? hour : undefined });
      inputLabel = input.text;
      break;
    case 'manual':
      cast = byManual(input.upper, input.lower, input.movingLine);
      inputLabel = `${input.upper}/${input.lower}/${input.movingLine}`;
      break;
  }
  const analysis = analyze(cast, { monthElement: monthElementOfBranch(p.monthCanChi.branch) });
  return {
    cast,
    analysis,
    verdict: verdict(analysis),
    at: at.toISOString(),
    calendar: {
      lunar: p.lunar,
      yearCanChi: canChiName(p.yearCanChi),
      monthCanChi: canChiName(p.monthCanChi),
      dayCanChi: canChiName(p.dayCanChi),
      hourCanChi: canChiName(p.hourCanChi),
      solarTerm: p.solarTerm.name,
    },
    inputLabel,
  };
}

type LineValue = 6 | 7 | 8 | 9;

/** Sáu giá trị hào từ một quẻ Mai Hoa: hào động là lão (6/9), còn lại thiếu (7/8). */
export function linesOfMeihua(c: Pick<MeihuaCast, 'upper' | 'lower' | 'movingLine'>): LineValue[] {
  const bin = hexagramBinary(hexagramFromTrigrams(c.lower, c.upper));
  return [...bin].map((b, i) => {
    const moving = i + 1 === c.movingLine;
    if (b === '1') return moving ? 9 : 7;
    return moving ? 6 : 8;
  });
}

/** Nhóm thô lưu ở `CastRecord.method` (giữ enum cũ để bản ghi đọc được ở mọi phiên bản app). */
export function recordMethodOf(m: MeihuaInput['method']): 'meihua-time' | 'meihua-number' | 'meihua-text' {
  if (m === 'time') return 'meihua-time';
  if (m === 'text') return 'meihua-text';
  return 'meihua-number';
}

/** Các trường của bản ghi lịch sử cho một lần gieo Mai Hoa (phần còn lại — id, câu hỏi… — do người gọi điền). */
export function meihuaRecordFields(
  r: MeihuaResult,
  input: MeihuaInput,
  opts: { ziStartsNextDay?: boolean } = {},
): Pick<CastRecord, 'createdAt' | 'lines' | 'primary' | 'moving' | 'transformed' | 'method' | 'methodInput' | 'meihua'> {
  const meihua: MeihuaRecord = {
    method: input.method,
    upper: r.cast.upper,
    lower: r.cast.lower,
    movingLine: r.cast.movingLine,
    the: r.analysis.the.trigram,
    mutual: r.analysis.mutual,
    mutualOf: r.analysis.mutualOf,
    verdict: { level: r.verdict.level, score: r.verdict.score, codes: r.verdict.factors.map((f) => f.code) },
    ziStartsNextDay: opts.ziStartsNextDay ?? true,
  };
  return {
    createdAt: r.at,
    lines: linesOfMeihua(r.cast),
    primary: r.analysis.primary,
    moving: [r.cast.movingLine],
    transformed: r.analysis.transformed,
    method: recordMethodOf(input.method),
    methodInput: r.inputLabel,
    meihua,
  };
}
