import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { newId } from '../lib/id';
import { readCast, type LineValue } from '../lib/cast';
import { addDays, vnDateString } from '../lib/castLog';
import type { MeihuaCast } from '../lib/meihua';
import type { CastRecord } from '../types/schema';
import { TextArea } from '../ui/controls';
import { CastHistory } from '../cast/CastHistory';
import { CastResult, type CastView } from '../cast/CastResult';
import { MeihuaCaster, linesFromMeihua, type MeihuaMethodKey } from '../cast/meihua';
import { AskStep, CalmStep, CoinsCaster, ManualCaster, type AskDraft } from '../cast/steps';

type Stage = 'ask' | 'calm' | 'cast' | 'result';

const NEW_DRAFT: AskDraft = { question: '', method: 'coins', checkInDays: 30 };

/**
 * Mục "Gieo quẻ": câu hỏi và ngữ cảnh trước → tĩnh tâm → lập quẻ (xu máy, xu thật
 * nhập tay, Mai Hoa theo giờ / số / chữ) → kết quả (Kinh văn, Lục Hào, Mai Hoa) →
 * lưu kèm ngày đối chiếu. Lịch sử và đối chiếu ở dưới.
 */
export function CastPage() {
  const { data } = useStaticData();
  const q = useLiveQuery(async () => {
    const settings = await getSettings(db);
    const casts = await db.casts.where('profileId').equals(settings.activeProfileId).sortBy('createdAt');
    return { settings, history: casts.reverse() };
  });
  const [stage, setStage] = useState<Stage>('ask');
  const [draft, setDraft] = useState<AskDraft>(NEW_DRAFT);
  const [view, setView] = useState<CastView | null>(null);
  const [notes, setNotes] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);

  if (!data || !q) return <p className="muted">{t('common.loading')}</p>;
  const { settings, history } = q;
  const viewed = history.find((c) => c.id === viewing);

  function finish(lines: LineValue[], extra: { at?: Date; input?: string; meihua?: MeihuaCast } = {}) {
    setView({
      lines,
      at: extra.at ?? new Date(),
      question: draft.question.trim(),
      context: draft.context,
      method: draft.method,
      methodInput: extra.input,
      askerGender: draft.gender,
      meihua: extra.meihua,
    });
    setStage('result');
  }

  async function save() {
    if (!view) return;
    const reading = readCast(view.lines);
    const record: CastRecord = {
      id: newId(),
      profileId: settings.activeProfileId,
      createdAt: view.at.toISOString(),
      question: view.question,
      lines: view.lines,
      ...reading,
      notes: notes.trim(),
      context: view.context,
      method: view.method,
      methodInput: view.methodInput,
      askerGender: view.askerGender,
      checkOn: draft.checkInDays ? addDays(vnDateString(view.at), draft.checkInDays) : undefined,
    };
    await db.casts.add(record);
    restart();
    setViewing(record.id);
  }

  function restart() {
    setStage('ask');
    setDraft(NEW_DRAFT);
    setView(null);
    setNotes('');
  }

  return (
    <div className="stack">
      <h1>{t('nav.cast')}</h1>
      {stage === 'ask' && <p className="muted">{t('ritual.intro')}</p>}

      {stage === 'ask' && <AskStep draft={draft} onChange={setDraft} onNext={() => setStage('calm')} />}
      {stage === 'calm' && <CalmStep question={draft.question} onDone={() => setStage('cast')} />}
      {stage === 'cast' && (
        <>
          <blockquote className="cast-question">{draft.question}</blockquote>
          {draft.method === 'coins' && <CoinsCaster sound={settings.castSound ?? true} onDone={(lines) => finish(lines)} />}
          {draft.method === 'coins-manual' && <ManualCaster onDone={(lines) => finish(lines)} />}
          {draft.method.startsWith('meihua') && (
            <MeihuaCaster
              method={draft.method as MeihuaMethodKey}
              ziStartsNextDay={settings.ziStartsNextDay ?? true}
              onDone={({ cast, at, input }) => finish(linesFromMeihua(cast), { at, input, meihua: cast })}
            />
          )}
          <div className="row">
            <button type="button" className="link" onClick={restart}>
              {t('ritual.cancel')}
            </button>
          </div>
        </>
      )}
      {stage === 'result' && view && (
        <>
          <CastResult view={view} data={data} ziStartsNextDay={settings.ziStartsNextDay ?? true} />
          <TextArea label={t(view.question ? 'cast.notesQ' : 'cast.notes')} rows={2} value={notes} onChange={setNotes} />
          <p className="small muted">
            {draft.checkInDays ? t('log.willCheck', { date: new Date(`${addDays(vnDateString(view.at), draft.checkInDays)}T00:00:00`).toLocaleDateString('vi-VN') }) : t('ritual.checkIn.none')}
          </p>
          <div className="row">
            <button type="button" className="primary" onClick={save}>
              {t('cast.save')}
            </button>
            <button type="button" onClick={restart}>
              {t('ritual.discard')}
            </button>
          </div>
        </>
      )}

      {viewed && stage === 'ask' && (
        <section className="card stack">
          <CastResult
            view={{
              lines: viewed.lines,
              at: new Date(viewed.createdAt),
              question: viewed.question,
              context: viewed.context,
              method: viewed.method ?? 'coins',
              methodInput: viewed.methodInput,
              askerGender: viewed.askerGender,
            }}
            data={data}
            ziStartsNextDay={settings.ziStartsNextDay ?? true}
          />
          {viewed.notes && <p>{viewed.notes}</p>}
        </section>
      )}

      {stage === 'ask' && <CastHistory history={history} data={data} viewing={viewing} onView={setViewing} />}
    </div>
  );
}
