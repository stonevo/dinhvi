import { useContexts, type StaticData } from '../data/load';
import { t } from '../i18n';
import { castFocus, type CastReading } from '../lib/cast';
import type { ContextKey, ContextTexts } from '../types/schema';
import { LineReading } from '../ui/LineReading';

/** Diễn giải theo ngữ cảnh câu hỏi cho một phần (lời quẻ / hào / dụng hào) của quẻ n. */
function ContextNote({ n, context, part }: { n: number; context?: ContextKey; part: 'judgment' | 'allMoving' | number }) {
  const c = useContexts(n);
  if (!context || !c) return null;
  const texts: ContextTexts | undefined = part === 'judgment' ? c.judgment : part === 'allMoving' ? c.allMoving : c.lines[part - 1];
  if (!texts) return null;
  return (
    <p className="context-note">
      <strong>{t(`context.${context}` as 'context.work')}:</strong> {texts[context]}
    </p>
  );
}

/** Đọc một lần gieo: đoạn nên đọc theo số hào động, gợi ý đặt cạnh câu hỏi, và diễn giải theo ngữ cảnh. */
export function CastReadingView({ reading, question, data, context }: { reading: CastReading; question: string; data: StaticData; context?: ContextKey }) {
  const focus = castFocus(reading);
  const p = data.hexagram(reading.primary);
  const tr = reading.transformed ? data.hexagram(reading.transformed) : null;
  const n = reading.moving.length;
  const rule = t(`cast.focus.rule.${n}` as 'cast.focus.rule.0');

  return (
    <section className="stack">
      <div className="card cast-focus stack">
        <p className="small-caps">{t('cast.focus.title')}</p>
        {question && <blockquote className="cast-question">{question}</blockquote>}
        <p className="muted small">{n === 6 && focus.kind === 'allMoving' ? t('cast.focus.rule.6all') : rule}</p>

        {focus.kind === 'judgment' &&
          focus.hexagrams.map((num) => {
            const h = data.hexagram(num);
            return (
              <div key={num}>
                <h4>
                  {t('cast.focus.judgmentOf', { name: h.nameHanViet })}
                </h4>
                <p className="han-text" lang="zh-Hant">{h.judgmentHan}</p>
                <p>{h.judgment}</p>
                <ContextNote n={num} context={context} part="judgment" />
              </div>
            );
          })}

        {focus.kind === 'lines' && (
          <>
            {focus.lines
              .slice()
              .sort((a, b) => (a === focus.main ? -1 : b === focus.main ? 1 : 0))
              .map((pos) => (
                <div key={pos}>
                  <h4>
                    {t('cast.focus.lineOf', { n: pos, name: data.hexagram(focus.hexagram).nameHanViet })}
                    {focus.lines.length > 1 && pos === focus.main && <span className="muted small"> · {t('cast.focus.main')}</span>}
                  </h4>
                  <ContextNote n={focus.hexagram} context={context} part={pos} />
                  <LineReading hexagram={data.hexagram(focus.hexagram)} position={pos} lineTiers={data.lineTiers} compact={pos !== focus.main} />
                </div>
              ))}
          </>
        )}

        {focus.kind === 'allMoving' && p.allMoving && (
          <div>
            <h4>{t(p.kingWenNumber === 1 ? 'cast.useNine' : 'cast.useSix')}</h4>
            <p className="original">{p.allMoving.original}</p>
            <p className="han-text" lang="zh-Hant">{p.allMoving.originalHan}</p>
            <ContextNote n={p.kingWenNumber} context={context} part="allMoving" />
            <p>{p.allMoving.situation}</p>
            <p className="muted">{p.allMoving.commonFailure}</p>
            <p className="muted small">{p.allMoving.traditionalCounsel}</p>
            <ul>
              {p.allMoving.reflectionQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="reading-section">
          <h4>{t('cast.focus.bridge')}</h4>
          <ul>
            <li>{t('cast.focus.now', { theme: p.theme })}</li>
            {tr && <li>{t('cast.focus.toward', { theme: tr.theme })}</li>}
            <li>{t(question ? 'cast.focus.q1' : 'cast.focus.q1NoQ')}</li>
            <li>{t('cast.focus.q2')}</li>
            <li>{t('cast.focus.q3')}</li>
          </ul>
        </div>
      </div>

      <details>
        <summary>{t('cast.focus.all')}</summary>
        <div className="stack">
          <p className="han-text" lang="zh-Hant">{p.judgmentHan}</p>
          <p className="muted">{p.judgment}</p>
          {reading.moving.map((pos) => (
            <div key={pos} className="card">
              <h4>{t('line.n', { n: pos })}</h4>
              <LineReading hexagram={p} position={pos} lineTiers={data.lineTiers} compact />
            </div>
          ))}
          {tr && (
            <>
              <h4>{t('cast.focus.judgmentOf', { name: tr.nameHanViet })}</h4>
              <p className="han-text" lang="zh-Hant">{tr.judgmentHan}</p>
              <p className="muted">{tr.judgment}</p>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
