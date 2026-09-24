import { t } from '../../i18n';
import type { LinePosition, Tier } from '../../types/schema';
import { linesOfTier } from '../../lib/iching';
import { readCast } from '../../lib/cast';
import { ChoiceGroup, TextArea } from '../../ui/controls';
import { derivedHexagram, signalCount } from '../draft';
import type { StepProps } from './types';

/**
 * Bước 4 — Hào. Cảnh báo tự đặt cao luôn hiển thị. Điểm khớp chỉ là số đếm
 * những gì người dùng tự đánh dấu; hai hào luôn theo thứ tự vị trí, không tô
 * nổi, không chọn sẵn.
 */
export function Step4Line({ d, set, data }: StepProps) {
  const h = data.hexagram(derivedHexagram(d)!);
  const candidates = d.tier ? linesOfTier(d.tier) : [];
  const answers = d.tierChecklistAnswers ?? {};

  return (
    <div className="stack">
      <p className="warning" role="note">{t('step4.warning')}</p>
      {d.method === 'cast' && d.castLines?.length === 6 && readCast(d.castLines).moving.length > 0 && (
        <p className="note">{t('step4.movingNote', { lines: readCast(d.castLines).moving.join(', ') })}</p>
      )}

      <ChoiceGroup
        label={<h2>{t('step4.tierQuestion')}</h2>}
        layout="column"
        options={(['earth', 'human', 'heaven'] as Tier[]).map((v) => ({ value: v, label: t(`tier.${v}`) }))}
        value={d.tier}
        onChange={(v) => set({ tier: v })}
      />
      <TextArea label={t('step4.tierEvidence')} rows={2} value={d.tierEvidence} onChange={(v) => set({ tierEvidence: v })} />

      {candidates.length > 0 && (
        <div className="two-col">
          {candidates.map((pos) => {
            const line = h.lines[pos - 1];
            const tier = data.lineTiers[pos - 1];
            const marked = d.signalsByLine?.[pos] ?? [];
            const count = signalCount(d, pos, line.behavioralSignals.length);
            const yes = tier.checklist.filter((q) => answers[q.id] === true).length;
            return (
              <section key={pos} className="card">
                <h3>{t('line.n', { n: pos })}</h3>
                <p className="original">{line.original}</p>
                <p className="muted small">{tier.summary}</p>

                <h4>{t('step4.checklist')}</h4>
                <ul className="checklist">
                  {tier.checklist.map((q) => (
                    <li key={q.id}>
                      <span>{q.question}</span>
                      <span className="yn" role="group" aria-label={q.question}>
                        {[true, false].map((v) => (
                          <button
                            key={String(v)}
                            type="button"
                            aria-pressed={answers[q.id] === v}
                            onClick={() => set({ tierChecklistAnswers: { ...answers, [q.id]: v } })}
                          >
                            {v ? t('yes') : t('no')}
                          </button>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>

                {line.behavioralSignals.length > 0 ? (
                  <>
                    <h4>{t('step4.signals')}</h4>
                    <ul className="signal-list">
                      {line.behavioralSignals.map((s, i) => (
                        <li key={i}>
                          <label>
                            <input
                              type="checkbox"
                              aria-label={s}
                              checked={marked.includes(i)}
                              onChange={(e) => {
                                const next = e.target.checked ? [...marked, i] : marked.filter((x) => x !== i);
                                set({ signalsByLine: { ...d.signalsByLine, [pos]: next } });
                              }}
                            />{' '}
                            {s}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="muted small">{line.situation}</p>
                )}
                <p className="count">{t('step4.count', { marked: count.marked, total: count.total, yes })}</p>
              </section>
            );
          })}
        </div>
      )}

      {candidates.length > 0 && (
        <>
          <p className="muted small">{t('step4.countNote')}</p>
          <ChoiceGroup
            label={<h2>{t('step4.choose')}</h2>}
            options={candidates.map((pos) => ({ value: pos as LinePosition, label: t('step4.pick', { n: pos }) }))}
            value={d.line}
            onChange={(v) => set({ line: v })}
          />
        </>
      )}
    </div>
  );
}
