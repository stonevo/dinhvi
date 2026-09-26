import { useEffect, useState } from 'react';
import type { StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import type { LineValue } from '../lib/cast';
import { hexagramBinary, hexagramFromTrigrams } from '../lib/iching';
import { canChiName, vnParts, type VnParts } from '../lib/lunar';
import {
  ELEMENT_VI, analyze, byNumberString, byNumbers, byText, byTime,
  type Element, type MeihuaAnalysis, type MeihuaCast, type RoleWithRelation,
} from '../lib/meihua';
import { TRIGRAM_SYMBOL } from '../flow/steps/Step2Trigrams';
import type { TrigramKey } from '../types/schema';

/** Hành của tháng theo tiết khí (chi tháng): Dần Mão Mộc, Tỵ Ngọ Hỏa, Thân Dậu Kim, Hợi Tý Thủy, Thìn Tuất Sửu Mùi Thổ. */
export function monthElementOf(p: VnParts): Element {
  const b = p.monthCanChi.branch;
  if (b === 2 || b === 3) return 'moc';
  if (b === 5 || b === 6) return 'hoa';
  if (b === 8 || b === 9) return 'kim';
  if (b === 11 || b === 0) return 'thuy';
  return 'tho';
}

/** Sáu giá trị hào từ một quẻ Mai Hoa: hào động là lão (6/9), còn lại thiếu (7/8). */
export function linesFromMeihua(c: Pick<MeihuaCast, 'upper' | 'lower' | 'movingLine'>): LineValue[] {
  const bin = hexagramBinary(hexagramFromTrigrams(c.lower, c.upper));
  return [...bin].map((b, i) => {
    const moving = i + 1 === c.movingLine;
    if (b === '1') return moving ? 9 : 7;
    return moving ? 6 : 8;
  });
}

/** Thời điểm theo lịch Việt Nam: giờ, âm lịch, can chi, tiết khí. */
export function TimeInfo({ parts }: { parts: VnParts }) {
  const s = parts.solar;
  const pad = (n: number) => String(n).padStart(2, '0');
  const l = parts.lunar;
  return (
    <p className="small muted">
      {t('time.solar', { d: pad(s.day), m: pad(s.month), y: s.year, hh: pad(s.hour), mm: pad(s.minute) })} ·{' '}
      {t('time.lunar', { d: l.day, m: l.month + (l.leap ? ' ' + t('time.leap') : ''), y: canChiName(parts.yearCanChi) })} ·{' '}
      {t('time.pillars', { month: canChiName(parts.monthCanChi), day: canChiName(parts.dayCanChi), hour: canChiName(parts.hourCanChi) })} ·{' '}
      {parts.solarTerm.name}
    </p>
  );
}

let strokesCache: Promise<Record<string, number>> | null = null;
function loadStrokes() {
  strokesCache ??= fetch(`${import.meta.env.BASE_URL}data/strokes.json`).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<Record<string, number>>;
  });
  strokesCache.catch(() => (strokesCache = null));
  return strokesCache;
}

export type MeihuaMethodKey = 'meihua-time' | 'meihua-number' | 'meihua-text';

