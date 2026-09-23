import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DinhViDB } from '../src/db/db';
import { PositioningRuleError, saveHindsight, savePositioning } from '../src/db/positionings';
import { draftId } from '../src/flow/draft';
import { makePositioning } from './fixtures';

let n = 0;
let db: DinhViDB;
beforeEach(async () => {
  db = new DinhViDB(`pos-${n++}`);
  await db.open();
});
afterEach(() => db.delete());

const hs = {
  reviewedAt: '2026-07-01T00:00:00.000Z', actualHexagram: 4, actualLine: 2,
  selfWasRight: 'partly' as const, whatHappened: 'x', willNotDoKept: 'yes' as const, notes: '',
};

describe('lưu bản ghi', () => {
  it('lưu và xoá nháp cùng kỳ', async () => {
    await db.drafts.put({ id: draftId('d1', '2026-Q2'), domainId: 'd1', period: '2026-Q2', step: 8, data: {}, updatedAt: 'x' });
    await savePositioning(db, makePositioning({ period: '2026-Q2' }));
    expect(await db.positionings.count()).toBe(1);
    expect(await db.drafts.count()).toBe(0);
  });

  it('chặn kỳ mới khi kỳ trước chưa nhìn lại', async () => {
    await savePositioning(db, makePositioning({ id: 'a', period: '2026-Q2' }));
    await expect(savePositioning(db, makePositioning({ id: 'b', period: '2026-Q3' }))).rejects.toThrow(PositioningRuleError);
    expect(await db.positionings.count()).toBe(1);
  });

  it('cho phép sau khi đã nhìn lại', async () => {
    await savePositioning(db, makePositioning({ id: 'a', period: '2026-Q2' }));
    await saveHindsight(db, 'a', hs);
    await savePositioning(db, makePositioning({ id: 'b', period: '2026-Q3' }));
    expect(await db.positionings.count()).toBe(2);
  });

  it('chặn bản ghi thứ hai cùng kỳ', async () => {
    await savePositioning(db, makePositioning({ id: 'a', period: '2026-Q2' }));
    await expect(savePositioning(db, makePositioning({ id: 'b', period: '2026-Q2' }))).rejects.toThrow(PositioningRuleError);
  });

  it('lĩnh vực khác không bị chặn', async () => {
    await savePositioning(db, makePositioning({ id: 'a', period: '2026-Q2' }));
    await savePositioning(db, makePositioning({ id: 'b', domainId: 'd2', period: '2026-Q3' }));
    expect(await db.positionings.count()).toBe(2);
  });

  it('từ chối bản ghi sai schema', async () => {
    await expect(savePositioning(db, makePositioning({ willNotDo: '' }))).rejects.toThrow();
  });

  it('nhìn lại cho bản ghi không tồn tại', async () => {
    await expect(saveHindsight(db, 'không-có', hs)).rejects.toThrow(PositioningRuleError);
  });
});
