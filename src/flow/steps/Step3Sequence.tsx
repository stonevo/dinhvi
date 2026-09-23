import { t } from '../../i18n';
import { fullHexagramName } from '../../data/names';
import { previousInSequence } from '../../lib/iching';
import { HexagramFigure } from '../../ui/HexagramFigure';
import { ChoiceGroup, TextArea } from '../../ui/controls';
import { derivedHexagram } from '../draft';
import type { StepProps } from './types';

/** Bước 3 — Kiểm tra Tự quái: quẻ đứng trước có giống quãng vừa qua không. */
export function Step3Sequence({ d, set, data, goTo }: StepProps) {
  const hex = derivedHexagram(d)!;
  const h = data.hexagram(hex);
  const prevN = previousInSequence(hex);
  const prev = prevN ? data.hexagram(prevN) : null;
  return (
    <div className="stack">
      <p className="muted">
        {h.kingWenNumber}. {h.nameHanViet} — {fullHexagramName(h)}
      </p>
      {prev ? (
        <section className="card">
          <h3 className="small-caps">{t('step3.previous')}</h3>
          <div className="hex-head">
            <HexagramFigure binary={prev.binary} size={48} label={fullHexagramName(prev)} />
            <div>
              <h3>
                {prev.kingWenNumber}. {prev.nameHanViet} <span className="han">{prev.nameHan}</span>
              </h3>
              <p>{prev.theme}</p>
            </div>
          </div>
          <p className="muted">{h.sequenceNote}</p>
        </section>
      ) : (
        <p className="muted">{t('step3.first')}</p>
      )}
      <ChoiceGroup
        label={<h2>{t('step3.question')}</h2>}
        options={(['fits', 'partly', 'doesNotFit', 'skipped'] as const).map((v) => ({ value: v, label: t(`step3.${v}`) }))}
        value={d.sequenceCheck}
        onChange={(v) => set({ sequenceCheck: v })}
      />
      {d.sequenceCheck === 'doesNotFit' && (
        <div className="soft-warn">
          <p>{t('step3.doesNotFitNote')}</p>
          <button type="button" onClick={() => goTo(2)}>
            {t('step3.backTo2')}
          </button>
        </div>
      )}
      <TextArea label={t('step3.note')} rows={2} value={d.sequenceNote} onChange={(v) => set({ sequenceNote: v })} />
    </div>
  );
}
