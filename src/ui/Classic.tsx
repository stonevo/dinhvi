import { useCommentary } from '../data/load';
import { t } from '../i18n';
import { lineStructure } from '../lib/structure';
import type { CommentaryPart, Hexagram } from '../types/schema';

/** Cấu trúc hào (tự tính từ hình quẻ): chính/trung, ứng, quan hệ hào kề, ý nghĩa vị trí. */
export function LineStructureNote({ binary, position }: { binary: string; position: number }) {
  const s = lineStructure(binary, position);
  const kind = (yang: boolean) => t(yang ? 'structure.yang' : 'structure.yin');
  const items = [
    t(`structure.${s.correct ? 'correct' : 'incorrect'}.${s.yang ? 'yang' : 'yin'}` as 'structure.correct.yang'),
    s.central && t(`structure.central.${s.trigram}` as 'structure.central.lower'),
    t(s.resonates ? 'structure.resonates' : 'structure.noResonance', { p: s.partner, kind: kind(s.partnerYang) }),
    s.ridesYang && t('structure.rides', { p: position - 1 }),
    s.supportsYang && t('structure.supports', { p: position + 1 }),
    t(`structure.pos.${position}` as 'structure.pos.1'),
  ].filter(Boolean) as string[];
  return (
    <section className="reading-section">
      <h4>{t('classic.structure')}</h4>
      <ul className="structure-list">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="reading-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function Han({ text }: { text: string }) {
  return (
    <p className="han-text" lang="zh-Hant">
      {text}
    </p>
  );
}

/** Tượng, giảng, ý các nhà chú giải của một lời (quẻ hoặc hào). */
function PartRest({ part, imageLabel }: { part: CommentaryPart; imageLabel: string }) {
  return (
    <>
      <Section title={imageLabel}>
        <Han text={part.imageHan} />
        {part.image && <p>{part.image}</p>}
      </Section>
      {part.explain && (
        <Section title={t('classic.explain')}>
          <p>{part.explain}</p>
        </Section>
      )}
      {part.views.length > 0 && (
        <Section title={t('classic.views')}>
          {part.views.map((v) => (
            <p key={v.source}>
              <strong>{v.source}:</strong> {v.text}
            </p>
          ))}
        </Section>
      )}
    </>
  );
}

/** Lời quẻ: dịch nghĩa, Thoán truyện, Đại tượng, giảng, các nhà chú giải. */
export function JudgmentClassic({ hexagram }: { hexagram: Hexagram }) {
  const c = useCommentary(hexagram.kingWenNumber);
  if (!c) return null;
  const j = c.judgment;
  return (
    <details className="classic">
      <summary>{t('classic.toggle')}</summary>
      {j.literal && (
        <Section title={t('classic.literal')}>
          <p>{j.literal}</p>
        </Section>
      )}
      <Section title={t('classic.tuan')}>
        <Han text={j.tuanHan} />
        {j.tuan && <p>{j.tuan}</p>}
      </Section>
      <PartRest part={j} imageLabel={t('classic.bigImage')} />
    </details>
  );
}

/** Văn ngôn (Càn, Khôn): từng đoạn chữ Hán, bản dịch, giảng, ý các nhà chú giải. */
export function WenyanClassic({ hexagram }: { hexagram: Hexagram }) {
  const c = useCommentary(hexagram.kingWenNumber);
  if (!c?.wenyan) return null;
  return (
    <section>
      <h2>{t('classic.wenyan')}</h2>
      <p className="muted small">{t('classic.wenyanIntro')}</p>
      {c.wenyan.map((w, i) => (
        <details key={i} className="classic">
          <summary>{w.title || w.han.slice(0, 16)}</summary>
          <Han text={w.han} />
          {w.vi && <p>{w.vi}</p>}
          {w.explain && (
            <Section title={t('classic.explain')}>
              <p>{w.explain}</p>
            </Section>
          )}
          {w.views.length > 0 && (
            <Section title={t('classic.views')}>
              {w.views.map((v) => (
                <p key={v.source}>
                  <strong>{v.source}:</strong> {v.text}
                </p>
              ))}
            </Section>
          )}
        </details>
      ))}
    </section>
  );
}

/** Một hào (hoặc Dụng cửu/Dụng lục khi position = 7): dịch nghĩa, cấu trúc, Tiểu tượng, giảng. */
export function LineClassic({ hexagram, position }: { hexagram: Hexagram; position: number }) {
  const c = useCommentary(hexagram.kingWenNumber);
  const part = c && (position === 7 ? c.allMoving : c.lines[position - 1]);
  return (
    <details className="classic">
      <summary>{t('classic.toggle')}</summary>
      {part?.literal && (
        <Section title={t('classic.literal')}>
          <p>{part.literal}</p>
        </Section>
      )}
      {position <= 6 && <LineStructureNote binary={hexagram.binary} position={position} />}
      {part && <PartRest part={part} imageLabel={t('classic.smallImage')} />}
    </details>
  );
}
