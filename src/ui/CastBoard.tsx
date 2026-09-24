import { useState } from 'react';
import { t } from '../i18n';
import { isYang, readCast, tossCoins, type LineValue } from '../lib/cast';
import type { StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { HexagramFigure } from './HexagramFigure';

/**
 * Bàn gieo: mỗi lần bấm tung ba đồng xu cho hào kế tiếp (từ dưới lên). Đủ 6
 * hào thì hiện quẻ chính, hào động và quẻ biến. Dùng ở bước 2 và mục Gieo quẻ.
 */
export function CastBoard({
  lines,
  onChange,
  data,
}: {
  lines: LineValue[];
  onChange: (lines: LineValue[]) => void;
  data: StaticData;
}) {
  // Mặt ba đồng xu của từng hào trong lần gieo này (chỉ để hiển thị; nháp chỉ lưu giá trị hào).
  const [log, setLog] = useState<(2 | 3)[][]>([]);
  const done = lines.length === 6;
  const reading = done ? readCast(lines) : null;
  const binary = lines.map((v) => (isYang(v) ? '1' : '0')).join('');
  const moving = lines.flatMap((v, i) => (v === 6 || v === 9 ? [i + 1] : []));

  function toss() {
    const { coins, value } = tossCoins();
    setLog([...log.slice(0, lines.length), coins]);
    onChange([...lines, value]);
  }

  return (
    <div className="cast-board">
      <p className="muted small">{t('cast.tossHint')}</p>
      <div className="hex-head">
        <HexagramFigure binary={binary} moving={moving} size={72} label={t('cast.primary')} />
        <div className="stack">
          <ol className="cast-log">
            {lines.map((v, i) => (
              <li key={i}>
                {t('cast.coins', {
                  n: i + 1,
                  coins: log[i] ? log[i].map((c) => (c === 3 ? t('cast.heads') : t('cast.tails'))).join(' · ') : '—',
                  value: v,
                  name: t(`cast.value.${v}`),
                })}
              </li>
            ))}
          </ol>
          <div className="row">
            {!done && (
              <button type="button" className="primary" onClick={toss}>
                {t('cast.toss', { n: lines.length + 1 })}
              </button>
            )}
            {lines.length > 0 && (
              <button
                type="button"
                className="link"
                onClick={() => {
                  setLog([]);
                  onChange([]);
                }}
              >
                {t('cast.recast')}
              </button>
            )}
          </div>
        </div>
      </div>

      {reading && (
        <section className="result" aria-live="polite">
          <CastSummary reading={reading} data={data} />
        </section>
      )}
    </div>
  );
}

export function CastSummary({ reading, data }: { reading: ReturnType<typeof readCast>; data: StaticData }) {
  const p = data.hexagram(reading.primary);
  const tr = reading.transformed ? data.hexagram(reading.transformed) : null;
  return (
    <div className="stack">
      <div className="hex-head">
        <HexagramFigure binary={p.binary} moving={reading.moving} label={fullHexagramName(p)} />
        <div>
          <p className="small-caps">{t('cast.primary')}</p>
          <h3>
            {p.kingWenNumber}. {p.nameHanViet} <span className="han">{p.nameHan}</span>
          </h3>
          <p className="muted">
            {fullHexagramName(p)} · {p.nameVi}
          </p>
          <p>{p.theme}</p>
          <p className="muted small">
            {reading.moving.length ? t('cast.moving', { lines: reading.moving.join(', ') }) : t('cast.noMoving')}
          </p>
        </div>
      </div>
      {tr && (
        <div className="hex-head">
          <HexagramFigure binary={tr.binary} size={48} label={fullHexagramName(tr)} />
          <div>
            <p className="small-caps">{t('cast.transformed')}</p>
            <h3>
              {tr.kingWenNumber}. {tr.nameHanViet} <span className="han">{tr.nameHan}</span>
            </h3>
            <p>{tr.theme}</p>
          </div>
        </div>
      )}
    </div>
  );
}
