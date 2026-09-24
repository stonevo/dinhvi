import type { Hexagram, LineTier } from '../types/schema';
import { t } from '../i18n';
import { sentences } from '../flow/draft';

type Props = {
  hexagram: Hexagram;
  position: number;
  lineTiers: LineTier[];
  /** compact: chỉ tình huống, cái nguy, chỗ hay vấp (dùng để so sánh). */
  compact?: boolean;
  /** Khi có: từng câu bấm được, để chọn câu làm mình khó chịu. */
  onPickSentence?: (s: string) => void;
  picked?: string;
  answers?: string[];
  onAnswer?: (index: number, value: string) => void;
};

/** Lời hào đọc theo thứ tự: tình huống → nguy → vấp → truyền thống → thường đến sau → câu hỏi. */
export function LineReading({ hexagram, position, lineTiers, compact, onPickSentence, picked, answers, onAnswer }: Props) {
  const line = hexagram.lines[position - 1];
  const tier = lineTiers[position - 1];

  const para = (text: string) => {
    if (!text) return null;
    if (!onPickSentence) return <p>{text}</p>;
    return (
      <p>
        {sentences(text).map((s, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <button
              type="button"
              className={`sentence${picked === s ? ' picked' : ''}`}
              aria-pressed={picked === s}
              onClick={() => onPickSentence(s)}
            >
              {s}
            </button>
          </span>
        ))}
      </p>
    );
  };

  const section = (title: string, text: string) =>
    text ? (
      <section className="reading-section">
        <h4>{title}</h4>
        {para(text)}
      </section>
    ) : null;

  return (
    <div className="line-reading">
      <p className="original">{line.original}</p>
      <p className="han-text" lang="zh-Hant">{line.originalHan}</p>
      {section(t('line.situation'), line.situation)}
      {section(t('line.risk'), line.characteristicRisk)}
      {section(t('line.failure'), line.commonFailure)}
      {!compact && section(t('line.counsel'), line.traditionalCounsel)}
      {section(t('line.follow'), line.whatTendsToFollow)}
      {line.draft && (
        <section className="reading-section muted">
          <p className="small">{t('line.draftNote')}</p>
          {para(tier.summary)}
        </section>
      )}
      {!compact && line.reflectionQuestions.length > 0 && (
        <section className="reading-section">
          <h4>{t('line.questions')}</h4>
          {onAnswer && <p className="muted small">{t('step5.questionsHint')}</p>}
          {line.reflectionQuestions.map((q, i) => (
            <div key={i} className="field">
              <label>{q}</label>
              {onAnswer && (
                <textarea rows={2} value={answers?.[i] ?? ''} onChange={(e) => onAnswer(i, e.target.value)} />
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
