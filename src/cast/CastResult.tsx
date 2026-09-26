import { useMemo, useState } from 'react';
import type { StaticData } from '../data/load';
import { t } from '../i18n';
import { readCast, type LineValue } from '../lib/cast';
import { liuyaoChart, type Topic, type UseGodKey } from '../lib/liuyao';
import { vnParts } from '../lib/lunar';
import { trigramsOf } from '../lib/iching';
import type { CastMethod, ContextKey } from '../types/schema';
import { CastSummary } from '../ui/CastBoard';
import { CastReadingView } from './CastReading';
import { LiuyaoTable } from './LiuyaoTable';
import { MeihuaPanel, TimeInfo, analyze, monthElementOf } from './meihua';
import type { MeihuaCast } from '../lib/meihua';

export type CastView = {
  lines: LineValue[];
  at: Date;
  question: string;
  context?: ContextKey;
  method: CastMethod;
  methodInput?: string;
  askerGender?: 'male' | 'female';
  /** Có khi vừa lập quẻ Mai Hoa (giữ phép tính để xem lại). */
  meihua?: MeihuaCast;
};

type Tab = 'reading' | 'liuyao' | 'meihua';

/** Kết quả một lần gieo: tóm tắt, rồi ba tab Kinh văn · Lục Hào · Mai Hoa. */
export function CastResult({ view, data, ziStartsNextDay }: { view: CastView; data: StaticData; ziStartsNextDay: boolean }) {
  const isMeihua = view.method.startsWith('meihua');
  const [tab, setTab] = useState<Tab>('reading');
  // Dụng thần chọn tay (ghi đè gợi ý theo ngữ cảnh).
  const [useGod, setUseGod] = useState<UseGodKey | undefined>(undefined);
  const reading = useMemo(() => readCast(view.lines), [view.lines]);
  const parts = useMemo(() => vnParts(view.at, { ziStartsNextDay }), [view.at, ziStartsNextDay]);
  const chart = useMemo(
    () =>
      liuyaoChart({
        lines: view.lines,
        day: parts.dayCanChi,
        month: parts.monthCanChi,
        topic: view.context as Topic | undefined,
        askerGender: view.askerGender,
        useGod,
      }),
    [view.lines, parts, view.context, view.askerGender, useGod],
  );
  // Mai Hoa cần đúng một hào động; tính lại từ quẻ đã lưu nếu không có phép tính gốc.
  const meihua = useMemo(() => {
    if (reading.moving.length !== 1) return null;
    const { upper, lower } = trigramsOf(reading.primary);
    const cast = view.meihua ?? {
      method: 'numbers' as const,
      upperSum: 0,
      lowerSum: 0,
      movingSum: 0,
      upper,
      lower,
      movingLine: reading.moving[0] as 1 | 2 | 3 | 4 | 5 | 6,
      steps: [],
    };
    return { cast, analysis: analyze(cast, { monthElement: monthElementOf(parts) }) };
  }, [reading, view.meihua, parts]);

  const tabs: Tab[] = ['reading', 'liuyao', ...(meihua ? (['meihua'] as Tab[]) : [])];

  return (
    <section className="stack">
      <div className="card stack">
        {view.question && <blockquote className="cast-question">{view.question}</blockquote>}
        <p className="small">
          {t(`method.${view.method}` as 'method.coins')}
          {view.methodInput && <> · {view.methodInput}</>}
          {view.context && <> · {t(`context.${view.context}` as 'context.work')}</>}
        </p>
        <TimeInfo parts={parts} />
        <CastSummary reading={reading} data={data} />
        <p className="small muted">{t('cast.mutual', { name: data.hexagram(chart.mutual.number).nameHanViet })}</p>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>
            {t(`result.tab.${k}` as 'result.tab.reading')}
          </button>
        ))}
      </div>

      {tab === 'reading' && <CastReadingView reading={reading} question={view.question} data={data} context={view.context} />}
      {tab === 'liuyao' && <LiuyaoTable chart={chart} data={data} useGod={useGod} onUseGod={setUseGod} />}
      {tab === 'meihua' && meihua && (
        <>
          {!view.meihua && !isMeihua && <p className="small muted">{t('meihua.fromCoins')}</p>}
          <MeihuaPanel cast={meihua.cast} analysis={meihua.analysis} data={data} />
        </>
      )}
    </section>
  );
}
