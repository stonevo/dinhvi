import { Link } from 'react-router-dom';
import { useTenWings } from '../data/load';

/** Câu Tự quái và Tạp quái nói về quẻ `n`, kèm liên kết đọc cả thiên. */
export function HexTenWings({ n }: { n: number }) {
  const books = useTenWings();
  if (!books) return null;
  const found = (['tu-quai', 'tap-quai'] as const).flatMap((id) => {
    const b = books.find((x) => x.id === id);
    if (!b) return [];
    for (const ch of b.chapters) {
      const p = ch.paras.find((x) => x.hex?.includes(n));
      if (p) return [{ b, ch, p }];
    }
    return [];
  });
  if (!found.length) return null;
  return (
    <>
      {found.map(({ b, ch, p }) => (
        <div key={b.id} className="tw-inline">
          <h3 className="small-caps">
            <Link to={`/tenwings/${b.id}?c=${ch.n}`}>
              {b.title} <span className="han">{b.titleHan}</span>
            </Link>
          </h3>
          <p className="han-text" lang="zh-Hant">
            {p.han}
          </p>
          <p>{p.vi}</p>
          {p.note && <p className="intro-note small">{p.note}</p>}
        </div>
      ))}
    </>
  );
}
