import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStaticData, type StaticData } from '../data/load';
import { t } from '../i18n';
import { newId } from '../lib/id';
import { readCast, type LineValue } from '../lib/cast';
import { CastBoard, CastSummary } from '../ui/CastBoard';
import { LineReading } from '../ui/LineReading';
import { TextArea, TextInput } from '../ui/controls';
import type { CastRecord } from '../types/schema';

/** Mục "Gieo quẻ": gieo ba đồng xu, xem quẻ chính / hào động / quẻ biến, lưu riêng. */
export function CastPage() {
  const { data } = useStaticData();
  const history = useLiveQuery(() => db.casts.orderBy('createdAt').reverse().toArray());
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
          <MovingLines reading={reading} data={data} />
          <TextArea label={t('cast.notes')} rows={2} value={notes} onChange={setNotes} />
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
          <MovingLines reading={viewed} data={data} />
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

function MovingLines({ reading, data }: { reading: { primary: number; moving: number[] }; data: StaticData }) {
  const h = data.hexagram(reading.primary);
  return (
    <section>
      <p className="muted">{h.judgment}</p>
      {reading.moving.length > 0 && (
        <>
          <h3 className="small-caps">{t('cast.movingLines')}</h3>
          {reading.moving.map((pos) => (
            <div key={pos} className="card">
              <h4>{t('line.n', { n: pos })}</h4>
              <LineReading hexagram={h} position={pos} lineTiers={data.lineTiers} compact />
            </div>
          ))}
        </>
      )}
    </section>
  );
}
