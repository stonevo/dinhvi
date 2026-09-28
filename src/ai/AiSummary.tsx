import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StaticData } from '../data/load';
import { t } from '../i18n';
import type { CastReading } from '../lib/cast';
import type { ContextKey } from '../types/schema';
import { HexSummary } from '../ui/HexSummary';
import { aiEnabled, answerKey, askAi, buildInput, type AiAnswer, type AiResult } from './client';

/**
 * Phần tóm lược của kết quả gieo: có câu hỏi và đã bật "Diễn giải bằng AI" thì hiện câu trả lời
 * AI (Gemini → Cloudflare Workers AI); không được thì hiện tóm lược tĩnh như cũ.
 */
export function AiSummary({
  reading, question, context, data, at, lines, saved,
}: {
  reading: CastReading;
  question: string;
  context?: ContextKey;
  data: StaticData;
  at: Date;
  lines: number[];
  /** Câu trả lời đã lưu kèm bản ghi (xem lại lịch sử: không hỏi lại). */
  saved?: AiAnswer;
}) {
  const want = !saved && aiEnabled() && question.trim().length > 0;
  const [result, setResult] = useState<AiResult | 'loading' | null>(want ? 'loading' : null);
  const key = answerKey(at, lines, question);

  useEffect(() => {
    if (!want) return;
    let alive = true;
    setResult('loading');
    buildInput(reading, question, context, data)
      .then((input) => askAi(key, input))
      .then((r) => alive && setResult(r), () => alive && setResult({ kind: 'error' }));
    return () => {
      alive = false;
    };
  }, [want, key, reading, question, context, data]);

  const p = data.hexagram(reading.primary);
  const staticSummary = <HexSummary n={reading.primary} moving={reading.moving} title={t('summary.titleOf', { name: p.nameHanViet })} />;
  const answer = saved ?? (result && result !== 'loading' && result.kind === 'ok' ? result.answer : null);

  if (answer)
    return (
      <>
        <section className="card ai-answer stack">
          <p className="small-caps">{t('ai.title')}</p>
          {answer.text.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p className="small muted">{t('ai.note', { provider: t(answer.provider === 'gemini' ? 'ai.provider.gemini' : 'ai.provider.workers') })}</p>
        </section>
        <details className="read-more">
          <summary>{t('ai.staticSummary')}</summary>
          {staticSummary}
        </details>
      </>
    );

  return (
    <>
      {result === 'loading' && <p className="card muted small ai-loading">{t('ai.loading')}</p>}
      {result && result !== 'loading' && result.kind !== 'ok' && (
        <p className="muted small">
          {t(`ai.fallback.${result.kind}` as 'ai.fallback.error')} {result.kind === 'signedOut' && <Link to="/settings">{t('ai.toSettings')}</Link>}
        </p>
      )}
      {staticSummary}
    </>
  );
}
