import { useState } from 'react';
import { t } from '../i18n';
import type { Hindsight, Positioning } from '../types/schema';
import type { StaticData } from '../data/load';
import { db } from '../db/db';
import { saveHindsight } from '../db/positionings';
import { formatPeriod } from '../lib/period';
import { HexagramFigure } from '../ui/HexagramFigure';
import { ChoiceGroup, HexagramLinePicker, TextArea, hexagramOptionLabel } from '../ui/controls';

/** Bước 0 — Nhìn lại kỳ trước. Bắt buộc trước khi định vị kỳ mới. */
export function HindsightForm({ record, data }: { record: Positioning; data: StaticData }) {
  const [h, setH] = useState<Partial<Hindsight>>({ actualHexagram: null, actualLine: null });
  const [error, setError] = useState<string | null>(null);
  const hex = data.hexagram(record.finalHexagram);
  const ready = !!h.selfWasRight && !!h.willNotDoKept && !!h.whatHappened?.trim();

  async function save() {
    try {
      await saveHindsight(db, record.id, {
        reviewedAt: new Date().toISOString(),
        actualHexagram: h.actualHexagram ?? null,
        actualLine: h.actualLine ?? null,
        selfWasRight: h.selfWasRight!,
        whatHappened: h.whatHappened!.trim(),
        willNotDoKept: h.willNotDoKept!,
        notes: h.notes?.trim() ?? '',
      });
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  return (
    <div className="stack">
      <h1>{t('hindsight.title', { period: formatPeriod(record.period) })}</h1>
      <p className="muted">{t('hindsight.intro')}</p>

      <section className="card readonly">
        <h3 className="small-caps">{t('hindsight.then')}</h3>
        <div className="hex-head">
          <HexagramFigure binary={hex.binary} highlight={record.finalLine} size={48} label={hex.nameHanViet} />
          <div>
            <p>
              {hexagramOptionLabel(hex)} · {t('line.n', { n: record.finalLine })}
            </p>
            <p className="original">{hex.lines[record.finalLine - 1].original}</p>
          </div>
        </div>
        <p>
          <strong>{t('hindsight.willNotDo')}:</strong> {record.willNotDo}
        </p>
        {record.painfulSentence && (
          <p>
            <strong>{t('hindsight.pain')}:</strong> {record.painfulSentence}
          </p>
        )}
      </section>

      <HexagramLinePicker
        label={<h2>{t('hindsight.actual')}</h2>}
        hexagrams={data.hexagrams}
        hexagram={h.actualHexagram}
        line={h.actualLine}
        allowUnknown
        onChange={(actualHexagram, actualLine) => setH({ ...h, actualHexagram, actualLine })}
      />
      <TextArea label={t('hindsight.whatHappened')} value={h.whatHappened} onChange={(v) => setH({ ...h, whatHappened: v })} />
      <ChoiceGroup
        label={t('hindsight.selfWasRight')}
        options={[
          { value: 'yes' as const, label: t('yes') },
          { value: 'partly' as const, label: t('hindsight.partly') },
          { value: 'no' as const, label: t('no') },
        ]}
        value={h.selfWasRight}
        onChange={(v) => setH({ ...h, selfWasRight: v })}
      />
      <ChoiceGroup
        label={t('hindsight.kept')}
        options={[
          { value: 'yes' as const, label: t('yes') },
          { value: 'partly' as const, label: t('hindsight.partly') },
          { value: 'no' as const, label: t('no') },
          { value: 'na' as const, label: t('hindsight.na') },
        ]}
        value={h.willNotDoKept}
        onChange={(v) => setH({ ...h, willNotDoKept: v })}
      />
      <TextArea label={t('step8.notes')} rows={2} value={h.notes} onChange={(v) => setH({ ...h, notes: v })} />
      {error && <p className="warning">{t('common.error', { message: error })}</p>}
      <div className="row">
        <button type="button" className="primary" disabled={!ready} onClick={save}>
          {t('hindsight.save')}
        </button>
      </div>
    </div>
  );
}
