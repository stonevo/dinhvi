import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { tossCoins, type LineValue } from '../lib/cast';
import { playBowl, playCoins, prefersReducedMotion, vibrate } from '../lib/feedback';
import { CAST_METHODS, CONTEXT_KEYS, type CastMethod, type ContextKey } from '../types/schema';
import { CoinToss } from '../ui/CoinToss';
import { Taiji } from '../ui/Taiji';
import { RitualLines } from './Ritual';

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
    <section className="stack ask-scroll">
      <span className="seal" aria-hidden>
        問
      </span>
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

/** Bước 2: tĩnh tâm — chuông ngân, Thái cực thở theo nhịp, ba nhịp thở; có thể bỏ qua. */
export function CalmStep({ sound, onDone }: { sound: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [breaths, setBreaths] = useState(0);
  useEffect(() => {
    if (sound) playBowl();
    const id = setInterval(() => {
      setPhase((p) => {
        if (p === 'out') setBreaths((b) => b + 1);
        return p === 'in' ? 'out' : 'in';
      });
    }, 4000);
    return () => clearInterval(id);
  }, [sound]);
  const settled = breaths >= 3;
  return (
    <section className="calm">
      <div className={'calm-taiji ' + phase}>
        <Taiji size={150} />
      </div>
      <p className="calm-phase">{t(phase === 'in' ? 'ritual.breatheIn' : 'ritual.breatheOut')}</p>
      <p className="calm-hint">{settled ? t('ritual.settled') : t('ritual.calmHint', { n: breaths })}</p>
      <button type="button" className={'ritual-btn' + (settled ? ' glow' : '')} onClick={onDone}>
        {settled ? t('ritual.begin') : t('ritual.ready')}
      </button>
    </section>
  );
}

/** Gieo ba đồng xu bằng máy: mỗi lần một hào; xu bay lên, xoay, rơi, kêu và rung khi chạm. */
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
    const quick = prefersReducedMotion();
    setTossing(true);
    timer.current = window.setTimeout(
      () => {
        // Xu chạm mặt: tiếng leng keng và rung nhẹ.
        if (sound) {
          playCoins();
          vibrate([15, 30, 15, 30, 15]);
        }
        setTossing(false);
        setLines(nextLines);
        setLog(nextLog);
        if (nextLines.length === 6) timer.current = window.setTimeout(() => onDone(nextLines, nextLog), quick ? 0 : 700);
      },
      quick ? 0 : 1100,
    );
  }

  const n = lines.length + 1;
  return (
    <section className="caster">
      <RitualLines lines={lines} />
      <CoinToss coins={tossing ? null : (log.at(-1) ?? null)} tossing={tossing} />
      <p className="calm-hint">
        {lines.length
          ? t('ritual.lastLine', { n: lines.length, v: lines.at(-1)!, name: t(`cast.value.${lines.at(-1)}` as 'cast.value.6') })
          : t('ritual.coinsHint')}
      </p>
      {lines.length < 6 && (
        <button type="button" className="ritual-btn" disabled={tossing} onClick={toss}>
          {t('ritual.tossLine', { n })}
        </button>
      )}
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
    <section className="caster">
      <RitualLines lines={lines} />
      <p className="calm-hint">{t('manual.intro')}</p>
      {lines.length < 6 && (
        <>
          <p className="ritual-step">{t('manual.line', { n })}</p>
          <div className="ritual-options">
            {options.map((o) => (
              <button key={o.v} type="button" className="ritual-option" onClick={() => pick(o.v)}>
                <span className="heads-dots" aria-hidden>
                  {'●'.repeat(o.heads)}
                  {'○'.repeat(3 - o.heads)}
                </span>
                {t('manual.option', { heads: o.heads, tails: 3 - o.heads, v: o.v, name: t(`cast.value.${o.v}` as 'cast.value.6') })}
              </button>
            ))}
          </div>
        </>
      )}
      {lines.length > 0 && lines.length < 6 && (
        <button type="button" className="ritual-link" onClick={() => setLines(lines.slice(0, -1))}>
          {t('manual.undo')}
        </button>
      )}
    </section>
  );
}
