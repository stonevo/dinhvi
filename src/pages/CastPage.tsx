import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { useStaticData, type StaticData } from '../data/load';
import { t } from '../i18n';
import { newId } from '../lib/id';
import { castFocus, readCast, type CastReading, type LineValue } from '../lib/cast';
import { CastBoard, CastSummary } from '../ui/CastBoard';
import { LineReading } from '../ui/LineReading';
import { TextArea, TextInput } from '../ui/controls';
import type { CastRecord } from '../types/schema';

/** Mục "Gieo quẻ": gieo ba đồng xu, xem quẻ chính / hào động / quẻ biến, lưu riêng. */
export function CastPage() {
  const { data } = useStaticData();
  const q = useLiveQuery(async () => {
    const { activeProfileId } = await getSettings(db);
    const casts = await db.casts.where('profileId').equals(activeProfileId).sortBy('createdAt');
    return { profileId: activeProfileId, history: casts.reverse() };
  });
  const history = q?.history;
  const [lines, setLines] = useState<LineValue[]>([]);
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);

  if (!data || !history) return <p className="muted">{t('common.loading')}</p>;

  const reading = lines.length === 6 ? readCast(lines) : null;
  const viewed = history.find((c) => c.id === viewing);

  async function save() {
    if (!reading) return;
    const record: CastRecord = {
      id: newId(),
      profileId: q!.profileId,
      createdAt: new Date().toISOString(),
      question: question.trim(),
      lines,
      ...reading,
      notes: notes.trim(),
    };
    await db.casts.add(record);
    setLines([]);
    setQuestion('');
    setNotes('');
    setViewing(record.id);
  }

  return (
    <div className="stack">
      <h1>{t('nav.cast')}</h1>
      <p className="muted">{t('cast.intro')}</p>

      <TextInput label={t('cast.question')} value={question} onChange={setQuestion} />
      <CastBoard lines={lines} onChange={setLines} data={data} />
      {reading && (
        <>
          <CastReadingView reading={reading} question={question.trim()} data={data} />
          <TextArea label={t(question.trim() ? 'cast.notesQ' : 'cast.notes')} rows={2} value={notes} onChange={setNotes} />
          <div className="row">
            <button type="button" className="primary" onClick={save}>
              {t('cast.save')}
            </button>
          </div>
        </>
      )}

      {viewed && (
        <section className="card">
          <p className="muted small">
            {new Date(viewed.createdAt).toLocaleString('vi-VN')}
            {viewed.question && <> · {viewed.question}</>}
          </p>
          <CastSummary reading={viewed} data={data} />
          <CastReadingView reading={viewed} question={viewed.question} data={data} />
          {viewed.notes && <p>{viewed.notes}</p>}
        </section>
      )}

      <h2>{t('cast.history')}</h2>
      {history.length === 0 ? (
        <p className="muted">{t('cast.empty')}</p>
      ) : (
        <ul className="domain-list">
          {history.map((c) => (
            <li key={c.id} className="domain">
              <span className="domain-name">
                {data.hexagram(c.primary).nameHanViet}
                {c.transformed && <> → {data.hexagram(c.transformed).nameHanViet}</>}
                <span className="muted small"> · {c.question || new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
              </span>
              <span className="domain-status">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
              <button type="button" className="link" onClick={() => setViewing(viewing === c.id ? null : c.id)}>
                {t('cast.view')}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  if (window.confirm(t('cast.delete.confirm'))) void db.casts.delete(c.id);
                }}
              >
                {t('cast.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CastReadingView({ reading, question, data }: { reading: CastReading; question: string; data: StaticData }) {
  const focus = castFocus(reading);
  const p = data.hexagram(reading.primary);
  const tr = reading.transformed ? data.hexagram(reading.transformed) : null;
  const n = reading.moving.length;
  const rule = t(`cast.focus.rule.${n}` as 'cast.focus.rule.0');

  return (
    <section className="stack">
      <div className="card cast-focus stack">
        <p className="small-caps">{t('cast.focus.title')}</p>
        {question && <blockquote className="cast-question">{question}</blockquote>}
        <p className="muted small">{n === 6 && focus.kind === 'allMoving' ? t('cast.focus.rule.6all') : rule}</p>

        {focus.kind === 'judgment' &&
          focus.hexagrams.map((num) => {
            const h = data.hexagram(num);
            return (
              <div key={num}>
                <h4>
                  {t('cast.focus.judgmentOf', { name: h.nameHanViet })}
                </h4>
                <p className="han-text" lang="zh-Hant">{h.judgmentHan}</p>
                <p>{h.judgment}</p>
              </div>
            );
          })}

        {focus.kind === 'lines' && (
          <>
            {focus.lines
              .slice()
              .sort((a, b) => (a === focus.main ? -1 : b === focus.main ? 1 : 0))
              .map((pos) => (
                <div key={pos}>
                  <h4>
                    {t('cast.focus.lineOf', { n: pos, name: data.hexagram(focus.hexagram).nameHanViet })}
                    {focus.lines.length > 1 && pos === focus.main && <span className="muted small"> · {t('cast.focus.main')}</span>}
                  </h4>
                  <LineReading hexagram={data.hexagram(focus.hexagram)} position={pos} lineTiers={data.lineTiers} compact={pos !== focus.main} />
                </div>
              ))}
          </>
        )}

        {focus.kind === 'allMoving' && p.allMoving && (
          <div>
            <h4>{t(p.kingWenNumber === 1 ? 'cast.useNine' : 'cast.useSix')}</h4>
            <p className="original">{p.allMoving.original}</p>
            <p className="han-text" lang="zh-Hant">{p.allMoving.originalHan}</p>
            <p>{p.allMoving.situation}</p>
            <p className="muted">{p.allMoving.commonFailure}</p>
            <p className="muted small">{p.allMoving.traditionalCounsel}</p>
            <ul>
              {p.allMoving.reflectionQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="reading-section">
          <h4>{t('cast.focus.bridge')}</h4>
          <ul>
            <li>{t('cast.focus.now', { theme: p.theme })}</li>
            {tr && <li>{t('cast.focus.toward', { theme: tr.theme })}</li>}
            <li>{t(question ? 'cast.focus.q1' : 'cast.focus.q1NoQ')}</li>
            <li>{t('cast.focus.q2')}</li>
            <li>{t('cast.focus.q3')}</li>
          </ul>
        </div>
      </div>

      <details>
        <summary>{t('cast.focus.all')}</summary>
        <div className="stack">
          <p className="han-text" lang="zh-Hant">{p.judgmentHan}</p>
          <p className="muted">{p.judgment}</p>
          {reading.moving.map((pos) => (
            <div key={pos} className="card">
              <h4>{t('line.n', { n: pos })}</h4>
              <LineReading hexagram={p} position={pos} lineTiers={data.lineTiers} compact />
            </div>
          ))}
          {tr && (
            <>
              <h4>{t('cast.focus.judgmentOf', { name: tr.nameHanViet })}</h4>
              <p className="han-text" lang="zh-Hant">{tr.judgmentHan}</p>
              <p className="muted">{tr.judgment}</p>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
