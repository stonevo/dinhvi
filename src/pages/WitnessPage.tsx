import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { t } from '../i18n';
import { WITNESS_STAGES } from '../types/schema';
import { decodeRequest, encodeAnswer } from '../lib/witness-link';
import { ChoiceGroup, TextArea, TextInput } from '../ui/controls';

type Stage = (typeof WITNESS_STAGES)[number];

/**
 * Trang nhân chứng mở từ đường link: một câu hỏi, một lựa chọn, ra một mã trả
 * lời để gửi lại. Không lưu gì trên máy nhân chứng, không gửi dữ liệu đi đâu.
 */
export function WitnessPage() {
  const [params] = useSearchParams();
  const req = decodeRequest(params.get('r') ?? '');
  const [who, setWho] = useState('');
  const [stage, setStage] = useState<Stage | undefined>();
  const [note, setNote] = useState('');
  const [code, setCode] = useState<string | null>(null);

  if (!req) return <p className="warning">{t('witness.badLink')}</p>;

  function makeCode() {
    if (!stage) return;
    setCode(encodeAnswer({ who, stage, note, at: new Date().toISOString() }));
  }

  async function shareCode() {
    if (!code) return;
    if (navigator.share) await navigator.share({ text: code }).catch(() => undefined);
    else await navigator.clipboard.writeText(code);
  }

  return (
    <div className="stack witness-page">
      <h1>{t('app.name')}</h1>
      <p className="lead">
        {req.asker ? t('witness.askedBy', { asker: req.asker }) : t('witness.askedAnon')}
        {req.topic && <> {t('witness.about', { topic: req.topic })}</>}
      </p>
      <p className="note">{t('witness.question')}</p>
      <p className="muted small">{t('witness.noKnowledge')}</p>

      <ChoiceGroup
        label={t('witness.stageLabel')}
        layout="column"
        options={WITNESS_STAGES.map((s) => ({ value: s, label: t(`witness.${s}`) }))}
        value={stage}
        onChange={setStage}
      />
      <TextInput label={t('witness.yourName')} value={who} onChange={setWho} />
      <TextArea label={t('witness.yourNote')} rows={2} value={note} onChange={setNote} />
      <div className="row">
        <button type="button" className="primary" disabled={!stage} onClick={makeCode}>
          {t('witness.makeCode')}
        </button>
      </div>

      {code && (
        <section className="card">
          <p>{t('witness.sendBack')}</p>
          <p className="code-box" aria-label={t('witness.code')}>
            {code}
          </p>
          <div className="row">
            <button type="button" onClick={shareCode}>
              {t('witness.shareCode')}
            </button>
          </div>
        </section>
      )}
      <p className="muted small">{t('witness.privacy')}</p>
    </div>
  );
}
