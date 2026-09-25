import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { useStaticData, type StaticData } from '../data/load';
import { TRIGRAM_IMAGE_HV, fullHexagramName } from '../data/names';
import { ORDER_VERSE, TRIGRAM_VERSE, VERSE_SOURCE } from '../data/verses';
import { t } from '../i18n';
import {
  DECKS, allCards, answerOf, answerTrigrams, choices, isMastered, nextDue, pickNext, review,
  type Card, type DeckKey,
} from '../lib/study';
import { TRIGRAM_KEYS, type StudyState, type TrigramKey } from '../types/schema';
import { HexagramFigure } from '../ui/HexagramFigure';
import { TRIGRAM_SYMBOL } from '../flow/steps/Step2Trigrams';

const DECK_STORE = 'dinhvi.study.decks';
const CARDS = allCards();

function loadDecks(): Set<DeckKey> {
  try {
    const raw = JSON.parse(localStorage.getItem(DECK_STORE) ?? 'null');
    if (Array.isArray(raw)) {
      const ok = raw.filter((d): d is DeckKey => (DECKS as readonly string[]).includes(d));
      if (ok.length) return new Set(ok);
    }
  } catch {
    // bỏ qua: dùng mặc định
  }
  return new Set<DeckKey>(['trigram', 'name', 'keyword']);
}

function saveDecks(d: Set<DeckKey>) {
  try {
    localStorage.setItem(DECK_STORE, JSON.stringify([...d]));
  } catch {
    // không lưu được thì thôi
  }
}

/** Trang Học: thẻ ghi nhớ lặp lại ngắt quãng cho 8 quái và 64 quẻ, kèm bài ca. */
export function StudyPage() {
  const { data } = useStaticData();
  const q = useLiveQuery(async () => {
    const { activeProfileId } = await getSettings(db);
    const list = await db.study.where('profileId').equals(activeProfileId).toArray();
    return { profileId: activeProfileId, states: new Map(list.map((s) => [s.cardId, s])) };
  });
  const [decks, setDecks] = useState(loadDecks);
  const [now, setNow] = useState(() => Date.now());
  const [current, setCurrent] = useState<Card | null>(null);
  // Hạt giống xáo đáp án và khoá của thẻ, cố định lúc chọn thẻ.
  const [seed, setSeed] = useState('');
  // Kết quả vừa trả lời, dùng ngay để chọn thẻ tiếp (không chờ IndexedDB báo lại).
  const [local, setLocal] = useState<Map<string, StudyState>>(() => new Map());
  const states = useMemo(() => {
    if (!q) return null;
    const m = new Map(q.states);
    for (const [k, v] of local) if (!m.has(k) || m.get(k)!.lastReviewed < v.lastReviewed) m.set(k, v);
    return m;
  }, [q, local]);

  // Chọn thẻ mới khi chưa có thẻ đang hỏi (hoặc bộ thẻ đổi).
  useEffect(() => {
    if (!states || current) return;
    const c = pickNext(CARDS, states, decks, now);
    setSeed(c ? `${c.id}#${states.get(c.id)?.lastReviewed ?? 0}` : '');
    setCurrent(c);
  }, [states, current, decks, now]);

  if (!data || !q || !states) return <p className="muted">{t('common.loading')}</p>;

  const toggle = (d: DeckKey) => {
    const next = new Set(decks);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    if (!next.size) return;
    setDecks(next);
    saveDecks(next);
    setCurrent(null);
  };

  async function answer(card: Card, correct: boolean) {
    const at = Date.now();
    const prev = states!.get(card.id);
    const r = review(prev, correct, at);
    const s: StudyState = { id: `${q!.profileId}|${card.id}`, profileId: q!.profileId, cardId: card.id, ...r };
    setLocal((m) => new Map(m).set(card.id, s));
    await db.study.put(s);
  }

  function next() {
    setNow(Date.now());
    setCurrent(null);
  }

  const due = nextDue(states.values(), now);

  return (
    <div className="stack">
      <h1>{t('nav.study')}</h1>
      <p className="muted">{t('study.intro')}</p>

      <Progress states={states} now={now} />

      <div className="deck-chips" role="group" aria-label={t('study.decks')}>
        {DECKS.map((d) => (
          <button key={d} type="button" className={decks.has(d) ? 'chip on' : 'chip'} aria-pressed={decks.has(d)} onClick={() => toggle(d)}>
            {t(`study.deck.${d}` as 'study.deck.name')}
          </button>
        ))}
      </div>

      {current ? (
        <CardView
          key={seed}
          card={current}
          data={data}
          seed={seed}
          onAnswer={(ok) => answer(current, ok)}
          onNext={next}
        />
      ) : (
        <div className="card">
          <p>{t('study.done')}</p>
          {due && <p className="muted small">{t('study.nextAt', { when: new Date(due).toLocaleString('vi-VN') })}</p>}
        </div>
      )}

      <Verses data={data} />
    </div>
  );
}

