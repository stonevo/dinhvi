import { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { t } from '../i18n';
import { decodeAnswer, requestUrl, type WitnessAnswer } from '../lib/witness-link';

/** Bước 7: tạo link + QR gửi nhân chứng, rồi dán mã trả lời họ gửi lại. */
export function WitnessLinkBox({ topic, onAnswer }: { topic: string; onAnswer: (a: WitnessAnswer) => void }) {
  const [asker, setAsker] = useState('');
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState(false);

  const url = useMemo(() => requestUrl(window.location.href, { asker, topic }), [asker, topic]);
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [url]);
  const isLocal = /^(localhost|127\.|\[::1\])/.test(window.location.hostname);

  async function share() {
    if (navigator.share) await navigator.share({ text: t('witnessLink.shareText'), url }).catch(() => undefined);
    else await navigator.clipboard.writeText(url);
  }

  function apply() {
    const a = decodeAnswer(pasted);
    setError(!a);
    if (a) {
      onAnswer(a);
      setPasted('');
    }
  }

  return (
    <section className="card stack">
      <h3 className="small-caps">{t('witnessLink.title')}</h3>
      {!open ? (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            {t('witnessLink.create')}
          </button>
        </div>
      ) : (
        <>
          <label className="field">
            <span className="small">{t('witnessLink.asker')}</span>
            <input value={asker} onChange={(e) => setAsker(e.target.value)} />
          </label>
          <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="code-box small">{url}</p>
          <div className="row">
            <button type="button" onClick={share}>
              {t('witnessLink.share')}
            </button>
          </div>
          {isLocal && <p className="soft-warn">{t('witnessLink.localWarn')}</p>}
        </>
      )}
      <label className="field">
        <span className="small">{t('witnessLink.paste')}</span>
        <input value={pasted} placeholder="DV1-…" onChange={(e) => setPasted(e.target.value)} />
      </label>
      <div className="row">
        <button type="button" disabled={!pasted.trim()} onClick={apply}>
          {t('witnessLink.apply')}
        </button>
      </div>
      {error && <p className="soft-warn">{t('witnessLink.badCode')}</p>}
    </section>
  );
}
