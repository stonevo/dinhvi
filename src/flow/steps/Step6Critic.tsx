import { useState } from 'react';
import { t } from '../../i18n';
import type { LinePosition } from '../../types/schema';
import { oppositeHexagram, opposingLine } from '../../lib/iching';
import { LineReading } from '../../ui/LineReading';
import { HexagramLinePicker, TextArea, hexagramOptionLabel } from '../../ui/controls';
import { derivedHexagram } from '../draft';
import type { StepProps } from './types';

/**
 * Bước 6 — Đối nghịch (chống chọn quẻ đẹp). Hai nút hỗ trợ chỉ để xem;
 * lựa chọn của người phê bình luôn do người dùng tự nhập, không điền sẵn.
 */
export function Step6Critic({ d, set, data }: StepProps) {
  const hex = derivedHexagram(d)!;
  const line = d.line!;
  const [preview, setPreview] = useState<'opposite' | 'opposingLine' | null>(null);
  const previewHex = preview === 'opposite' ? oppositeHexagram(hex) : hex;
  const previewLine = preview === 'opposingLine' ? opposingLine(line as LinePosition) : line;

  return (
    <div className="stack">
      <h2>{t('step6.question')}</h2>
      <div className="row">
        <button type="button" aria-pressed={preview === 'opposite'} onClick={() => setPreview(preview === 'opposite' ? null : 'opposite')}>
          {t('step6.showOpposite')}
        </button>
        <button type="button" aria-pressed={preview === 'opposingLine'} onClick={() => setPreview(preview === 'opposingLine' ? null : 'opposingLine')}>
          {t('step6.showOpposingLine')}
        </button>
      </div>
      {preview && (
        <section className="card preview">
          <p className="muted small">{t('step6.previewNote')}</p>
          <h3>
            {hexagramOptionLabel(data.hexagram(previewHex))} · {t('line.n', { n: previewLine })}
          </h3>
          <LineReading hexagram={data.hexagram(previewHex)} position={previewLine} lineTiers={data.lineTiers} compact />
        </section>
      )}

      <HexagramLinePicker
        label={t('step6.criticChoice')}
        hexagrams={data.hexagrams}
        hexagram={d.criticHexagram}
        line={d.criticLine}
        onChange={(criticHexagram, criticLine) => set({ criticHexagram, criticLine })}
      />

      {d.criticHexagram && d.criticLine && (
        <>
          <div className="two-col">
            <section className="card">
              <h3>{t('step6.yours')}</h3>
              <p className="muted small">
                {hexagramOptionLabel(data.hexagram(hex))} · {t('line.n', { n: line })}
              </p>
              <LineReading hexagram={data.hexagram(hex)} position={line} lineTiers={data.lineTiers} compact />
            </section>
            <section className="card">
              <h3>{t('step6.critics')}</h3>
              <p className="muted small">
                {hexagramOptionLabel(data.hexagram(d.criticHexagram))} · {t('line.n', { n: d.criticLine })}
              </p>
              <LineReading hexagram={data.hexagram(d.criticHexagram)} position={d.criticLine} lineTiers={data.lineTiers} compact />
            </section>
          </div>
          <TextArea label={<strong>{t('step6.compare')}</strong>} value={d.criticComparison} onChange={(v) => set({ criticComparison: v })} />
        </>
      )}
    </div>
  );
}
