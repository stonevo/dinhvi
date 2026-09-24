import { t } from '../../i18n';
import { fullHexagramName } from '../../data/names';
import { HexagramFigure } from '../../ui/HexagramFigure';
import { LineReading } from '../../ui/LineReading';
import { ChoiceGroup, TextArea } from '../../ui/controls';
import { derivedHexagram } from '../draft';
import type { StepProps } from './types';

/** Bước 5 — Đọc lời hào và phép thử đau: người dùng là giám khảo, không phải người nghe phán. */
export function Step5Reading({ d, set, data }: StepProps) {
  const h = data.hexagram(derivedHexagram(d)!);
  const line = d.line!;
  const answers = d.reflectionAnswers ?? [];
  return (
    <div className="stack">
      <div className="hex-head">
        <HexagramFigure binary={h.binary} highlight={line} label={fullHexagramName(h)} />
        <div>
          <h2>
            {h.nameHanViet} · {t('line.n', { n: line })}
          </h2>
          <p className="han-text" lang="zh-Hant">{h.judgmentHan}</p>
          <p className="muted">{h.judgment}</p>
        </div>
      </div>
      <LineReading
        hexagram={h}
        position={line}
        lineTiers={data.lineTiers}
        onPickSentence={(s) => set({ painfulSentence: s })}
        picked={d.painfulSentence}
        answers={answers}
        onAnswer={(i, v) => {
          const next = [...answers];
          next[i] = v;
          set({ reflectionAnswers: next });
        }}
      />
      <TextArea label={<strong>{t('step5.painQuestion')}</strong>} rows={2} value={d.painfulSentence} onChange={(v) => set({ painfulSentence: v })} />
      <ChoiceGroup
        label={t('step5.painType')}
        layout="column"
        options={(['specific', 'vague', 'none'] as const).map((v) => ({ value: v, label: t(`step5.${v}`) }))}
        value={d.painType}
        onChange={(v) => set({ painType: v })}
      />
      <p className="muted small">{t('step5.explain')}</p>
    </div>
  );
}
