import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import { formatPeriod } from '../lib/period';
import { HexagramFigure } from '../ui/HexagramFigure';

/**
 * Bản gửi cho người được định vị: chỉ quẻ, hào, lời hào, điều chọn không làm,
 * câu hỏi tự soi và lời nhắn — không có thống kê hay ghi chú riêng của người hướng dẫn.
 */
export function SharePage() {
  const { id = '' } = useParams();
  const { data } = useStaticData();
  const q = useLiveQuery(async () => {
    const p = await db.positionings.get(id);
    const domain = p ? await db.domains.get(p.domainId) : undefined;
    const profile = domain ? await db.profiles.get(domain.profileId) : undefined;
    return { p, domain, profile };
  }, [id]);
  const [message, setMessage] = useState('');
  const sheet = useRef<HTMLDivElement>(null);

  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;
  const { p, domain, profile } = q;
  if (!p) return <p>{t('record.notFound')}</p>;

  const h = data.hexagram(p.finalHexagram);
  const line = h.lines[p.finalLine - 1];
  const who = [profile?.name, domain?.name, formatPeriod(p.period)].filter(Boolean).join(' · ');

  const plainText = [
    who,
    `${h.kingWenNumber}. ${h.nameHanViet} (${fullHexagramName(h)}) · ${t('line.n', { n: p.finalLine })}`,
    line.original,
    line.situation,
    `${t('hindsight.willNotDo')}: ${p.willNotDo}`,
    ...line.reflectionQuestions.map((x) => `– ${x}`),
    message.trim(),
  ]
    .filter(Boolean)
    .join('\n\n');

  async function saveImage() {
    if (!sheet.current) return;
    const { toPng } = await import('html-to-image');
    const url = await toPng(sheet.current, { backgroundColor: getComputedStyle(document.body).backgroundColor, pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinhvi-${profile?.name ?? ''}-${p!.period}.png`;
    a.click();
  }

  async function share() {
    if (navigator.share) await navigator.share({ title: t('app.name'), text: plainText }).catch(() => undefined);
    else await navigator.clipboard.writeText(plainText);
  }

  return (
    <div className="stack">
      <p className="small no-print">
        <Link to={`/record/${p.id}`}>← {t('share.back')}</Link>
      </p>
      <div className="no-print stack">
        <p className="muted small">{t('share.hint')}</p>
        <label className="field">
          <span>{t('share.message')}</span>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <div className="row">
          <button type="button" onClick={() => window.print()}>
            {t('record.print')}
          </button>
          <button type="button" onClick={saveImage}>
            {t('record.image')}
          </button>
          <button type="button" onClick={share}>
            {t('share.shareText')}
          </button>
        </div>
      </div>

      <article className="sheet share-sheet" ref={sheet}>
        <p className="muted small">{who}</p>
        <div className="hex-head">
          <HexagramFigure binary={h.binary} highlight={p.finalLine} size={72} label={fullHexagramName(h)} />
          <div>
            <h1>
              {h.nameHanViet} <span className="han">{h.nameHan}</span> · {t('line.n', { n: p.finalLine })}
            </h1>
            <p className="muted">
              {fullHexagramName(h)} · {h.nameVi}
            </p>
          </div>
        </div>
        <p className="original">{line.original}</p>
        <p className="han-text" lang="zh-Hant">{line.originalHan}</p>
        <p>{line.situation}</p>
        {line.whatTendsToFollow && <p className="muted">{line.whatTendsToFollow}</p>}

        <section className="will-not-do">
          <h2>{t('hindsight.willNotDo')}</h2>
          <p>{p.willNotDo}</p>
        </section>

        {line.reflectionQuestions.length > 0 && (
          <section>
            <h3>{t('line.questions')}</h3>
            <ul>
              {line.reflectionQuestions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        )}

        {message.trim() && (
          <section className="share-message">
            <p>{message}</p>
          </section>
        )}
      </article>
    </div>
  );
}
