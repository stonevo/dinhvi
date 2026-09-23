import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DinhViDB, ensureSeeded } from '../src/db/db';
import { PositioningRuleError, saveHindsight, savePositioning } from '../src/db/positionings';
import { exportAll, importAll, parseBackup, serializeBackup } from '../src/db/backup';
import { finalizeDraft, applyPatch, type DraftData } from '../src/flow/draft';
import { calibrationReport } from '../src/lib/calibration';
import { domainStatus } from '../src/lib/status';
import { domainTrajectory, hasTrajectory } from '../src/lib/trajectory';
import type { Hexagram, TrigramKey } from '../src/types/schema';

// Tiêu chí chấp nhận (mục 10), đi trọn vòng lặp trên DB thật (fake-indexeddb):
// tạo lĩnh vực → định vị đủ 8 bước → lưu → kỳ sau bị yêu cầu nhìn lại → sau
// vài kỳ có quỹ đạo → sau 8 bản ghi có nhìn lại thì có trang hiệu chỉnh.

const hexagrams: Hexagram[] = JSON.parse(readFileSync(join(__dirname, '..', 'public', 'data', 'hexagrams.json'), 'utf8'));

let db: DinhViDB;
let n = 0;
beforeEach(async () => {
  db = new DinhViDB(`accept-${n++}`);
  await ensureSeeded(db);
});
afterEach(() => db.delete());

/** Mô phỏng người dùng đi qua 8 bước, mỗi bước một thay đổi như UI gửi xuống. */
function walk(inner: TrigramKey, outer: TrigramKey, line: 1 | 3 | 5, opts: { final?: [number, number]; confidence: 1 | 2 | 3 | 4 | 5 }): DraftData {
  const tier = line === 1 ? 'earth' : line === 3 ? 'human' : 'heaven';
  const steps: Partial<DraftData>[] = [
    { facts: ['Sự thật một.', 'Sự thật hai.', 'Sự thật ba.'] },
    { innerTrigram: inner, innerEvidence: 'bằng chứng trong' },
    { outerTrigram: outer, outerEvidence: 'bằng chứng ngoài' },
    { sequenceCheck: 'partly' },
    { tier, tierEvidence: 'vì sao' },
    { signalsByLine: { [line]: [0, 1] } },
    { line },
    { painfulSentence: 'một câu', painType: 'specific' },
    { criticHexagram: 29, criticLine: 3, criticComparison: 'so sánh' },
    { witness: { who: 'Đồng nghiệp', theirStage: 'rising', theirLineGuess: null, note: '', askedAt: 'x' } },
    { confidence: opts.confidence, willNotDo: 'Không ký thêm hợp đồng.' },
  ];
  if (opts.final) steps.push({ finalHexagram: opts.final[0], finalLine: opts.final[1] });
  return steps.reduce<DraftData>((d, p) => applyPatch(d, p), {});
}

describe('tiêu chí chấp nhận', () => {
  it('vòng lặp đầy đủ qua 9 kỳ', async () => {
    const [domain] = await db.domains.orderBy('createdAt').toArray();
    const periods = ['2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3'];

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      // Kỳ trước chưa nhìn lại → không định vị được.
      if (i > 0) {
        const all = await db.positionings.toArray();
        expect(domainStatus(domain.id, period, all, [])).toBe('needsReview');
        const tryEarly = finalizeDraft(walk('kan', 'gen', 1, { confidence: 3 }), { id: `early-${i}`, domainId: domain.id, period, createdAt: 'x' });
        await expect(savePositioning(db, tryEarly)).rejects.toThrow(PositioningRuleError);

        // Nhìn lại kỳ trước: thực tế thấp hơn một hào so với tự định vị.
        const prev = all.find((p) => p.period === periods[i - 1])!;
        await saveHindsight(db, prev.id, {
          reviewedAt: 'x', actualHexagram: prev.finalHexagram, actualLine: Math.max(1, prev.finalLine - 1),
          selfWasRight: prev.confidence >= 4 ? 'no' : 'yes', whatHappened: 'đã xảy ra', willNotDoKept: 'yes', notes: '',
        });
        expect(domainStatus(domain.id, period, await db.positionings.toArray(), [])).toBe('needsPositioning');
      }

      // Định vị: Khảm (trong) + Cấn (ngoài) = Mông (4). Kỳ lẻ đổi về quẻ người phê bình.
      const changed = i % 2 === 1;
      const d = walk('kan', 'gen', 3, { confidence: i % 2 ? 4 : 2, final: changed ? [29, 3] : undefined });
      const p = finalizeDraft(d, { id: `p-${i}`, domainId: domain.id, period, createdAt: `${period}-x` });
      expect(p.hexagram).toBe(4);
      expect(p.changedAfterTests).toBe(changed);
      await savePositioning(db, p);
      expect(domainStatus(domain.id, period, await db.positionings.toArray(), [])).toBe('done');
    }

    const all = await db.positionings.toArray();
    // Quỹ đạo có từ kỳ thứ 2.
    expect(hasTrajectory(all)).toBe(true);
    expect(domainTrajectory(all, domain.id).map((x) => x.period)).toEqual(periods);

    // 8 bản ghi đã nhìn lại → có trang hiệu chỉnh, số liệu đúng.
    const r = calibrationReport(all);
    expect(r.reviewedCount).toBe(8);
    expect(r.sufficient).toBe(true);
    expect(r.lineBias).toEqual({ mean: -1, n: 8 }); // luôn tự đặt cao hơn một hào
    expect(r.byConfidence[4]).toEqual({ k: 0, n: 4, rate: 0 });
    expect(r.byConfidence[2]).toEqual({ k: 4, n: 4, rate: 1 });
    expect(r.prettyBias.changed).toEqual({ k: 4, n: 8, rate: 0.5 });
    expect(r.prettyBias.towardCritic).toEqual({ k: 4, n: 4, rate: 1 });
    expect(r.willNotDo.yes.rate).toBe(1);

    // Sao lưu và khôi phục giữ nguyên toàn bộ.
    const text = serializeBackup(await exportAll(db, new Date(0)));
    const other = new DinhViDB(`accept-${n++}`);
    await importAll(other, parseBackup(text));
    expect(serializeBackup(await exportAll(other, new Date(0)))).toBe(text);
    await other.delete();
  });

  it('quẻ chỉ có thể đến từ hai quái: mọi cặp quái cho đúng quẻ trong dữ liệu', () => {
    for (const h of hexagrams) {
      const p = finalizeDraft(walk(h.lowerTrigram, h.upperTrigram, 1, { confidence: 3 }), { id: 'x', domainId: 'd', period: '2026-Q3', createdAt: 'x' });
      expect(p.hexagram).toBe(h.kingWenNumber);
    }
  });
});
