import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDiagrams, useStaticData, type StaticData } from '../data/load';
import { t } from '../i18n';
import type { DiagramSection } from '../types/schema';
import { BaguaWheel, BinaryTable, FuxiCircle, FuxiSquare, HeTu, LuoShu } from '../ui/Diagrams';
import { Block } from './IntroPage';

function Figure({ s, data }: { s: DiagramSection; data: StaticData }) {
  switch (s.figure) {
    case 'xiantian':
    case 'houtian':
      return <BaguaWheel kind={s.figure} data={data} />;
    case 'fuxi-circle':
      return <FuxiCircle data={data} />;
    case 'fuxi-square':
      return <FuxiSquare data={data} />;
    case 'hetu':
      return <HeTu />;
    case 'luoshu':
      return <LuoShu />;
    case 'binary':
      return <BinaryTable data={data} />;
  }
}

/** Đồ hình: bát quái Tiên thiên / Hậu thiên, 64 quẻ Phục Hy, Hà đồ, Lạc thư, nhị phân. `?s=id` mở ngay mục. */
export function DiagramsPage() {
  const sections = useDiagrams();
  const { data } = useStaticData();
  const [search] = useSearchParams();
  const target = search.get('s');
  useEffect(() => {
    if (sections && data && target) document.getElementById(`dg-${target}`)?.scrollIntoView();
  }, [sections, data, target]);
  if (!sections || !data) return <p className="muted">{t('common.loading')}</p>;
  return (
    <div className="stack intro">
      <h1>{t('diagrams.title')}</h1>
      <p className="lead">{t('diagrams.lead')}</p>
      <nav className="tw-toc small" aria-label={t('diagrams.title')}>
        {sections.map((s) => (
          <button key={s.id} type="button" className="link" onClick={() => document.getElementById(`dg-${s.id}`)?.scrollIntoView({ behavior: 'smooth' })}>
            {s.title}
          </button>
        ))}
      </nav>
      {sections.map((s) => (
        <section key={s.id} id={`dg-${s.id}`} className="stack tw-chapter">
          <h2>{s.title}</h2>
          <p className="muted">{s.summary}</p>
          <figure className="diagram-wrap">
            <Figure s={s} data={data} />
          </figure>
          {s.blocks.map((b, k) => (
            <Block key={k} b={b} sub />
          ))}
          <ul className="small muted">
            {s.sources.map((src) => (
              <li key={src.label}>
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noreferrer">
                    {src.label}
                  </a>
                ) : (
                  src.label
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