function Progress({ states, now }: { states: Map<string, StudyState>; now: number }) {
  const rows = DECKS.map((d) => {
    const ids = CARDS.filter((c) => c.deck === d);
    const mastered = ids.filter((c) => isMastered(states.get(c.id))).length;
    const dueNow = ids.filter((c) => {
      const s = states.get(c.id);
      return s && s.due <= now;
    }).length;
    return { d, total: ids.length, mastered, dueNow };
  });
  return (
    <table className="study-progress">
      <thead>
        <tr>
          <th>{t('study.deckCol')}</th>
          <th>{t('study.mastered')}</th>
          <th>{t('study.due')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.d}>
            <td>{t(`study.deck.${r.d}` as 'study.deck.name')}</td>
            <td>
              {r.mastered}/{r.total}
            </td>
            <td>{r.dueNow || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function trigramLabel(data: StaticData, k: TrigramKey) {
  return `${TRIGRAM_SYMBOL[k]} ${data.trigrams[k].nameHanViet} · ${TRIGRAM_IMAGE_HV[k]}`;
}

function CardView({
  card, data, seed, onAnswer, onNext,
}: {
  card: Card;
  data: StaticData;
  seed: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [build, setBuild] = useState<{ upper: TrigramKey | ''; lower: TrigramKey | '' }>({ upper: '', lower: '' });
  const [checked, setChecked] = useState<boolean | null>(null);
  const options = useMemo(() => (card.deck === 'build' ? [] : choices(card, seed)), [card, seed]);
  const ans = answerOf(card);

  function choose(o: number) {
    if (checked !== null) return;
    const ok = o === ans;
    setPicked(o);
    setChecked(ok);
    onAnswer(ok);
  }

  function checkBuild() {
    const want = answerTrigrams(card.n);
    const ok = build.upper === want.upper && build.lower === want.lower;
    setChecked(ok);
    onAnswer(ok);
  }

  const hex = (n: number) => data.hexagram(n);
  const label = (o: number) => {
    // Không kèm ký hiệu quái, kẻo lộ đáp án.
    if (card.deck === 'trigram') return `${data.trigrams[TRIGRAM_KEYS[o]].nameHanViet} · ${TRIGRAM_IMAGE_HV[TRIGRAM_KEYS[o]]}`;
    if (card.deck === 'keyword') return hex(o).nameVi;
    return `${fullHexagramName(hex(o))}`;
  };

  let prompt: React.ReactNode;
  switch (card.deck) {
    case 'trigram':
      prompt = (
        <>
          <p className="study-symbol" aria-hidden>
            {TRIGRAM_SYMBOL[TRIGRAM_KEYS[card.n]]}
          </p>
          <p>{t('study.q.trigram')}</p>
        </>
      );
      break;
    case 'name':
      prompt = (
        <>
          <HexagramFigure binary={hex(card.n).binary} size={96} label={t('study.q.name')} />
          <p>{t('study.q.name')}</p>
        </>
      );
      break;
    case 'build':
      prompt = <p className="study-big">{t('study.q.build', { name: fullHexagramName(hex(card.n)) })}</p>;
      break;
    case 'keyword':
      prompt = (
        <p className="study-big">
          {t('study.q.keyword', { name: hex(card.n).nameHanViet })} <span className="han">{hex(card.n).nameHan}</span>
        </p>
      );
      break;
    case 'order':
      prompt = <p className="study-big">{t('study.q.order', { n: card.n })}</p>;
      break;
    case 'pair':
      prompt = (
        <>
          <HexagramFigure binary={hex(card.n).binary} size={72} label={fullHexagramName(hex(card.n))} />
          <p>{t('study.q.pair', { name: fullHexagramName(hex(card.n)) })}</p>
        </>
      );
      break;
  }

  return (
    <section className="card study-card stack">
      <p className="small-caps">{t(`study.deck.${card.deck}` as 'study.deck.name')}</p>
      {prompt}

      {card.deck === 'build' ? (
        <div className="row-inline">
          {(['upper', 'lower'] as const).map((pos) => (
            <label key={pos} className="field">
              <span className="small muted">{t(pos === 'upper' ? 'library.upper' : 'library.lower')}</span>
              <select
                value={build[pos]}
                disabled={checked !== null}
                onChange={(e) => setBuild({ ...build, [pos]: e.target.value as TrigramKey })}
              >
                <option value="">—</option>
                {/* Chỉ hình quái: phải tự nhớ tượng nào ứng với hình nào. */}
                {TRIGRAM_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {TRIGRAM_SYMBOL[k]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {checked === null && (
            <button type="button" className="primary" disabled={!build.upper || !build.lower} onClick={checkBuild}>
              {t('study.check')}
            </button>
          )}
        </div>
      ) : (
        <div className="study-options">
          {options.map((o) => {
            const state = checked === null ? '' : o === ans ? ' right' : o === picked ? ' wrong' : '';
            return (
              <button key={o} type="button" className={'study-option' + state} disabled={checked !== null} onClick={() => choose(o)}>
                {card.deck === 'pair' && <HexagramFigure binary={hex(o).binary} size={28} label="" />} {label(o)}
              </button>
            );
          })}
        </div>
      )}

      {checked !== null && (
        <div className="stack">
          <p className={checked ? 'study-ok' : 'study-no'}>{t(checked ? 'study.right' : 'study.wrong')}</p>
          <Answer card={card} data={data} />
          <div className="row">
            <button type="button" className="primary" onClick={onNext} autoFocus>
              {t('study.next')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Lời giải sau khi trả lời: đáp án kèm hình, tên đầy đủ, từ khóa, link tra cứu. */
function Answer({ card, data }: { card: Card; data: StaticData }) {
  if (card.deck === 'trigram') {
    const k = TRIGRAM_KEYS[card.n];
    const tr = data.trigrams[k];
    return (
      <p>
        <strong>{trigramLabel(data, k)}</strong> <span className="han">{tr.nameHan}</span> — {TRIGRAM_VERSE[verseIndex(k)].hanViet}
      </p>
    );
  }
  const h = data.hexagram(answerOf(card));
  return (
    <div className="hex-head">
      <HexagramFigure binary={h.binary} size={56} label={fullHexagramName(h)} />
      <div>
        <p>
          <strong>
            {h.kingWenNumber}. {fullHexagramName(h)}
          </strong>{' '}
          <span className="han">{h.nameHan}</span>
        </p>
        <p className="muted">
          {h.nameVi} — {h.theme}
        </p>
        <p className="small">
          <Link to={`/library/${h.kingWenNumber}`}>{t('study.open')}</Link>
        </p>
      </div>
    </div>
  );
}

/** Câu trong bài ca tám quái ứng với quái k. */
const VERSE_ORDER: TrigramKey[] = ['qian', 'kun', 'zhen', 'gen', 'li', 'kan', 'dui', 'xun'];
const verseIndex = (k: TrigramKey) => VERSE_ORDER.indexOf(k);

function Verses({ data }: { data: StaticData }) {
  return (
    <section className="stack">
      <h2>{t('study.verses')}</h2>
      <p className="muted small">{t('study.versesSource', { source: VERSE_SOURCE })}</p>
      <details className="classic">
        <summary>{t('study.verse.trigram')}</summary>
        <ul className="verse-list">
          {TRIGRAM_VERSE.map((v, i) => (
            <li key={v.han}>
              <span className="trigram-symbol" aria-hidden>
                {TRIGRAM_SYMBOL[VERSE_ORDER[i]]}
              </span>{' '}
              <span className="han">{v.han}</span> <strong>{v.hanViet}</strong> — <span className="muted">{v.note}</span>
            </li>
          ))}
        </ul>
      </details>
      <details className="classic">
        <summary>{t('study.verse.order')}</summary>
        <ol className="verse-list plain">
          {ORDER_VERSE.map((v) => (
            <li key={v.han}>
              <span className="han">{v.han}</span> <strong>{v.hanViet}</strong>{' '}
              <span className="muted small">
                {v.note ? `— ${v.note}` : `(${v.from}–${v.to}: ${rangeNames(data, v.from, v.to)})`}
              </span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function rangeNames(data: StaticData, from: number, to: number) {
  const out: string[] = [];
  for (let n = from; n <= to; n++) out.push(data.hexagram(n).nameVi);
  return out.join(', ');
}
