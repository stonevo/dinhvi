import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTenWings } from '../data/load';
import { t } from '../i18n';
import type { TenWingsPara } from '../types/schema';

/** Thập Dực: danh sách các thiên đọc trọn trong app. */
export function TenWingsPage() {
  const books = useTenWings();
  if (!books) return <p className="muted">{t('common.loading')}</p>;
  return (
    <div className="stack intro">
      <h1>{t('tenwings.title')}</h1>
      <p className="lead">{t('tenwings.lead')}</p>
      <ol className="intro-toc">
        {books.map((b) => (
          <li key={b.id}>
            <Link to={`/tenwings/${b.id}`} className="card intro-toc-item">
              <strong>
                {b.title} <span className="han">{b.titleHan}</span>
              </strong>
              <span className="muted small">{b.summary}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="muted small">{t('tenwings.source')}</p>
    </div>
  );
}

/** Một đoạn: nguyên văn, bản dịch, ghi chú theo Chu Hy, liên kết quẻ. */
export function TenWingsParaView({ p }: { p: TenWingsPara }) {
  return (
    <div className="tw-para">
      <p className="han-text" lang="zh-Hant">
        {p.han}
      </p>
      <p>{p.vi}</p>
      {p.note && <p className="intro-note small">{p.note}</p>}
      {p.hex && (
        <p className="small">
          {p.hex.map((n) => (
            <Link key={n} to={`/library/${n}`} className="tw-hex">
              {t('tenwings.hexLink', { n })}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}

/** Một thiên: mục lục chương, nguyên văn và bản dịch từng đoạn. `?c=N` mở ngay chương N. */
export function TenWingsBookPage() {
  const { id = '' } = useParams();
  const [search] = useSearchParams();
  const books = useTenWings();
  const c = search.get('c');
  useEffect(() => {
    if (books && c) document.getElementById(`tw-${c}`)?.scrollIntoView();
  }, [books, c]);
  if (!books) return <p className="muted">{t('common.loading')}</p>;
  const i = books.findIndex((b) => b.id === id);
  if (i < 0) return <p>{t('tenwings.notFound')}</p>;
  const b = books[i];
  const prev = books[i - 1];
  const next = books[i + 1];
  return (
    <article className="stack intro">
      <p className="small">
        <Link to="/tenwings">← {t('tenwings.title')}</Link>
      </p>
      <h1>
        {b.title} <span className="han">{b.titleHan}</span>
      </h1>
      <p className="lead">{b.summary}</p>
      {b.chapters.length > 1 && (
        <nav className="tw-toc small" aria-label={t('tenwings.chapters')}>
          {b.chapters.map((ch) => (
            <button key={ch.n} type="button" className="link" onClick={() => document.getElementById(`tw-${ch.n}`)?.scrollIntoView({ behavior: 'smooth' })}>
              {ch.n}
            </button>
          ))}
        </nav>
      )}
      {b.chapters.map((ch) => (
        <section key={ch.n} id={`tw-${ch.n}`} className="stack tw-chapter">
          <h2>{ch.title}</h2>
          {ch.paras.map((p, k) => (
            <TenWingsParaView key={k} p={p} />
          ))}
        </section>
      ))}
      <p className="muted small">{t('tenwings.source')}</p>
      <nav className="intro-pager">
        {prev ? <Link to={`/tenwings/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/tenwings/${next.id}`}>{next.title} →</Link> : <span />}
      </nav>
    </article>
  );
}
