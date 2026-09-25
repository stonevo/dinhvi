import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  DAY, MASTERED_DAYS, NEW_PER_DAY, RELEARN_MS, allCards, answerOf, choices, isMastered, nextDue, pairOf, pickNext,
  review, seededShuffle, type DeckKey,
} from '../src/lib/study';
import { ORDER_VERSE } from '../src/data/verses';
import { CANONICAL_NAMES } from '../src/data/names';
import { DinhViDB, clearProfileData, ensureSeeded } from '../src/db/db';
import { exportAll, exportProfile, importAll, parseBackup, serializeBackup } from '../src/db/backup';

const NOW = new Date('2026-09-26T09:00:00').getTime();

describe('bộ thẻ', () => {
  it('8 quái + 64 quẻ × 5 kiểu, id không trùng', () => {
    const cards = allCards();
    expect(cards).toHaveLength(8 + 64 * 5);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  it('quẻ cặp: lộn ngược, hoặc đổi hết hào khi lộn ngược vẫn y nguyên; đối xứng', () => {
    expect(pairOf(3)).toBe(4); // Truân ↔ Mông
    expect(pairOf(1)).toBe(2); // Càn ↔ Khôn
    expect(pairOf(29)).toBe(30); // Khảm ↔ Ly
    for (let n = 1; n <= 64; n++) {
      expect(pairOf(n)).not.toBe(n);
      expect(pairOf(pairOf(n))).toBe(n);
    }
  });

  it('bốn lựa chọn khác nhau, có đáp án, cùng hạt giống thì cùng thứ tự', () => {
    for (const c of allCards().filter((c) => c.deck !== 'build')) {
      const o = choices(c, `${c.id}#0`);
      expect(o).toHaveLength(4);
      expect(new Set(o).size).toBe(4);
      expect(o).toContain(answerOf(c));
      expect(choices(c, `${c.id}#0`)).toEqual(o);
    }
  });

  it('xáo có hạt giống là một hoán vị, không dùng nguồn ngẫu nhiên', () => {
    const a = seededShuffle([1, 2, 3, 4, 5], 'x');
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(seededShuffle([1, 2, 3, 4, 5], 'x')).toEqual(a);
  });

  it('bài ca thứ tự nêu đủ 64 tên quẻ, đúng thứ tự', () => {
    const joined = ORDER_VERSE.map((v) => v.hanViet).join(' ');
    let at = -1;
    for (const [hv] of CANONICAL_NAMES) {
      const next = joined.indexOf(hv, at + 1);
      expect(next, hv).toBeGreaterThan(at);
      at = next;
    }
    expect(ORDER_VERSE[0].from).toBe(1);
  });
});

describe('lịch ôn', () => {
  it('đúng: 1 → 3 → giãn theo ease; sai: học lại sau 10 phút', () => {
    const a = review(undefined, true, NOW);
    expect(a.interval).toBe(1);
    expect(a.due).toBe(NOW + DAY);
    const b = review(a, true, a.due);
    expect(b.interval).toBe(3);
    const c = review(b, true, b.due);
    expect(c.interval).toBeGreaterThanOrEqual(7);
    expect(isMastered(c)).toBe(c.interval >= MASTERED_DAYS);
    const d = review(c, false, c.due);
    expect(d.interval).toBe(0);
    expect(d.reps).toBe(0);
    expect(d.lapses).toBe(1);
    expect(d.due).toBe(c.due + RELEARN_MS);
    expect(d.firstSeen).toBe(NOW);
  });

  it('chọn thẻ đến hạn trước, rồi thẻ mới; dừng thẻ mới khi đủ hạn mức', () => {
    const cards = allCards();
    const decks = new Set<DeckKey>(['name', 'keyword']);
    const states = new Map();
    expect(pickNext(cards, states, decks, NOW)?.id).toBe('name:1');
    states.set('keyword:5', { due: NOW - 1, firstSeen: NOW - 5 * DAY });
    expect(pickNext(cards, states, decks, NOW)?.id).toBe('keyword:5');
    states.set('keyword:5', { due: NOW + DAY, firstSeen: NOW - 5 * DAY });
    for (let i = 1; i <= NEW_PER_DAY; i++) states.set(`name:${i + 10}`, { due: NOW + DAY, firstSeen: NOW });
    expect(pickNext(cards, states, decks, NOW)).toBeNull();
    expect(nextDue(states.values(), NOW)).toBe(NOW + DAY);
  });
});

describe('tiến độ học trong cơ sở dữ liệu và sao lưu', () => {
  it('xuất / nhập giữ tiến độ; xoá hồ sơ xoá tiến độ', async () => {
    const db = new DinhViDB('study-test');
    await ensureSeeded(db);
    const r = review(undefined, true, NOW);
    await db.study.put({ id: 'me|name:1', profileId: 'me', cardId: 'name:1', ...r });
    const all = parseBackup(serializeBackup(await exportAll(db)));
    expect(all.study).toHaveLength(1);
    expect((await exportProfile(db, 'me')).study).toHaveLength(1);
    await db.study.clear();
    await importAll(db, all);
    expect(await db.study.get('me|name:1')).toBeDefined();
    await clearProfileData(db, 'me');
    expect(await db.study.count()).toBe(0);
    await db.delete();
  });
});
