import { useEffect, useState } from 'react';
import { useSummary, type StaticData } from '../data/load';
import { t } from '../i18n';
import { castFocus, type CastReading } from '../lib/cast';

export type Reflection = { q: string; a: string };

// Câu người dùng đang ghi cho lần gieo chưa lưu (khoá như câu trả lời AI) — trang Gieo quẻ đọc khi bấm Lưu.
const drafts = new Map<string, Reflection[]>();
export const reflectionDraft = (key: string) => drafts.get(key)?.filter((r) => r.a.trim());

type Prompt = { label: string; text?: string; questions: string[] };

/** Câu hỏi tự soi theo đúng phần quy tắc đọc chọn: hào cần đọc thì dùng câu hỏi của hào; không có hào thì theo nên / tránh của quẻ. */
function usePrompts(reading: CastReading, data: StaticData): Prompt[] | null {
  const focus = castFocus(reading);
  const n = focus.kind === 'judgment' ? focus.hexagrams[0] : focus.hexagram;
  const s = useSummary(n);
  const h = data.hexagram(n);
  if (focus.kind === 'lines') {
    return focus.lines.map((pos) => ({
      label: t('reflect.line', { n: pos, name: h.nameHanViet }),
      text: s?.lines[pos - 1],
      questions: h.lines[pos - 1].reflectionQuestions.slice(0, 2),
    }));
  }
  if (focus.kind === 'allMoving') {
    return [{ label: t(n === 1 ? 'cast.useNine' : 'cast.useSix'), text: s?.allMoving, questions: h.allMoving?.reflectionQuestions.slice(0, 2) ?? [] }];
  }
  if (!s) return null;
  return [
    {
      label: t('reflect.judgment', { name: h.nameHanViet }),
      text: s.time,
      questions: [t('reflect.q.do', { item: s.do[0] }), t('reflect.q.avoid', { item: s.avoid[0] })],
    },
  ];
}

/**
 * "Soi câu hỏi của bạn vào quẻ": nối câu hỏi với đúng hào (hoặc lời quẻ) cần đọc bằng vài câu
 * hỏi, người dùng tự ghi câu trả lời. `saved`: bản đã lưu (xem lại lịch sử, chỉ đọc).
 */
export function Reflect({
  reading, question, data, draftKey, saved,
}: {
  reading: CastReading;
  question: string;
  data: StaticData;
  draftKey: string;
  saved?: Reflection[];
}) {
  const prompts = usePrompts(reading, data);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => {
    if (saved) return;
    drafts.set(
      draftKey,
      Object.entries(answers).map(([q, a]) => ({ q, a })),
    );
  }, [answers, draftKey, saved]);

  if (!question.trim()) return null;
  if (saved) {
    if (!saved.length) return null;
    return (
      <section className="card reflect stack">
        <p className="small-caps">{t('reflect.title')}</p>
        {saved.map((r) => (
          <div key={r.q}>
            <p className="reflect-q">{r.q}</p>
            <p>{r.a}</p>
          </div>
        ))}
      </section>
    );
  }
  if (!prompts) return null;
  return (
    <section className="card reflect stack">
      <p className="small-caps">{t('reflect.title')}</p>
      <blockquote className="cast-question">{question}</blockquote>
      <p className="muted small">{t('reflect.intro')}</p>
      {prompts.map((p) => (
        <div key={p.label} className="stack">
          <p>
            <strong>{p.label}.</strong> {p.text}
          </p>
          {p.questions.map((q) => (
            <label key={q} className="field">
              <span className="reflect-q">{q}</span>
              <textarea rows={2} value={answers[q] ?? ''} onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })} />
            </label>
          ))}
        </div>
      ))}
    </section>
  );
}
