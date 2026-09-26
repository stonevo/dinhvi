import { Link, useParams } from 'react-router-dom';
import { useIntro } from '../data/load';
import { t } from '../i18n';
import type { IntroBlock, IntroSection } from '../types/schema';

/** Nhập môn Kinh Dịch: mục lục các bài. */
export function IntroPage() {
  const sections = useIntro();
  if (!sections) return <p className="muted">{t('common.loading')}</p>;
  return (
    <div className="stack intro">
      <h1>{t('intro.title')}</h1>
      <p className="lead">{t('intro.lead')}</p>
      <ol className="intro-toc">
        {sections.map((s) => (
          <li key={s.id}>
            <Link to={`/intro/${s.id}`} className="card intro-toc-item">
              <strong>{s.title}</strong>
              <span className="muted small">{s.summary}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Block({ b }: { b: IntroBlock }) {
  switch (b.type) {
    case 'p':
      return (
        <p>
          {b.text}
          {b.source && <span className="muted small"> ({b.source})</span>}
        </p>
      );
    case 'h':
      return <h2>{b.text}</h2>;
    case 'quote':
      return (
        <figure className="intro-quote">
          <blockquote>
            <p className="han-text" lang="zh-Hant">
              {b.han}
            </p>
            <p>{b.vi}</p>
          </blockquote>
          <figcaption className="muted small">— {b.source}</figcaption>
        </figure>
      );
    case 'list':
      return (
        <ul>
          {b.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="table-scroll">
          <table className="intro-table">
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'note':
      return (
        <p className="intro-note small">
          {b.text}
          {b.source && <span className="muted"> ({b.source})</span>}
        </p>
      );
  }
}

/** Một bài Nhập môn: nội dung, nguồn, bài trước / sau. */
export function IntroSectionPage() {
  const { id = '' } = useParams();
  const sections = useIntro();
  if (!sections) return <p className="muted">{t('common.loading')}</p>;
  const i = sections.findIndex((s) => s.id === id);
  if (i < 0) return <p>{t('intro.notFound')}</p>;
  const s: IntroSection = sections[i];
  const prev = sections[i - 1];
  const next = sections[i + 1];
  return (
    <article className="stack intro">
      <p className="small">
        <Link to="/intro">← {t('intro.back')}</Link>
      </p>
      <h1>{s.title}</h1>
      <p className="lead">{s.summary}</p>
      {s.blocks.map((b, k) => (
        <Block key={k} b={b} />
      ))}
      <section className="intro-sources">
        <h2>{t('intro.sources')}</h2>
        <ul className="small">
          {s.sources.map((src) => (
            <li key={src.label}>
              {src.url ? (
                <a href={src.url} target="_blank" rel="noreferrer">
                  {src.label}
                </a>
              ) : (
                src.label
              )}
            </li>
          ))}
        </ul>
      </section>
      <nav className="intro-pager">
        {prev ? <Link to={`/intro/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/intro/${next.id}`}>{next.title} →</Link> : <span />}
      </nav>
    </article>
  );
}
