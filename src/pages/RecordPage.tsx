import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import { formatPeriod } from '../lib/period';
import { HexagramFigure } from '../ui/HexagramFigure';
import { hexagramOptionLabel } from '../ui/controls';
import { readCast } from '../lib/cast';

/** Tóm tắt một trang của một bản ghi, in được / lưu ảnh được. */
export function RecordPage() {
  const { id = '' } = useParams();
  const { data } = useStaticData();
  const q = useLiveQuery(async () => {
    const p = await db.positionings.get(id);
    return { p, domain: p ? await db.domains.get(p.domainId) : undefined };
  }, [id]);
  const sheet = useRef<HTMLDivElement>(null);

  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;
  const { p, domain } = q;
  if (!p) return <p>{t('record.notFound')}</p>;

  const fh = data.hexagram(p.finalHexagram);
  const line = fh.lines[p.finalLine - 1];
  const title = t('record.title', { domain: domain?.name ?? '', period: formatPeriod(p.period) });

  async function saveImage() {
    if (!sheet.current) return;
    const { toPng } = await import('html-to-image');
    const bg = getComputedStyle(document.body).backgroundColor;
    const url = await toPng(sheet.current, { backgroundColor: bg, pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinhvi-${p!.period}-${domain?.name ?? 'record'}.png`;
    a.click();
  }

  return (
    <div className="stack">
      <div className="row no-print">
        <button type="button" onClick={() => window.print()}>
          {t('record.print')}
        </button>
        <button type="button" onClick={saveImage}>
          {t('record.image')}
        </button>
        {!p.hindsight && <Link to={`/review/${p.id}`}>{t('home.action.review')}</Link>}
      </div>

      <article className="sheet" ref={sheet}>
        <header>
          <p className="muted small">{title}</p>
          <div className="hex-head">
            <HexagramFigure binary={fh.binary} highlight={p.finalLine} size={72} label={fullHexagramName(fh)} />
            <div>
              <h1>
                {fh.nameHanViet} <span className="han">{fh.nameHan}</span> · {t('line.n', { n: p.finalLine })}
              </h1>
              <p className="muted">
                {fullHexagramName(fh)} · {t(`stage.${fh.stageInCycle}`)} · {t('record.confidence', { n: p.confidence })}
                {p.changedAfterTests && <> · {t('record.changed')}</>}
              </p>
              <p className="original">{line.original}</p>
            </div>
          </div>
        </header>

        <section className="will-not-do">
          <h2>{t('hindsight.willNotDo')}</h2>
          <p>{p.willNotDo}</p>
        </section>

        <section>
          <h3>{t('line.situation')}</h3>
          <p>{line.situation}</p>
          {line.commonFailure && <p className="muted">{line.commonFailure}</p>}
        </section>

        <section>
          <h3>{t('record.facts')}</h3>
          <ul>
            {p.facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>

        <section className="grid-2">
          <div>
            <h3>{t('record.trigrams')}</h3>
            <p>
              {data.trigrams[p.innerTrigram].nameHanViet}: {p.innerEvidence}
            </p>
            <p>
              {data.trigrams[p.outerTrigram].nameHanViet}: {p.outerEvidence}
            </p>
          </div>
          <div>
            <h3>{t('record.initial')}</h3>
            <p>
              {hexagramOptionLabel(data.hexagram(p.hexagram))} · {t('line.n', { n: p.line })}
            </p>
            <p className="muted small">
              {t(p.method === 'cast' ? 'record.method.cast' : 'record.method.self')}
              {p.castLines && readCast(p.castLines).moving.length > 0 && (
                <> · {t('cast.moving', { lines: readCast(p.castLines).moving.join(', ') })}</>
              )}
              {p.castLines && readCast(p.castLines).transformed && (
                <> · {t('cast.transformed')}: {hexagramOptionLabel(data.hexagram(readCast(p.castLines).transformed!))}</>
              )}
            </p>
          </div>
          <div>
            <h3>{t('record.critic')}</h3>
            <p>
              {p.criticHexagram ? hexagramOptionLabel(data.hexagram(p.criticHexagram)) : '—'}
              {p.criticLine && <> · {t('line.n', { n: p.criticLine })}</>}
            </p>
            <p className="muted">{p.criticComparison}</p>
          </div>
          <div>
            <h3>{t('record.witness')}</h3>
            {p.witness ? (
              <p>
                {p.witness.who} — {t(`witness.${p.witness.theirStage}`)}
                {p.witness.theirLineGuess && <> · {t('line.n', { n: p.witness.theirLineGuess })}</>}
                {p.witness.note && <span className="muted"> · {p.witness.note}</span>}
              </p>
            ) : (
              <p className="muted">{t('record.noWitness')}</p>
            )}
          </div>
        </section>

        {p.painfulSentence && (
          <section>
            <h3>{t('hindsight.pain')}</h3>
            <blockquote>{p.painfulSentence}</blockquote>
            <p className="muted small">{t(`step5.${p.painType}`)}</p>
          </section>
        )}

        {p.notes && (
          <section>
            <h3>{t('step8.notes')}</h3>
            <p>{p.notes}</p>
          </section>
        )}

        {p.hindsight && (
          <section className="hindsight-block">
            <h3>{t('record.hindsight')}</h3>
            <p>
              {p.hindsight.actualHexagram ? hexagramOptionLabel(data.hexagram(p.hindsight.actualHexagram)) : t('hindsight.unknownHex')}
              {p.hindsight.actualLine && <> · {t('line.n', { n: p.hindsight.actualLine })}</>}
            </p>
            <p>{p.hindsight.whatHappened}</p>
          </section>
        )}
      </article>
    </div>
  );
}
