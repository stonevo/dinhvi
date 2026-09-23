import { t } from '../../i18n';
import { ChoiceGroup, HexagramLinePicker, TextArea, TextInput, hexagramOptionLabel } from '../../ui/controls';
import { derivedHexagram, finalHexagramOf, finalLineOf } from '../draft';
import type { StepProps } from './types';

/** Bước 8 — Kết luận. Mặc định là kết quả của chính người dùng ở bước 2 và 4. */
export function Step8Conclusion({ d, set, data }: StepProps) {
  const hex = derivedHexagram(d)!;
  const fh = finalHexagramOf(d);
  const fl = finalLineOf(d);
  const changed = fh !== hex || fl !== d.line;
  return (
    <div className="stack">
      <section className="card small">
        <p>
          {t('step6.critics')}: {d.criticHexagram ? hexagramOptionLabel(data.hexagram(d.criticHexagram)) : '—'} ·{' '}
          {t('line.n', { n: d.criticLine ?? '—' })}
        </p>
        <p>
          {t('record.witness')}: {d.witnessSkipped || !d.witness ? t('record.noWitness') : `${d.witness.who} — ${t(`witness.${d.witness.theirStage}`)}`}
        </p>
        <p>
          {t('hindsight.pain')}: {d.painfulSentence || '—'} ({d.painType ? t(`step5.${d.painType}`) : '—'})
        </p>
      </section>

      <HexagramLinePicker
        label={<h2>{t('step8.final')}</h2>}
        hexagrams={data.hexagrams}
        hexagram={fh}
        line={fl}
        onChange={(h, l) => set({ finalHexagram: h ?? undefined, finalLine: l ?? undefined })}
      />
      {changed && <p className="muted">{t('step8.changed', { n: hex, line: d.line! })}</p>}

      <ChoiceGroup
        label={t('step8.confidence')}
        options={([1, 2, 3, 4, 5] as const).map((v) => ({ value: v, label: String(v) }))}
        value={d.confidence}
        onChange={(v) => set({ confidence: v })}
      />
      <TextInput label={<strong>{t('step8.willNotDo')}</strong>} value={d.willNotDo} onChange={(v) => set({ willNotDo: v })} />
      <TextArea label={t('step8.notes')} rows={3} value={d.notes} onChange={(v) => set({ notes: v })} />
    </div>
  );
}
