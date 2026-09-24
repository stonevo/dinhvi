import { t } from '../../i18n';
import { TRIGRAM_KEYS, type Trigram, type TrigramKey } from '../../types/schema';
import { fullHexagramName } from '../../data/names';
import { HexagramFigure } from '../../ui/HexagramFigure';
import { ChoiceGroup, TextArea } from '../../ui/controls';
import { derivedHexagram } from '../draft';
import { CastBoard } from '../../ui/CastBoard';
import type { StepProps } from './types';

export const TRIGRAM_SYMBOL: Record<TrigramKey, string> = {
  qian: '☰', dui: '☱', li: '☲', zhen: '☳', xun: '☴', kan: '☵', gen: '☶', kun: '☷',
};

function trigramOptions(list: Record<TrigramKey, Trigram>, side: 'inner' | 'outer') {
  // Thứ tự cố định (tiên thiên), không sắp theo mức "đẹp".
  return TRIGRAM_KEYS.map((k) => {
    const tr = list[k];
    return {
      value: k,
      label: (
        <>
          <span className="trigram-symbol" aria-hidden>{TRIGRAM_SYMBOL[k]}</span> {tr.nameHanViet}
          <span className="muted"> · {tr.image}</span>
        </>
      ),
      detail: (
        <>
          <span>{side === 'inner' ? tr.asInnerState : tr.asOuterSituation}</span>
          <span className="signals-title">{t('step2.signals')}</span>
          <ul className="signals">
            {(side === 'inner' ? tr.innerSignals : tr.outerSignals).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      ),
    };
  });
}

/** Bước 2 — Có quẻ: tự ghép hai quái kèm bằng chứng, hoặc gieo. */
export function Step2Trigrams({ d, set, data }: StepProps) {
  const method = d.method ?? 'self';
  const chooser = (
    <ChoiceGroup
      label={t('step2.method')}
      options={(['self', 'cast'] as const).map((v) => ({ value: v, label: t(`step2.method.${v}`) }))}
      value={method}
      onChange={(v) => set({ method: v })}
    />
  );
  if (method === 'cast') {
    return (
      <div className="stack">
        {chooser}
        <CastBoard lines={d.castLines ?? []} onChange={(castLines) => set({ castLines })} data={data} />
      </div>
    );
  }
  const hex = derivedHexagram(d);
  const h = hex ? data.hexagram(hex) : null;
  return (
    <div className="stack">
      {chooser}
      <ChoiceGroup
        label={<h2>{t('step2.innerQuestion')}</h2>}
        layout="grid"
        options={trigramOptions(data.trigrams, 'inner')}
        value={d.innerTrigram}
        onChange={(v) => set({ innerTrigram: v })}
      />
      <TextArea label={t('step2.evidence')} rows={2} value={d.innerEvidence} onChange={(v) => set({ innerEvidence: v })} />

      <ChoiceGroup
        label={<h2>{t('step2.outerQuestion')}</h2>}
        layout="grid"
        options={trigramOptions(data.trigrams, 'outer')}
        value={d.outerTrigram}
        onChange={(v) => set({ outerTrigram: v })}
      />
      <TextArea label={t('step2.evidence')} rows={2} value={d.outerEvidence} onChange={(v) => set({ outerEvidence: v })} />

      {h && d.innerTrigram && d.outerTrigram && (
        <section className="result" aria-live="polite">
          <p>
            {t('step2.result', {
              inner: data.trigrams[d.innerTrigram].nameHanViet,
              outer: data.trigrams[d.outerTrigram].nameHanViet,
              n: h.kingWenNumber,
            })}
          </p>
          <div className="hex-head">
            <HexagramFigure binary={h.binary} label={fullHexagramName(h)} />
            <div>
              <h3>
                {h.nameHanViet} <span className="han">{h.nameHan}</span>
              </h3>
              <p className="muted">
                {fullHexagramName(h)} · {h.nameVi} · {t(`stage.${h.stageInCycle}`)}
              </p>
              <p>{h.theme}</p>
            </div>
          </div>
          <p className="muted small">{t('step2.noEdit')}</p>
        </section>
      )}
    </div>
  );
}
