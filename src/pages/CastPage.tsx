import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { useStaticData } from '../data/load';
import { t } from '../i18n';
import { newId } from '../lib/id';
import { readCast, type LineValue } from '../lib/cast';
import { addDays, vnDateString } from '../lib/castLog';
import type { MeihuaCast } from '../lib/meihua';
import { CAST_METHODS, type CastMethod, type CastRecord } from '../types/schema';
import { TextArea } from '../ui/controls';
import { CastHistory } from '../cast/CastHistory';
import { CastResult, type CastView } from '../cast/CastResult';
import { MeihuaCaster, linesFromMeihua, type MeihuaMethodKey } from '../cast/meihua';
import { AskStep, CalmStep, CoinsCaster, ManualCaster, type AskDraft } from '../cast/steps';
import { Formed, RitualShell } from '../cast/Ritual';

type Stage = 'ask' | 'calm' | 'cast' | 'formed' | 'result';

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
  const [params] = useSearchParams();
  const fromMenu = params.get('m');
  const pickedMethod = (CAST_METHODS as readonly string[]).includes(fromMenu ?? '') ? (fromMenu as CastMethod) : null;
  const [stage, setStage] = useState<Stage>('ask');
  const [view, setView] = useState<CastView | null>(null);
  const [notes, setNotes] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);
  const [draft, setDraft] = useState<AskDraft>(() => (pickedMethod ? { ...NEW_DRAFT, method: pickedMethod } : NEW_DRAFT));

  // "Lịch sử và đối chiếu" trên menu: cuộn tới phần lịch sử.
  const { hash } = useLocation();
  const loaded = Boolean(q && data);
  useEffect(() => {
    if (hash === '#history' && loaded) document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, loaded]);

  // Chọn một cách lập quẻ từ menu: quay về bước hỏi, giữ câu hỏi đang gõ, đổi cách lập quẻ.
  useEffect(() => {
    if (!pickedMethod) return;
    setStage('ask');
    setView(null);
    setDraft((d) => ({ ...d, method: pickedMethod }));
  }, [pickedMethod]);

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
    setStage('formed');
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
      {(stage === 'calm' || stage === 'cast' || stage === 'formed') && (
        <RitualShell question={draft.question} onExit={restart}>
          {stage === 'calm' && <CalmStep sound={settings.castSound ?? true} onDone={() => setStage('cast')} />}
          {stage === 'cast' && draft.method === 'coins' && <CoinsCaster sound={settings.castSound ?? true} onDone={(lines) => finish(lines)} />}
          {stage === 'cast' && draft.method === 'coins-manual' && <ManualCaster onDone={(lines) => finish(lines)} />}
          {stage === 'cast' && draft.method.startsWith('meihua') && (
            <div className="ritual-form">
              <MeihuaCaster
                method={draft.method as MeihuaMethodKey}
                ziStartsNextDay={settings.ziStartsNextDay ?? true}
                onDone={({ cast, at, input }) => finish(linesFromMeihua(cast), { at, input, meihua: cast })}
              />
            </div>
          )}
          {stage === 'formed' && view && <Formed lines={view.lines} data={data} sound={settings.castSound ?? true} onView={() => setStage('result')} />}
        </RitualShell>
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

      {stage === 'ask' && (
        <div id="history">
          <CastHistory history={history} data={data} viewing={viewing} onView={setViewing} />
        </div>
      )}
    </div>
  );
}
