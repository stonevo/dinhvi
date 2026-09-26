import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import type { StaticData } from '../data/load';
import { t } from '../i18n';
import { readCast, type LineValue } from '../lib/cast';
import { CastSummary } from '../ui/CastBoard';
import { Formed, RitualShell } from './Ritual';
import { CalmStep, CoinsCaster, ManualCaster } from './steps';

type Stage = 'closed' | 'calm' | 'cast' | 'formed';

/**
 * Gieo quẻ có nghi thức, dùng ở bước 2 của luồng Tự định vị và ở Ghi nhanh:
 * mở không gian nghi thức (tĩnh tâm → gieo xu máy hoặc xu thật → quẻ đã thành),
 * xong trả sáu hào về chỗ gọi. Cùng giao diện với mục Gieo quẻ.
 */
export function RitualCastBoard({
  lines, onChange, data, question,
}: {
  lines: LineValue[];
  onChange: (lines: LineValue[]) => void;
  data: StaticData;
  /** Điều đang hỏi / đang định vị, hiện như lời khấn trong không gian nghi thức. */
  question: string;
}) {
  const settings = useLiveQuery(() => getSettings(db));
  const sound = settings?.castSound ?? true;
  const [stage, setStage] = useState<Stage>('closed');
  const [manual, setManual] = useState(false);
  const [pending, setPending] = useState<LineValue[] | null>(null);
  const done = lines.length === 6;

  function open(useManual: boolean) {
    setManual(useManual);
    setPending(null);
    setStage('calm');
  }
  function cast(next: LineValue[]) {
    setPending(next);
    setStage('formed');
  }

  return (
    <div className="stack">
      {done ? (
        <>
          <CastSummary reading={readCast(lines)} data={data} />
          <div className="row">
            <button type="button" onClick={() => open(false)}>
              {t('cast.recast')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted">{t('ritualBoard.intro')}</p>
          <div className="row">
            <button type="button" className="primary" onClick={() => open(false)}>
              {t('ritualBoard.enter')}
            </button>
            <button type="button" onClick={() => open(true)}>
              {t('method.coins-manual')}
            </button>
          </div>
        </>
      )}

      {stage !== 'closed' && (
        <RitualShell question={question} onExit={() => setStage('closed')}>
          {stage === 'calm' && <CalmStep sound={sound} onDone={() => setStage('cast')} />}
          {stage === 'cast' && (manual ? <ManualCaster onDone={cast} /> : <CoinsCaster sound={sound} onDone={(l) => cast(l)} />)}
          {stage === 'formed' && pending && (
            <Formed
              lines={pending}
              data={data}
              sound={sound}
              onView={() => {
                onChange(pending);
                setStage('closed');
              }}
            />
          )}
        </RitualShell>
      )}
    </div>
  );
}
