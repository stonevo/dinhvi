import { useEffect, type ReactNode } from 'react';
import type { StaticData } from '../data/load';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';
import { isYang, readCast, type LineValue } from '../lib/cast';
import { playBell, vibrate } from '../lib/feedback';
import { BaguaRing } from '../ui/Taiji';

/**
 * Không gian nghi thức: toàn màn hình, nền đêm trầm có ánh nến, khói hương và vòng
 * Bát quái xoay chậm. Câu hỏi luôn hiện ở trên như lời khấn.
 */
export function RitualShell({ question, onExit, children }: { question: string; onExit: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add('in-ritual');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onExit();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('in-ritual');
      document.removeEventListener('keydown', onKey);
    };
  }, [onExit]);
  return (
    <div className="ritual" role="dialog" aria-modal="true" aria-label={t('ritual.space')}>
      <div className="ritual-glow" aria-hidden />
      <BaguaRing className="ritual-ring" size={560} />
      <div className="smoke" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <button type="button" className="ritual-exit" onClick={onExit} aria-label={t('ritual.exit')}>
        ✕
      </button>
      <div className="ritual-body">
        <p className="ritual-question">{question}</p>
        {children}
      </div>
    </div>
  );
}

/** Các hào đã thành, vạch vàng hiện dần từ dưới lên; hào động có chấm. */
export function RitualLines({ lines }: { lines: LineValue[] }) {
  return (
    <div className="ritual-lines" aria-label={t('ritual.linesSoFar', { n: lines.length })}>
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const v = lines[i];
        if (v === undefined) return <div key={i} className="r-line empty" />;
        return (
          <div key={i} className={'r-line ' + (isYang(v) ? 'yang' : 'yin') + (v === 6 || v === 9 ? ' moving' : '')}>
            <span />
            <span />
          </div>
        );
      })}
    </div>
  );
}

/** Quẻ đã thành: chuông ngân, quẻ sáng lên, rồi mời xem quẻ. */
export function Formed({ lines, data, sound, onView }: { lines: LineValue[]; data: StaticData; sound: boolean; onView: () => void }) {
  useEffect(() => {
    if (!sound) return;
    playBell();
    vibrate([40, 60, 120]);
  }, [sound]);
  const r = readCast(lines);
  const p = data.hexagram(r.primary);
  return (
    <section className="formed">
      <RitualLines lines={lines} />
      <p className="formed-title">{t('ritual.formed')}</p>
      <p className="formed-name">
        {fullHexagramName(p)} <span className="han">{p.nameHan}</span>
      </p>
      {r.transformed && <p className="formed-sub">{t('ritual.formedChange', { name: fullHexagramName(data.hexagram(r.transformed)) })}</p>}
      <button type="button" className="ritual-btn" onClick={onView} autoFocus>
        {t('ritual.viewReading')}
      </button>
    </section>
  );
}
