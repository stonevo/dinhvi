import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { tossCoins, type LineValue } from '../lib/cast';
import { playBell, playCoins, prefersReducedMotion, vibrate } from '../lib/feedback';
import { CAST_METHODS, CONTEXT_KEYS, type CastMethod, type ContextKey } from '../types/schema';
import { CoinToss } from '../ui/CoinToss';

export type AskDraft = {
  question: string;
  context?: ContextKey;
  gender?: 'male' | 'female';
  method: CastMethod;
  /** Số ngày đến hạn đối chiếu; 0 = không hẹn. */
  checkInDays: number;
};

/** Bước 1: câu hỏi và ngữ cảnh trước, rồi chọn cách lập quẻ. */
export function AskStep({ draft, onChange, onNext }: { draft: AskDraft; onChange: (d: AskDraft) => void; onNext: () => void }) {
  const ok = draft.question.trim().length >= 3;
  return (
    <section className="stack">
      <label className="field">
        <span>{t('ritual.question')}</span>
        <textarea rows={3} value={draft.question} placeholder={t('ritual.questionPlaceholder')} onChange={(e) => onChange({ ...draft, question: e.target.value })} />
        <span className="small muted">{t('ritual.questionHint')}</span>
      </label>

      <fieldset className="field">
        <legend>{t('ritual.context')}</legend>
        <div className="deck-chips">
          {CONTEXT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={draft.context === k ? 'chip on' : 'chip'}
              aria-pressed={draft.context === k}
              onClick={() => onChange({ ...draft, context: draft.context === k ? undefined : k })}
            >
              {t(`context.${k}` as 'context.work')}
            </button>
          ))}
        </div>
        {draft.context === 'love' && (
          <label className="field">
            <span className="small muted">{t('ritual.gender')}</span>
            <select value={draft.gender ?? ''} onChange={(e) => onChange({ ...draft, gender: (e.target.value || undefined) as AskDraft['gender'] })}>
              <option value="">—</option>
              <option value="male">{t('ritual.gender.male')}</option>
              <option value="female">{t('ritual.gender.female')}</option>
            </select>
          </label>
        )}
      </fieldset>

      <fieldset className="field">
        <legend>{t('ritual.method')}</legend>
        <div className="method-list">
          {CAST_METHODS.map((m) => (
            <label key={m} className={'method' + (draft.method === m ? ' on' : '')}>
              <input type="radio" name="method" checked={draft.method === m} onChange={() => onChange({ ...draft, method: m })} />
              <span>
                <strong>{t(`method.${m}` as 'method.coins')}</strong>
                <span className="small muted"> — {t(`method.${m}.hint` as 'method.coins.hint')}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>{t('ritual.checkIn')}</span>
        <select value={draft.checkInDays} onChange={(e) => onChange({ ...draft, checkInDays: Number(e.target.value) })}>
          {[0, 7, 30, 90, 180].map((d) => (
            <option key={d} value={d}>
              {d === 0 ? t('ritual.checkIn.none') : t('ritual.checkIn.days', { n: d })}
            </option>
          ))}
        </select>
        <span className="small muted">{t('ritual.checkInHint')}</span>
      </label>

      <div className="row">
        <button type="button" className="primary" disabled={!ok} onClick={onNext}>
          {t('ritual.next')}
        </button>
      </div>
    </section>
  );
}

/** Bước 2: tĩnh tâm — nhịp thở chậm, có thể bỏ qua. */
export function CalmStep({ question, onDone }: { question: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [breaths, setBreaths] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => {
        if (p === 'out') setBreaths((b) => b + 1);
        return p === 'in' ? 'out' : 'in';
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="calm">
      <blockquote className="cast-question">{question}</blockquote>
      <div className="calm-circle" aria-hidden />
      <p className="lead">{t(phase === 'in' ? 'ritual.breatheIn' : 'ritual.breatheOut')}</p>
      <p className="small muted">{t('ritual.calmHint', { n: breaths })}</p>
      <div className="row">
        <button type="button" className="primary" onClick={onDone}>
          {t('ritual.ready')}
        </button>
      </div>
    </section>
  );
}

/** Gieo ba đồng xu bằng máy: mỗi lần một hào, có hiệu ứng, tiếng, rung. */
export function CoinsCaster({ sound, onDone }: { sound: boolean; onDone: (lines: LineValue[], coins: (2 | 3)[][]) => void }) {
  const [lines, setLines] = useState<LineValue[]>([]);
  const [log, setLog] = useState<(2 | 3)[][]>([]);
  const [tossing, setTossing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function toss() {
    if (tossing || lines.length >= 6) return;
    const { coins, value } = tossCoins();
    const nextLines = [...lines, value];
    const nextLog = [...log, coins];
    setTossing(true);
    if (sound) {
      playCoins();
      vibrate([20, 40, 20]);
    }
    timer.current = window.setTimeout(
      () => {
        setTossing(false);
        setLines(nextLines);
        setLog(nextLog);
        if (nextLines.length === 6) {
          if (sound) {
            playBell();
            vibrate(60);
          }
          onDone(nextLines, nextLog);
        }
      },
      prefersReducedMotion() ? 0 : 950,
    );
  }

  const n = lines.length + 1;
  return (
    <section className="stack center">
      <CoinToss coins={tossing ? null : (log.at(-1) ?? null)} tossing={tossing} />
      <LinesSoFar lines={lines} />
      {lines.length < 6 && (
        <div className="row">
          <button type="button" className="primary" disabled={tossing} onClick={toss}>
            {t('cast.toss', { n })}
          </button>
        </div>
      )}
      <p className="small muted">{t('ritual.coinsHint')}</p>
    </section>
  );
}

/** Nhập tay khi gieo xu thật: mỗi hào chọn số mặt ngửa (ngửa = 3, sấp = 2). */
export function ManualCaster({ onDone }: { onDone: (lines: LineValue[]) => void }) {
  const [lines, setLines] = useState<LineValue[]>([]);
  const n = lines.length + 1;
  const pick = (v: LineValue) => {
    const next = [...lines, v];
    setLines(next);
    if (next.length === 6) onDone(next);
  };
  const options: { v: LineValue; heads: number }[] = [
    { v: 6, heads: 0 },
    { v: 7, heads: 1 },
    { v: 8, heads: 2 },
    { v: 9, heads: 3 },
  ];
  return (
    <section className="stack">
      <p>{t('manual.intro')}</p>
      <LinesSoFar lines={lines} />
      {lines.length < 6 && (
        <>
          <p className="small-caps">{t('manual.line', { n })}</p>
          <div className="study-options">
            {options.map((o) => (
              <button key={o.v} type="button" className="study-option" onClick={() => pick(o.v)}>
                {t('manual.option', { heads: o.heads, tails: 3 - o.heads, v: o.v, name: t(`cast.value.${o.v}` as 'cast.value.6') })}
              </button>
            ))}
          </div>
        </>
      )}
      {lines.length > 0 && lines.length < 6 && (
        <div className="row">
          <button type="button" onClick={() => setLines(lines.slice(0, -1))}>
            {t('manual.undo')}
          </button>
        </div>
      )}
    </section>
  );
}

/** Các hào đã có, vẽ từ dưới lên (hào mới nhất ở trên). */
function LinesSoFar({ lines }: { lines: LineValue[] }) {
  if (!lines.length) return null;
  return (
    <ol className="lines-so-far" reversed>
      {[...lines].reverse().map((v, i) => (
        <li key={i}>
          <span className={'bar ' + (v === 7 || v === 9 ? 'yang' : 'yin')} />
          <span className="small muted">
            {t('line.n', { n: lines.length - i })} · {v} · {t(`cast.value.${v}` as 'cast.value.6')}
          </span>
        </li>
      ))}
    </ol>
  );
}
