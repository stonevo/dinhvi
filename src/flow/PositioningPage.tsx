import { useEffect, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { savePositioning } from '../db/positionings';
import { useStaticData, type StaticData } from '../data/load';
import { t } from '../i18n';
import { newId } from '../lib/id';
import { formatPeriod, periodOf } from '../lib/period';
import { unreviewedBefore } from '../lib/status';
import { STEP_COUNT, finalizeDraft, furthestAllowedStep, stepComplete } from './draft';
import { HindsightForm } from './HindsightForm';
import { useDraft } from './useDraft';
import type { StepProps } from './steps/types';
import { Step1Facts } from './steps/Step1Facts';
import { Step2Trigrams } from './steps/Step2Trigrams';
import { Step3Sequence } from './steps/Step3Sequence';
import { Step4Line } from './steps/Step4Line';
import { Step5Reading } from './steps/Step5Reading';
import { Step6Critic } from './steps/Step6Critic';
import { Step7Witness } from './steps/Step7Witness';
import { Step8Conclusion } from './steps/Step8Conclusion';

const STEPS: Record<number, ComponentType<StepProps>> = {
  1: Step1Facts, 2: Step2Trigrams, 3: Step3Sequence, 4: Step4Line,
  5: Step5Reading, 6: Step6Critic, 7: Step7Witness, 8: Step8Conclusion,
};

export function PositioningPage() {
  const { domainId = '' } = useParams();
  const { data, error } = useStaticData();
  const q = useLiveQuery(async () => {
    const [domain, settings, positionings] = await Promise.all([
      db.domains.get(domainId),
      getSettings(db),
      db.positionings.where('domainId').equals(domainId).toArray(),
    ]);
    return { domain, settings, positionings };
  }, [domainId]);

  if (error) return <p className="warning">{t('common.error', { message: error })}</p>;
  if (!q || !data) return <p className="muted">{t('common.loading')}</p>;
  if (!q.domain) return <p>{t('flow.notFound')}</p>;

  const period = periodOf(new Date(), q.settings.cycle);
  const existing = q.positionings.find((p) => p.period === period);
  if (existing)
    return (
      <p>
        {t('flow.alreadyDone', { period: formatPeriod(period) })} <Link to={`/record/${existing.id}`}>{t('home.action.view')}</Link>
      </p>
    );

  const pending = unreviewedBefore(domainId, period, q.positionings);
  if (pending) return <HindsightForm key={pending.id} record={pending} data={data} />;

  return <Flow domainId={domainId} domainName={q.domain.name} period={period} data={data} />;
}

function Flow({ domainId, domainName, period, data }: { domainId: string; domainName: string; period: string; data: StaticData }) {
  const draft = useDraft(domainId, period);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [draft.step]);

  if (!draft.loaded) return <p className="muted">{t('common.loading')}</p>;

  const Step = STEPS[draft.step];
  const allowed = furthestAllowedStep(draft.data);
  const complete = stepComplete(draft.step, draft.data);

  async function save() {
    try {
      const p = finalizeDraft(draft.data, { id: newId(), domainId, period, createdAt: new Date().toISOString() });
      draft.discard();
      await savePositioning(db, p);
      navigate(`/record/${p.id}`, { replace: true });
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  return (
    <div className="flow">
      <p className="muted small">
        {domainName} · {formatPeriod(period)}
      </p>
      <nav className="steps" aria-label="Các bước">
        {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            type="button"
            className={s === draft.step ? 'current' : ''}
            disabled={s > allowed}
            aria-current={s === draft.step ? 'step' : undefined}
            aria-label={`${s}. ${t(`flow.stepName.${s}` as 'flow.stepName.1')}`}
            onClick={() => draft.setStep(s)}
          >
            <span className="step-n">{s}</span>
            <span className="step-name">{t(`flow.stepName.${s}` as 'flow.stepName.1')}</span>
          </button>
        ))}
      </nav>
      <h1 className="step-title">
        {t('flow.step', { n: draft.step })} — {t(`flow.stepName.${draft.step}` as 'flow.stepName.1')}
      </h1>

      <Step d={draft.data} set={draft.update} data={data} goTo={draft.setStep} />

      {error && <p className="warning">{t('common.error', { message: error })}</p>}
      <div className="flow-nav">
        <button type="button" disabled={draft.step === 1} onClick={() => draft.setStep(draft.step - 1)}>
          {t('common.back')}
        </button>
        <span className="muted small" aria-live="polite">
          {draft.savedAt ? t('flow.saved') : ''}
        </span>
        {draft.step < STEP_COUNT ? (
          <button type="button" className="primary" disabled={!complete} onClick={() => draft.setStep(draft.step + 1)}>
            {t('common.next')}
          </button>
        ) : (
          <button type="button" className="primary" disabled={!complete} onClick={save}>
            {t('step8.save')}
          </button>
        )}
      </div>
      {!complete && <p className="muted small right">{t('flow.incomplete')}</p>}
    </div>
  );
}
