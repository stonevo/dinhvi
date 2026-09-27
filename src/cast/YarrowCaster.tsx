import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import { cryptoInt, type LineValue } from '../lib/cast';
import { YARROW_TOTAL, lineFromChanges, yarrowChange, type YarrowChange } from '../lib/yarrow';
import { RitualLines } from './Ritual';

/** Chia bó ngẫu nhiên đều: số cọng tay trái từ 1 đến total − 2. */
const randomSplit = (total: number) => 1 + cryptoInt(total - 2);

type YarrowState = { lines: LineValue[]; changes: YarrowChange[]; last: YarrowChange | null };

/** Một biến tiếp theo; đủ ba biến thì thêm một hào. */
function step({ lines, changes }: YarrowState): YarrowState {
  const cur = changes.length ? changes[changes.length - 1].after : YARROW_TOTAL;
  const c = yarrowChange(cur, randomSplit);
  const next = [...changes, c];
  return next.length === 3 ? { lines: [...lines, lineFromChanges(next)], changes: [], last: c } : { lines, changes: next, last: c };
}

/**
 * Gieo bằng cỏ thi: mỗi lần bấm là một biến (chia hai, kẹp một, đếm từng bốn, giữ
 * phần dư); ba biến ra một hào, mười tám biến ra quẻ, hào sơ trước.
 */
export function YarrowCaster({ onDone }: { onDone: (lines: LineValue[]) => void }) {
  const [st, setSt] = useState<YarrowState>({ lines: [], changes: [], last: null });
  const { lines, changes, last } = st;
  const total = changes.length ? changes[changes.length - 1].after : YARROW_TOTAL;
  const done = useRef(false);
  useEffect(() => {
    if (lines.length === 6 && !done.current) {
      done.current = true;
      onDone(lines);
    }
  }, [lines, onDone]);

  const one = () => setSt((s) => (s.lines.length < 6 ? step(s) : s));
  const rest = () =>
    setSt((s) => {
      let cur = s;
      while (cur.lines.length < 6) cur = step(cur);
      return cur;
    });

  const n = lines.length + 1;
  return (
    <section className="caster">
      <RitualLines lines={lines} />
      <p className="calm-hint">
        {t('yarrow.intro')} <Link to="/intro/co-thi">{t('yarrow.learn')}</Link>
      </p>
      {lines.length < 6 && (
        <>
          <p className="ritual-step">{t('yarrow.progress', { line: n, change: changes.length + 1, total })}</p>
          {last && (
            <p className="small yarrow-last">
              {t('yarrow.last', { left: last.left, right: last.right, lr: last.leftRest, rr: last.rightRest, removed: last.removed, after: last.after })}
            </p>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="primary" onClick={one}>
              {t('yarrow.split')}
            </button>
            <button type="button" className="ritual-link" onClick={rest}>
              {t('yarrow.rest')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
