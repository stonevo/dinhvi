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
      <LearningPath />
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

/** Lộ trình gợi ý cho người mới: đọc gì trước, học gì ở trang Học và Thư viện. */
function LearningPath() {
  const a = (to: string, label: string) => <Link to={to}>{label}</Link>;
  return (
    <section className="card learning-path">
      <h2>{t('path.title')}</h2>
      <ol>
        <li>
          {t('path.1')} {a('/intro/nguon-goc', t('path.1a'))} → {a('/intro/kinh-truyen', t('path.1b'))} → {a('/intro/thuat-ngu', t('path.1c'))} →{' '}
          {a('/intro/quy-tac', t('path.1d'))}.
        </li>
        <li>
          {t('path.2')} {a('/intro/thoi-vi', t('path.2a'))}.
        </li>
        <li>
          {t('path.3')} {a('/study', t('path.3a'))}.
        </li>
        <li>
          {t('path.4')} {a('/library', t('path.4a'))}.
        </li>
        <li>
          {t('path.5')} {a('/tenwings', t('path.5a'))}, {a('/diagrams', t('path.5b'))}.
        </li>
      </ol>
    </section>
  );
}

export function Block({ b, sub }: { b: IntroBlock; sub?: boolean }) {
  switch (b.type) {
    case 'p':
      return (
        <p>
          {b.text}
          {b.source && <span className="muted small"> ({b.source})</span>}
        </p>
      );
    case 'h':
      return sub ? <h3>{b.text}</h3> : <h2>{b.text}</h2>;
    case 'quote':
      return (
        <figure className="intro-quote">
          <blockquote>
            <p className={b.lang ? 'original' : 'han-text'} lang={b.lang ?? 'zh-Hant'}>
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
