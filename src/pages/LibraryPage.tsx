import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStaticData, type StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import { hexagramFromTrigrams, nextInSequence, oppositeHexagram, previousInSequence, reversedHexagram } from '../lib/iching';
import { filterHexagrams, type LibraryFilter } from '../lib/library';
import { STAGES, TRIGRAM_KEYS, type LinePosition, type StageInCycle, type TrigramKey } from '../types/schema';
import { HexagramFigure } from '../ui/HexagramFigure';
import { LineReading } from '../ui/LineReading';
import { TRIGRAM_SYMBOL } from '../flow/steps/Step2Trigrams';
import { Term } from '../ui/Term';
import { XIANTIAN_ORDER } from '../lib/diagrams';
import { JudgmentClassic, LineClassic, WenyanClassic } from '../ui/Classic';
import { HexTenWings } from '../ui/HexTenWings';

/** Thư viện: tra cứu 64 quẻ. */
export function LibraryPage() {
  const { data } = useStaticData();
  const [f, setF] = useState<LibraryFilter>({ query: '', upper: '', lower: '', stage: '' });
  const [view, setViewState] = useState<'list' | 'table'>(() => {
    try {
      return localStorage.getItem(VIEW_STORE) === 'table' ? 'table' : 'list';
    } catch {
      return 'list';
    }
  });
  const setView = (v: 'list' | 'table') => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_STORE, v);
    } catch {
      /* chỉ là tiện ích */
    }
  };
  if (!data) return <p className="muted">{t('common.loading')}</p>;
  const list = filterHexagrams(data.hexagrams, f);

  const trigramSelect = (key: 'upper' | 'lower', label: string) => (
    <label className="field">
      <span className="small muted">{label}</span>
      <select value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value as TrigramKey | '' })}>
        <option value="">{t('library.any')}</option>
        {TRIGRAM_KEYS.map((k) => (
          <option key={k} value={k}>
            {TRIGRAM_SYMBOL[k]} {data.trigrams[k].nameHanViet} · {data.trigrams[k].image}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="stack">
      <h1>{t('nav.library')}</h1>
      <div className="library-filters">
        <label className="field grow">
          <span className="small muted">{t('library.search')}</span>
          <input type="search" value={f.query} placeholder={t('library.searchPlaceholder')} onChange={(e) => setF({ ...f, query: e.target.value })} />
        </label>
        {trigramSelect('upper', t('library.upper'))}
        {trigramSelect('lower', t('library.lower'))}
        <label className="field">
          <span className="small muted">{t('library.stage')}</span>
          <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as StageInCycle | '' })}>
            <option value="">{t('library.any')}</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {t(`stage.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row-inline library-view">
        <p className="muted small">{t('library.count', { n: list.length })}</p>
        <div className="deck-chips" role="group" aria-label={t('library.view')}>
          {(['list', 'table'] as const).map((v) => (
            <button key={v} type="button" className={view === v ? 'chip on' : 'chip'} aria-pressed={view === v} onClick={() => setView(v)}>
              {t(`library.view.${v}`)}
            </button>
          ))}
        </div>
      </div>
      {view === 'table' ? (
        <TrigramTable data={data} shown={new Set(list.map((h) => h.kingWenNumber))} />
      ) : (
      <ul className="library-grid">
        {list.map((h) => (
          <li key={h.kingWenNumber}>
            <Link to={`/library/${h.kingWenNumber}`} className="library-item">
              <HexagramFigure binary={h.binary} size={36} label={h.nameHanViet} />
              <span>
                <span className="library-num">{h.kingWenNumber}</span> {h.nameHanViet} <span className="han">{h.nameHan}</span>
                <span className="muted small library-sub">{h.nameVi}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}

const VIEW_STORE = 'dinhvi.library.view';

/** Bảng 8×8 tra quẻ: hàng = quái trên, cột = quái dưới (xếp theo thứ tự Tiên thiên). Ô không khớp bộ lọc bị làm mờ. */
function TrigramTable({ data, shown }: { data: StaticData; shown: Set<number> }) {
  const head = (k: TrigramKey) => (
    <>
      <span className="trigram-symbol">{TRIGRAM_SYMBOL[k]}</span> {data.trigrams[k].nameHanViet}
      <span className="muted small"> {data.trigrams[k].image}</span>
    </>
  );
  return (
    <div className="table-scroll">
      <table className="trigram-table">
        <thead>
          <tr>
            <th className="small muted">{t('library.tableCorner')}</th>
            {XIANTIAN_ORDER.map((lo) => (
              <th key={lo}>{head(lo)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {XIANTIAN_ORDER.map((up) => (
            <tr key={up}>
              <th>{head(up)}</th>
              {XIANTIAN_ORDER.map((lo) => {
                const n = hexagramFromTrigrams(lo, up);
                const h = data.hexagram(n);
                return (
                  <td key={lo} className={shown.has(n) ? '' : 'dim'}>
                    <Link to={`/library/${n}`} title={fullHexagramName(h)}>
                      <HexagramFigure binary={h.binary} size={26} label="" />
                      <span className="small">
                        {n}. {h.nameHanViet}
                      </span>
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Một quẻ: hai quái, lời quẻ, Tự quái, quẻ liên quan, sáu hào, dụng hào. */
export function HexagramPage() {
  const { n = '1' } = useParams();
  const { data } = useStaticData();
  if (!data) return <p className="muted">{t('common.loading')}</p>;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 64) return <p>{t('library.notFound')}</p>;
  const h = data.hexagram(num);
  const prev = previousInSequence(num);
  const next = nextInSequence(num);

  return (
    <article className="stack">
      <p className="small">
        <Link to="/library">← {t('nav.library')}</Link>
      </p>
      <div className="hex-head">
        <HexagramFigure binary={h.binary} size={80} label={fullHexagramName(h)} />
        <div>
          <h1>
            {h.kingWenNumber}. {h.nameHanViet} <span className="han">{h.nameHan}</span>
          </h1>
          <p className="muted">
            {fullHexagramName(h)} · {h.nameVi} · {t(`stage.${h.stageInCycle}`)}
          </p>
          <p>{h.theme}</p>
        </div>
      </div>

      <section className="grid-2">
        <TrigramBox data={data} k={h.upperTrigram} label={t('library.upperFull')} />
        <TrigramBox data={data} k={h.lowerTrigram} label={t('library.lowerFull')} />
      </section>

      <section>
        <h2>{t('library.judgment')}</h2>
        <p className="han-text" lang="zh-Hant">{h.judgmentHan}</p>
        <p>{h.judgment}</p>
        <JudgmentClassic hexagram={h} />
      </section>

      <section>
        <h2>{t('library.sequence')}</h2>
        <HexTenWings n={num} />
        <p className="muted">{h.sequenceNote}</p>
        <p className="row-inline">
          {prev && <HexLink data={data} n={prev} label={`← ${t('library.prev')}`} />}
          {next && <HexLink data={data} n={next} label={`${t('library.next')} →`} />}
        </p>
        <p className="row-inline">
          <HexLink data={data} n={oppositeHexagram(num)} label={t('library.opposite')} />
          {reversedHexagram(num) !== num && <HexLink data={data} n={reversedHexagram(num)} label={t('library.reversed')} />}
        </p>
      </section>

      <section>
        <h2>
          {t('library.lines')} <Term k="hao" />
        </h2>
        {([1, 2, 3, 4, 5, 6] as LinePosition[]).map((pos) => (
          <div key={pos} id={`line-${pos}`} className="card library-line">
            <h3>
              {t('line.n', { n: pos })} · <span className="muted small">{t(`tier.${h.lines[pos - 1].tier}`)}</span>
            </h3>
            <LineReading hexagram={h} position={pos} lineTiers={data.lineTiers} />
          </div>
        ))}
        {h.allMoving && (
          <div className="card library-line">
            <h3>{t(num === 1 ? 'cast.useNine' : 'cast.useSix')}</h3>
            <p className="original">{h.allMoving.original}</p>
            <p className="han-text" lang="zh-Hant">{h.allMoving.originalHan}</p>
            <LineClassic hexagram={h} position={7} />
            <p>{h.allMoving.situation}</p>
            <p className="muted">{h.allMoving.commonFailure}</p>
            <p className="muted small">{h.allMoving.traditionalCounsel}</p>
          </div>
        )}
      </section>
      <WenyanClassic hexagram={h} />
    </article>
  );
}

function TrigramBox({ data, k, label }: { data: StaticData; k: TrigramKey; label: string }) {
  const tr = data.trigrams[k];
  return (
    <div className="card">
      <p className="small-caps">{label}</p>
      <h3>
        <span className="trigram-symbol">{TRIGRAM_SYMBOL[k]}</span> {tr.nameHanViet} <span className="han">{tr.nameHan}</span> · {tr.image}
      </h3>
      <p className="small">{label === t('library.lowerFull') ? tr.asInnerState : tr.asOuterSituation}</p>
    </div>
  );
}

function HexLink({ data, n, label }: { data: StaticData; n: number; label: string }) {
  const h = data.hexagram(n);
  return (
    <Link to={`/library/${n}`}>
      {label}: {n}. {h.nameHanViet}
    </Link>
  );
}
