import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useBookChapter, useBooks } from '../data/load';
import { t } from '../i18n';
import type { Book, BookBlock, BookChapter, BookNote } from '../types/schema';
import { FootnoteLayer, FootnoteRef } from '../ui/Footnotes';

// Chỗ đang đọc của từng sách, chỉ lưu trên máy này (tiện tay, mất cũng không sao).
const lastKey = (bookId: string) => `dinhvi.book.${bookId}.last`;
function readLast(bookId: string): string | null {
  try {
    return localStorage.getItem(lastKey(bookId));
  } catch {
    return null;
  }
}
function saveLast(bookId: string, chapterId: string) {
  try {
    localStorage.setItem(lastKey(bookId), chapterId);
  } catch {
    /* không lưu được thì thôi */
  }
}

const chapterLabel = (c: { kind: string; n?: number; title: string }) =>
  c.kind === 'chapter' && c.n ? `${t('books.chapter', { n: c.n })} · ${c.title}` : c.title;

/** Danh sách sách. */
export function BooksPage() {
  const books = useBooks();
  if (!books) return <p className="muted">{t('common.loading')}</p>;
  return (
    <div className="stack intro">
      <h1>{t('books.title')}</h1>
      <p className="lead">{t('books.lead')}</p>
      <ol className="intro-toc">
        {books.map((b) => (
          <li key={b.id}>
            <Link to={`/books/${b.id}`} className="card intro-toc-item">
              <strong>
                {b.title} {b.titleHan && <span className="han">{b.titleHan}</span>}
              </strong>
              <span className="small">{t('books.byline', { translator: b.translator })}</span>
              <span className="muted small">{b.summary}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Trang một cuốn: thông tin bản dịch, đọc tiếp, mục lục. */
export function BookPage() {
  const { bookId = '' } = useParams();
  const books = useBooks();
  if (!books) return <p className="muted">{t('common.loading')}</p>;
  const b = books.find((x) => x.id === bookId);
  if (!b) return <p>{t('books.notFound')}</p>;
  const last = readLast(b.id);
  const lastCh = last ? b.chapters.find((c) => c.id === last) : undefined;
  const front = b.chapters.filter((c) => c.kind === 'front');
  const main = b.chapters.filter((c) => c.kind === 'chapter');
  return (
    <article className="stack intro book">
      <p className="small">
        <Link to="/books">← {t('books.title')}</Link>
      </p>
      <h1>
        {b.title} {b.titleHan && <span className="han">{b.titleHan}</span>}
      </h1>
      {b.epigraph && <p className="book-epigraph">{b.epigraph}</p>}
      <p className="lead">{b.summary}</p>
      <dl className="book-meta small">
        <dt>{t('books.translator')}</dt>
        <dd>{b.translator}</dd>
        {b.commentator && (
          <>
            <dt>{t('books.commentator')}</dt>
            <dd>{b.commentator}</dd>
          </>
        )}
        {b.translated && (
          <>
            <dt>{t('books.translated')}</dt>
            <dd>{b.translated}</dd>
          </>
        )}
      </dl>
      <p>
        <Link className="button primary" to={`/books/${b.id}/${lastCh ? lastCh.id : b.chapters[0].id}`}>
          {lastCh ? t('books.continue', { title: chapterLabel(lastCh) }) : t('books.start')}
        </Link>
      </p>
      <h2>{t('books.toc')}</h2>
      <ul className="book-toc">
        {front.map((c) => (
          <li key={c.id}>
            <Link to={`/books/${b.id}/${c.id}`}>{c.title}</Link>
          </li>
        ))}
      </ul>
      <ol className="book-toc book-toc-main">
        {main.map((c) => (
          <li key={c.id} value={c.n}>
            <Link to={`/books/${b.id}/${c.id}`}>{c.title}</Link>
          </li>
        ))}
      </ol>
      <BookSource b={b} />
    </article>
  );
}

function BookSource({ b }: { b: Book }) {
  return (
    <details className="book-source small">
      <summary>{t('books.source')}</summary>
      <p>{b.source}</p>
      <ul>
        {b.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      {b.sourceIssues.length > 0 && (
        <>
          <p>{t('books.sourceIssues')}</p>
          <ul>
            {b.sourceIssues.map((i) => (
              <li key={`${i.chapter}-${i.block}`}>
                <Link to={`/books/${b.id}/${i.chapter}`}>{t('books.chapter', { n: i.chapter })}</Link> ({t('books.pdfPage', { p: i.page })}): {i.note}
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
}

/** Tìm chú giải cho số n (kể cả chú gộp "(2-3)"). */
const noteFor = (notes: BookNote[], n: number) => notes.find((x) => n >= x.n && n <= (x.to ?? x.n));
const noteLabel = (x: BookNote) => (x.to ? `${x.n}–${x.to}` : String(x.n));

function NoteBody({ note }: { note: BookNote }) {
  return (
    <>
      {note.paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

/** Đoạn kinh văn: thay `[^n]` bằng số chú bấm được. */
function Marked({ text, notes, scope }: { text: string; notes: BookNote[]; scope: string }) {
  // Bản gõ hay để cách trước dấu câu sau số chú ("TRẦN (2) .") — bỏ khoảng trắng đó khi hiển thị.
  const parts = text.replace(/(\[\^\d+\])\s+(?=[.,;:?!…])/g, '$1').split(/\[\^(\d+)\]/);
  return (
    <>
      {parts.map((s, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{s}</Fragment>;
        const n = Number(s);
        const note = noteFor(notes, n);
        return (
          <FootnoteRef key={i} id={`${scope}-${n}`} label={s} title={t('books.note', { n: note ? noteLabel(note) : n })}>
            {note && <NoteBody note={note} />}
          </FootnoteRef>
        );
      })}
    </>
  );
}

const SPEAKER = /^[^.;:]{2,40}(hỏi|thưa|nói|dạy|bảo|thưa rằng|nói rằng|hỏi rằng|dạy rằng)[^.;:]{0,20}:\s*$/i;

function Para({ text, notes, scope }: { text: string; notes: BookNote[]; scope: string }) {
  const cls = SPEAKER.test(text) ? 'book-speaker' : text.startsWith('— ') ? 'book-say' : text.startsWith('• ') ? 'book-item' : undefined;
  return (
    <p className={cls}>
      <Marked text={text} notes={notes} scope={scope} />
    </p>
  );
}

/** Một khối KINH VĂN: kinh văn có số chú; lời bàn (Án) và chú giải không có số trong câu để trong mục mở rộng. */
function Block({ b, scope, showAll, titleNote }: { b: BookBlock; scope: string; showAll: boolean; titleNote?: number }) {
  const used = new Set<number>();
  for (const s of b.text) for (const m of s.matchAll(/\[\^(\d+)\]/g)) used.add(Number(m[1]));
  if (titleNote) used.add(titleNote);
  const orphans = b.notes.filter((x) => !Array.from({ length: (x.to ?? x.n) - x.n + 1 }, (_, k) => x.n + k).some((n) => used.has(n)));
  // Chú giải và lời bàn theo đúng thứ tự trong sách: lời bàn có `after` = số chú đứng trước nó.
  const shown = showAll ? b.notes : orphans;
  const items: Array<{ key: string; at: number; node: ReactNode }> = [
    ...shown.map((x) => ({
      key: `n${x.n}`,
      at: x.n,
      node: (
        <div className="book-note">
          <span className="book-note-n">{noteLabel(x)}.</span>
          <div>
            <NoteBody note={x} />
          </div>
        </div>
      ),
    })),
    ...(b.an ?? []).map((a, i) => ({
      key: `a${i}`,
      at: a.after + 0.5,
      node: (
        <div className="book-an">
          <p className="small-caps">{t('books.an')}</p>
          {a.paras.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </div>
      ),
    })),
  ].sort((x, y) => x.at - y.at);
  const extra: ReactNode = items.length ? items.map((it) => <Fragment key={it.key}>{it.node}</Fragment>) : null;
  return (
    <section className="book-block">
      {b.text.map((p, i) => (
        <Para key={i} text={p} notes={b.notes} scope={scope} />
      ))}
      {extra &&
        (showAll ? (
          <div className="book-extra">{extra}</div>
        ) : (
          <details className="book-extra">
            <summary className="small">{b.an?.length ? t('books.more') : t('books.otherNotes')}</summary>
            {extra}
          </details>
        ))}
    </section>
  );
}

const SHOW_KEY = 'dinhvi.book.showNotes';

/** Đọc một chương. */
export function BookChapterPage() {
  const { bookId = '', chapterId = '' } = useParams();
  const books = useBooks();
  const ch = useBookChapter(bookId, chapterId);
  const [showAll, setShowAll] = useState(() => {
    try {
      return localStorage.getItem(SHOW_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (ch && ch !== 'error') {
      saveLast(bookId, chapterId);
      window.scrollTo(0, 0);
    }
  }, [ch, bookId, chapterId]);
  if (!books || !ch) return <p className="muted">{t('common.loading')}</p>;
  const b = books.find((x) => x.id === bookId);
  if (!b) return <p>{t('books.notFound')}</p>;
  if (ch === 'error') return <p>{t('books.loadError')}</p>;
  const i = b.chapters.findIndex((c) => c.id === chapterId);
  const prev = b.chapters[i - 1];
  const next = b.chapters[i + 1];
  const toggleAll = () => {
    setShowAll((v) => {
      try {
        localStorage.setItem(SHOW_KEY, v ? '0' : '1');
      } catch {
        /* bỏ qua */
      }
      return !v;
    });
  };
  return (
    <FootnoteLayer>
      <article className="stack intro book">
        <p className="small">
          <Link to={`/books/${b.id}`}>← {b.title}</Link>
        </p>
        <ChapterHeader ch={ch} />
        {ch.blocks.length > 0 && (
          <p>
            <button type="button" className="link small" aria-pressed={showAll} onClick={toggleAll}>
              {showAll ? t('books.hideNotes') : t('books.showNotes')}
            </button>
          </p>
        )}
        {ch.intro && (
          <div className={ch.kind === 'chapter' ? 'intro-note book-lead' : 'book-front'}>
            {ch.intro.map((p, k) => (
              <p key={k}>{p}</p>
            ))}
          </div>
        )}
        {ch.blocks.map((blk, k) => (
          <Block key={`${ch.id}-${k}`} b={blk} scope={`${ch.id}-${k}`} showAll={showAll} titleNote={k === 0 ? ch.titleNote : undefined} />
        ))}
        {ch.outro?.map((p, k) => (
          <p key={k} className="book-outro">
            {p}
          </p>
        ))}
        {ch.appendices?.map((a, k) => (
          <section key={k} className="book-appendix">
            <h2>{a.title}</h2>
            {a.paras.map((p, j) => (p.startsWith('# ') ? <h3 key={j}>{p.slice(2)}</h3> : <p key={j}>{p}</p>))}
          </section>
        ))}
        <p className="muted small">
          {t('books.citation', { translator: b.translator, title: b.title })} · {t('books.pdfPages', { a: ch.pages[0], b: ch.pages[1] })}
        </p>
        <nav className="intro-pager">
          {prev ? <Link to={`/books/${b.id}/${prev.id}`}>← {chapterLabel(prev)}</Link> : <span />}
          {next ? <Link to={`/books/${b.id}/${next.id}`}>{chapterLabel(next)} →</Link> : <span />}
        </nav>
      </article>
    </FootnoteLayer>
  );
}

function ChapterHeader({ ch }: { ch: BookChapter }) {
  const titleNote = ch.titleNote ? noteFor(ch.blocks[0]?.notes ?? [], ch.titleNote) : undefined;
  return (
    <header className="book-head">
      {ch.kind === 'chapter' && <p className="small-caps">{t('books.chapter', { n: ch.n ?? '' })}</p>}
      <h1>
        {ch.title}
        {ch.titleNote && (
          <FootnoteRef id={`${ch.id}-title`} label={String(ch.titleNote)} title={t('books.note', { n: ch.titleNote })}>
            {titleNote && <NoteBody note={titleNote} />}
          </FootnoteRef>
        )}
      </h1>
      {ch.by && <p className="muted small">{ch.by}</p>}
      {ch.headNote && <p className="muted small">({ch.headNote})</p>}
    </header>
  );
}
