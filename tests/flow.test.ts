import { describe, expect, it } from 'vitest';
import {
  IncompleteDraftError, applyPatch, derivedHexagram, finalizeDraft, furthestAllowedStep,
  sentences, signalCount, stepComplete, witnessDiffers, type DraftData,
} from '../src/flow/draft';

const meta = { id: 'x', domainId: 'd1', period: '2026-Q3', createdAt: '2026-09-23T00:00:00.000Z' };

/** Nháp đã đi hết 8 bước: Khảm (trong) + Cấn (ngoài) = Mông (4), hào 1. */
function complete(): DraftData {
  return {
    facts: ['a', 'b', 'c'],
    innerTrigram: 'kan', innerEvidence: 'e1', outerTrigram: 'gen', outerEvidence: 'e2',
    sequenceCheck: 'fits',
    tier: 'earth', tierEvidence: 'te', line: 1,
    tierChecklistAnswers: { 'l1-q1': true },
    signalsByLine: { 1: [2, 0], 2: [1] },
    painType: 'specific', painfulSentence: 'câu đau',
    criticHexagram: 3, criticLine: 2, criticComparison: 'cc',
    witnessSkipped: true,
    confidence: 3, willNotDo: 'không ký hợp đồng mới',
  };
}

describe('quẻ chỉ suy ra từ hai quái', () => {
  it('Khảm trong + Cấn ngoài = Mông', () => expect(derivedHexagram(complete())).toBe(4));
  it('thiếu quái thì chưa có quẻ', () => expect(derivedHexagram({ innerTrigram: 'kan' })).toBeNull());
});

describe('điều kiện qua bước', () => {
  it('bước 1 cần đủ 3 câu không rỗng', () => {
    expect(stepComplete(1, { facts: ['a', 'b', ' '] })).toBe(false);
    expect(stepComplete(1, { facts: ['a', 'b', 'c'] })).toBe(true);
  });
  it('bước 2 cần bằng chứng cho cả hai quái', () => {
    expect(stepComplete(2, { innerTrigram: 'kan', outerTrigram: 'gen', innerEvidence: 'x' })).toBe(false);
  });
  it('bước 4: hào phải thuộc tầng đã chọn', () => {
    expect(stepComplete(4, { tier: 'earth', line: 5, tierEvidence: 'x' })).toBe(false);
  });
  it('bước 5: khó chịu cụ thể/mơ hồ cần chép câu; "không có gì" thì không', () => {
    expect(stepComplete(5, { painType: 'specific' })).toBe(false);
    expect(stepComplete(5, { painType: 'none' })).toBe(true);
  });
  it('bước 6 không có mặc định: phải tự chọn quẻ và hào người phê bình', () => {
    expect(stepComplete(6, { criticComparison: 'x' })).toBe(false);
  });
  it('bước 7: bỏ qua rõ ràng, hoặc có người và giai đoạn', () => {
    expect(stepComplete(7, {})).toBe(false);
    expect(stepComplete(7, { witnessSkipped: true })).toBe(true);
    expect(stepComplete(7, { witness: { who: 'An', theirStage: 'rising', theirLineGuess: null, note: '', askedAt: 'x' } })).toBe(true);
  });
  it('bước 8 bắt buộc willNotDo', () => {
    expect(stepComplete(8, { ...complete(), willNotDo: ' ' })).toBe(false);
  });
});

describe('không nhảy bước', () => {
  it('bước xa nhất = bước đầu tiên chưa xong', () => {
    expect(furthestAllowedStep({})).toBe(1);
    const d = complete();
    delete d.criticComparison;
    expect(furthestAllowedStep(d)).toBe(6);
    expect(furthestAllowedStep(complete())).toBe(8);
  });
});

describe('đổi quái xoá phần phụ thuộc', () => {
  it('đổi quẻ → xoá Tự quái, dấu hiệu, phép thử đau, kết luận', () => {
    const d = { ...complete(), finalHexagram: 3, finalLine: 2 };
    const next = applyPatch(d, { outerTrigram: 'kan' });
    expect(derivedHexagram(next)).toBe(29);
    expect(next.sequenceCheck).toBeUndefined();
    expect(next.signalsByLine).toBeUndefined();
    expect(next.painType).toBeUndefined();
    expect(next.finalHexagram).toBeUndefined();
    expect(next.facts).toEqual(['a', 'b', 'c']);
    expect(next.criticHexagram).toBe(3); // người phê bình độc lập với quẻ của mình
  });
  it('sửa bằng chứng mà quẻ không đổi → giữ nguyên', () => {
    const next = applyPatch(complete(), { innerEvidence: 'khác' });
    expect(next.sequenceCheck).toBe('fits');
    expect(next.painType).toBe('specific');
  });
  it('đổi tầng → bỏ hào không thuộc tầng mới', () => {
    const next = applyPatch(complete(), { tier: 'heaven' });
    expect(next.line).toBeUndefined();
    expect(next.painType).toBeUndefined();
  });
});

describe('chốt bản ghi', () => {
  it('mặc định kết luận = quẻ bước 2, hào bước 4; changedAfterTests = false', () => {
    const p = finalizeDraft(complete(), meta);
    expect(p).toMatchObject({ hexagram: 4, line: 1, finalHexagram: 4, finalLine: 1, changedAfterTests: false });
    expect(p.behavioralSignalsMatched).toEqual([0, 2]); // chỉ của hào đã chọn, sắp xếp
    expect(p.witness).toBeNull();
    expect(p.hindsight).toBeNull();
  });
  it('đổi quẻ sau phép thử → changedAfterTests = true', () => {
    const p = finalizeDraft({ ...complete(), finalHexagram: 3, finalLine: 2 }, meta);
    expect(p.changedAfterTests).toBe(true);
  });
  it('chỉ đổi hào cũng tính là đổi', () => {
    expect(finalizeDraft({ ...complete(), finalLine: 2 }, meta).changedAfterTests).toBe(true);
  });
  it('từ chối nháp chưa xong', () => {
    const d = complete();
    delete d.willNotDo;
    expect(() => finalizeDraft(d, meta)).toThrow(IncompleteDraftError);
  });
});

describe('tiện ích hiển thị', () => {
  it('đếm dấu hiệu đã đánh dấu', () => {
    expect(signalCount(complete(), 1, 4)).toEqual({ marked: 2, total: 4 });
    expect(signalCount({}, 2, 4)).toEqual({ marked: 0, total: 4 });
  });
  it('nhân chứng lệch', () => {
    const w = (o: object) => ({ who: 'A', theirStage: 'unknown' as const, theirLineGuess: null, note: '', askedAt: 'x', ...o });
    expect(witnessDiffers(w({ theirLineGuess: 3 }), 5)).toBe(true);
    expect(witnessDiffers(w({ theirStage: 'rising' }), 3)).toBe(false);
    expect(witnessDiffers(w({ theirStage: 'beginning' }), 3)).toBe(true);
    expect(witnessDiffers(w({}), 3)).toBe(false);
    expect(witnessDiffers(null, 3)).toBe(false);
  });
  it('tách câu', () => {
    expect(sentences('Một. Hai? Ba… Bốn')).toEqual(['Một.', 'Hai?', 'Ba…', 'Bốn']);
  });
});
