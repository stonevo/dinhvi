import { t } from '../../i18n';
import { findEvaluativeWords } from '../../lib/lint';
import type { StepProps } from './types';

/** Bước 1 — Sự thật. Chống tự tô vẽ: cảnh báo mềm khi có từ đánh giá. */
export function Step1Facts({ d, set }: StepProps) {
  const facts = d.facts ?? ['', '', ''];
  return (
    <div className="stack">
      <h2>{t('step1.question')}</h2>
      <p className="muted">{t('step1.hint')}</p>
      {[0, 1, 2].map((i) => {
        const words = findEvaluativeWords(facts[i] ?? '');
        return (
          <div key={i} className="field">
            <textarea
              rows={2}
              aria-label={t('step1.placeholder', { n: i + 1 })}
              placeholder={t('step1.placeholder', { n: i + 1 })}
              value={facts[i] ?? ''}
              onChange={(e) => {
                const next = [...facts];
                next[i] = e.target.value;
                set({ facts: next });
              }}
            />
            {words.length > 0 && <p className="soft-warn">{t('step1.lint', { words: words.join(', ') })}</p>}
          </div>
        );
      })}
    </div>
  );
}
