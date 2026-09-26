import { t } from '../i18n';
import type { readCast } from '../lib/cast';
import type { StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { HexagramFigure } from './HexagramFigure';
import { Term } from './Term';

/** Tóm tắt một lần gieo: quẻ chính, hào động, quẻ biến. */
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
            {reading.moving.length ? t('cast.moving', { lines: reading.moving.join(', ') }) : t('cast.noMoving')} <Term k="haoDong" />
          </p>
        </div>
      </div>
      {tr && (
        <div className="hex-head">
          <HexagramFigure binary={tr.binary} size={48} label={fullHexagramName(tr)} />
          <div>
            <p className="small-caps">
              {t('cast.transformed')} <Term k="queBien" />
            </p>
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
