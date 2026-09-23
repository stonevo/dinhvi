import { hindsightSchema, positioningSchema, type Hindsight, type Positioning } from '../types/schema';
import { canStartPositioning } from '../lib/status';
import { draftId } from '../flow/draft';
import type { DinhViDB } from './db';

export class PositioningRuleError extends Error {}

/**
 * Lưu bản ghi mới và xoá nháp, trong một transaction. Luật "không định vị kỳ
 * mới khi kỳ trước chưa nhìn lại" được kiểm cả ở đây, không chỉ ở UI.
 */
export async function savePositioning(db: DinhViDB, p: Positioning): Promise<void> {
  const valid = positioningSchema.parse(p);
  await db.transaction('rw', db.positionings, db.drafts, async () => {
    const existing = await db.positionings.where('domainId').equals(valid.domainId).toArray();
    if (!canStartPositioning(valid.domainId, valid.period, existing))
      throw new PositioningRuleError('Kỳ trước chưa được nhìn lại, hoặc kỳ này đã có bản ghi.');
    await db.positionings.add(valid);
    await db.drafts.delete(draftId(valid.domainId, valid.period));
  });
}

export async function saveHindsight(db: DinhViDB, positioningId: string, h: Hindsight): Promise<void> {
  const valid = hindsightSchema.parse(h);
  const n = await db.positionings.update(positioningId, { hindsight: valid });
  if (n === 0) throw new PositioningRuleError(`Không có bản ghi ${positioningId}`);
}