/** Lập quẻ Mai Hoa: theo giờ, theo số, theo chữ. Trả về quẻ, phép tính, dữ liệu đầu vào. */
export function MeihuaCaster({
  method, ziStartsNextDay, onDone,
}: {
  method: MeihuaMethodKey;
  ziStartsNextDay: boolean;
  onDone: (r: { cast: MeihuaCast; at: Date; input: string }) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [num, setNum] = useState('');
  const [num2, setNum2] = useState('');
  const [text, setText] = useState('');
  // Một chữ Hán: người dùng tự đếm nét phần trái / phần phải (máy không tách được bộ phận).
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [addHour, setAddHour] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (method !== 'meihua-time') return;
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, [method]);
  useEffect(() => {
    if (method === 'meihua-text') loadStrokes().then(setStrokes, () => setStrokes({}));
  }, [method]);

  const parts = vnParts(now, { ziStartsNextDay });
  const singleHan = method === 'meihua-text' && /^\p{Script=Han}$/u.test(text.trim());

  function go() {
    setError(null);
    const at = new Date();
    const p = vnParts(at, { ziStartsNextDay });
    const hour = addHour ? p.hourBranchNumber : undefined;
    try {
      let cast: MeihuaCast;
      let input: string;
      if (method === 'meihua-time') {
        cast = byTime({ yearBranchNumber: p.yearBranchNumber, lunarMonth: p.lunar.month, lunarDay: p.lunar.day, hourBranchNumber: p.hourBranchNumber });
        input = `${canChiName(p.yearCanChi)} ${p.lunar.day}/${p.lunar.month} ${canChiName(p.hourCanChi)}`;
      } else if (method === 'meihua-number') {
        if (num2.trim()) {
          cast = byNumbers(Number(num), Number(num2), hour);
          input = `${num} · ${num2}`;
        } else {
          cast = byNumberString(num, hour);
          input = num;
        }
      } else {
        const lr: [number, number] | undefined = singleHan && left && right ? [Number(left), Number(right)] : undefined;
        cast = byText(text, { strokes: (ch) => strokes?.[ch], hourBranchNumber: hour, singleCharLeftRight: lr });
        input = lr ? `${text.trim()} (${lr[0]} | ${lr[1]})` : text;
      }
      onDone({ cast, at, input });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="stack">
      <TimeInfo parts={parts} />
      {method === 'meihua-time' && <p>{t('meihua.timeIntro')}</p>}
      {method === 'meihua-number' && (
        <>
          <p>{t('meihua.numberIntro')}</p>
          <div className="row-inline">
            <label className="field grow">
              <span className="small muted">{t('meihua.number1')}</span>
              <input inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value)} placeholder="0912345678" />
            </label>
            <label className="field">
              <span className="small muted">{t('meihua.number2')}</span>
              <input inputMode="numeric" value={num2} onChange={(e) => setNum2(e.target.value)} />
            </label>
          </div>
        </>
      )}
      {method === 'meihua-text' && (
        <>
          <p>{t('meihua.textIntro')}</p>
          <label className="field">
            <span className="small muted">{t('meihua.text')}</span>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="梅花 · Hưng Thịnh" />
          </label>
          {singleHan && (
            <div className="stack">
              <p className="small">{t('meihua.singleChar', { ch: text.trim(), n: strokes?.[text.trim()] ?? '?' })}</p>
              <div className="row-inline">
                <label className="field">
                  <span className="small muted">{t('meihua.leftStrokes')}</span>
                  <input inputMode="numeric" value={left} onChange={(e) => setLeft(e.target.value.replace(/\D/g, ''))} />
                </label>
                <label className="field">
                  <span className="small muted">{t('meihua.rightStrokes')}</span>
                  <input inputMode="numeric" value={right} onChange={(e) => setRight(e.target.value.replace(/\D/g, ''))} />
                </label>
              </div>
              {!(left && right) && <p className="small muted">{t('meihua.singleCharFallback')}</p>}
            </div>
          )}
        </>
      )}
      {method !== 'meihua-time' && (
        <label className="row-inline small">
          <input type="checkbox" checked={addHour} onChange={(e) => setAddHour(e.target.checked)} /> {t('meihua.addHour', { hour: canChiName(parts.hourCanChi) })}
        </label>
      )}
      {error && <p className="warning small">{error}</p>}
      <div className="row">
        <button
          type="button"
          className="primary"
          disabled={(method === 'meihua-number' && !num.trim()) || (method === 'meihua-text' && (!text.trim() || !strokes))}
          onClick={go}
        >
          {t('meihua.cast')}
        </button>
      </div>
    </section>
  );
}

const tri = (k: TrigramKey, data: StaticData) => `${TRIGRAM_SYMBOL[k]} ${data.trigrams[k].nameHanViet}`;

function RoleRow({ label, role, data }: { label: string; role: RoleWithRelation; data: StaticData }) {
  return (
    <tr>
      <td>{label}</td>
      <td>
        {tri(role.trigram, data)} · {ELEMENT_VI[role.element]}
      </td>
      <td>
        <strong>{role.relation.label}</strong> — {role.relation.verdictLabel}
      </td>
    </tr>
  );
}

/** Mai Hoa: Thể – Dụng, hỗ, biến và quan hệ ngũ hành với Thể. */
export function MeihuaPanel({ cast, analysis, data }: { cast: MeihuaCast; analysis: MeihuaAnalysis; data: StaticData }) {
  const name = (n: number) => fullHexagramName(data.hexagram(n));
  return (
    <section className="stack">
      <p>
        <strong>{name(analysis.primary)}</strong> · {t('meihua.moving', { n: analysis.movingLine })} → <strong>{name(analysis.transformed)}</strong> ·{' '}
        {t('meihua.mutual', { name: name(analysis.mutual) })}
      </p>
      <details className="classic">
        <summary>{t('meihua.steps')}</summary>
        <ul className="small">
          {cast.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {cast.note && <p className="small muted">{cast.note}</p>}
      </details>
      <p>
        {t('meihua.the', { tri: tri(analysis.the.trigram, data), el: ELEMENT_VI[analysis.the.element] })}
        {analysis.theStrength && <> · {t('meihua.strength', { s: analysis.theStrength.label })}</>}
      </p>
      <div className="table-scroll">
        <table className="study-progress">
          <tbody>
            <RoleRow label={t('meihua.dung')} role={analysis.dung} data={data} />
            <RoleRow label={t('meihua.mutualUpper')} role={analysis.mutualUpperRole} data={data} />
            <RoleRow label={t('meihua.mutualLower')} role={analysis.mutualLowerRole} data={data} />
            <RoleRow label={t('meihua.changed')} role={analysis.changed} data={data} />
          </tbody>
        </table>
      </div>
      <p className="small">{analysis.dung.relation.summary}</p>
      <p className="small muted">{t('meihua.disclaimer')}</p>
    </section>
  );
}

export { analyze };
