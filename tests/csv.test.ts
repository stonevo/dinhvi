import { describe, expect, it } from 'vitest';
import { csvCell, positioningsToCsv, POSITIONING_CSV_HEADER } from '../src/lib/csv';
import { makePositioning } from './fixtures';

describe('csv', () => {
  it('escape dấu phẩy, ngoặc kép, xuống dòng', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('nói "không"')).toBe('"nói ""không"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(3)).toBe('3');
  });

  it('một dòng mỗi bản ghi, theo thứ tự kỳ, có BOM', () => {
    const csv = positioningsToCsv(
      [makePositioning({ id: 'b', period: '2026-Q3', willNotDo: 'Không ký, không hứa' }), makePositioning({ id: 'a', period: '2026-Q2' })],
      [{ id: 'd1', profileId: 'me', name: 'Công việc', createdAt: 'x', archived: false }],
    );
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe(POSITIONING_CSV_HEADER.join(','));
    expect(lines).toHaveLength(3);
    expect(lines[1].startsWith('Công việc,2026-Q2,')).toBe(true);
    expect(lines[2]).toContain('"Không ký, không hứa"');
  });
});
