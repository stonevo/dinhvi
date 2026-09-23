import type { Domain, Positioning } from '../types/schema';
import { byPeriod } from './trajectory';

export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export const POSITIONING_CSV_HEADER = [
  'domain', 'period', 'hexagram', 'line', 'finalHexagram', 'finalLine', 'confidence',
  'changedAfterTests', 'painType', 'criticHexagram', 'criticLine', 'witnessStage', 'witnessLine',
  'willNotDo', 'actualHexagram', 'actualLine', 'selfWasRight', 'willNotDoKept',
];

/** Một dòng mỗi bản ghi. BOM đầu file để Excel đọc đúng tiếng Việt. */
export function positioningsToCsv(ps: Positioning[], domains: Domain[]): string {
  const name = new Map(domains.map((d) => [d.id, d.name]));
  const rows = byPeriod(ps).map((p) => [
    name.get(p.domainId) ?? p.domainId, p.period, p.hexagram, p.line, p.finalHexagram, p.finalLine,
    p.confidence, p.changedAfterTests, p.painType, p.criticHexagram, p.criticLine,
    p.witness?.theirStage, p.witness?.theirLineGuess, p.willNotDo,
    p.hindsight?.actualHexagram, p.hindsight?.actualLine, p.hindsight?.selfWasRight, p.hindsight?.willNotDoKept,
  ]);
  return '﻿' + toCsv(POSITIONING_CSV_HEADER, rows);
}
