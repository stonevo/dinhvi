import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { newId } from '../lib/id';
import { periodOf } from '../lib/period';
import { readCast, type LineValue } from '../lib/cast';
import { RitualCastBoard } from '../cast/RitualCastBoard';
import { ChoiceGroup, HexagramLinePicker, TextInput } from '../ui/controls';

/**
 * Ghi nhanh giữa các kỳ: một quẻ (chọn thẳng hoặc gieo), một hào, một dòng.
 * Lưu riêng, không đi qua các phép thử và không tính vào hiệu chỉnh.
 */
export function QuickNotePage() {
  const { domainId = '' } = useParams();
  const navigate = useNavigate();
  const { data } = useStaticData();
  const q = useLiveQuery(async () => ({ domain: await db.domains.get(domainId), settings: await getSettings(db) }), [domainId]);
  const [method, setMethod] = useState<'pick' | 'cast'>('pick');
  const [hexagram, setHexagram] = useState<number | null>(null);
  const [line, setLine] = useState<number | null>(null);
  const [castLines, setCastLines] = useState<LineValue[]>([]);
  const [note, setNote] = useState('');

  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;
  if (!q.domain) return <p>{t('flow.notFound')}</p>;

  const cast = method === 'cast' && castLines.length === 6 ? readCast(castLines) : null;
  const hex = method === 'cast' ? cast?.primary ?? null : hexagram;
  const ready = !!hex && !!line && note.trim().length > 0;

  async function save() {
    if (!ready) return;
    await db.quickNotes.add({
      id: newId(),
      domainId,
      createdAt: new Date().toISOString(),
      period: periodOf(new Date(), q!.settings.cycle),
      method,
      hexagram: hex!,
      line: line!,
      ...(method === 'cast' ? { castLines } : {}),
      note: note.trim(),
    });
    navigate('/');
  }

  return (
    <div className="stack">
      <h1>{t('quick.title', { domain: q.domain.name })}</h1>
      <p className="muted small">{t('quick.hint')}</p>
      <ChoiceGroup
        label={t('step2.method')}
        options={[
          { value: 'pick' as const, label: t('quick.pick') },
          { value: 'cast' as const, label: t('step2.method.cast') },
        ]}
        value={method}
        onChange={(v) => {
          setMethod(v);
          setLine(null);
        }}
      />
      {method === 'pick' ? (
        <HexagramLinePicker
          hexagrams={data.hexagrams}
          hexagram={hexagram}
          line={line}
          onChange={(h, l) => {
            setHexagram(h);
            setLine(l);
          }}
        />
      ) : (
        <>
          <RitualCastBoard lines={castLines} onChange={setCastLines} data={data} question={t('ritualBoard.quickQuestion', { domain: q.domain.name })} />
          {cast && (
            <label className="field">
              <span>{t('step4.choose')}</span>
              <select value={line ?? ''} onChange={(e) => setLine(e.target.value ? Number(e.target.value) : null)}>
                <option value="">{t('common.choose')}</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {t('line.n', { n })}
                    {cast.moving.includes(n) ? ` · ${t('quick.moving')}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
      {hex && line && (
        <p className="original">
          {data.hexagram(hex).nameHanViet} · {data.hexagram(hex).lines[line - 1].original}
        </p>
      )}
      <TextInput label={t('quick.note')} value={note} onChange={setNote} />
      <div className="row">
        <button type="button" className="primary" disabled={!ready} onClick={save}>
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
