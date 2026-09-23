import { t } from '../../i18n';
import { WITNESS_STAGES, type Witness } from '../../types/schema';
import { ChoiceGroup, TextArea, TextInput } from '../../ui/controls';
import { witnessDiffers } from '../draft';
import type { StepProps } from './types';

const EMPTY = (): Witness => ({ who: '', theirStage: 'unknown', theirLineGuess: null, note: '', askedAt: new Date().toISOString() });

/** Bước 7 — Nhân chứng (chống định vị một mình). Bỏ qua được, nhưng phải chủ động bấm. */
export function Step7Witness({ d, set }: StepProps) {
  const w = d.witness ?? null;
  const patch = (p: Partial<Witness>) => set({ witness: { ...(w ?? EMPTY()), ...p }, witnessSkipped: false });

  if (d.witnessSkipped) {
    return (
      <div className="stack">
        <p>{t('step7.intro')}</p>
        <p className="soft-warn">{t('step7.skipNote')}</p>
        <button type="button" onClick={() => set({ witnessSkipped: false })}>
          {t('step7.unskip')}
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="lead">{t('step7.intro')}</p>
      <TextInput label={t('step7.who')} value={w?.who} onChange={(v) => patch({ who: v })} />
      <ChoiceGroup
        label={t('step7.stage')}
        options={WITNESS_STAGES.map((s) => ({ value: s, label: t(`witness.${s}`) }))}
        value={w ? w.theirStage : undefined}
        onChange={(v) => patch({ theirStage: v })}
      />
      <div className="field">
        <label htmlFor="witness-line">{t('step7.lineGuess')}</label>
        <select
          id="witness-line"
          value={w?.theirLineGuess ?? ''}
          onChange={(e) => patch({ theirLineGuess: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {t('line.n', { n })}
            </option>
          ))}
        </select>
      </div>
      <TextArea label={t('step7.note')} rows={2} value={w?.note} onChange={(v) => patch({ note: v })} />
      {witnessDiffers(w, d.line) && <p className="warning">{t('step7.differs')}</p>}
      <div>
        <button type="button" className="link" onClick={() => set({ witnessSkipped: true })}>
          {t('step7.skip')}
        </button>
      </div>
    </div>
  );
}
