import { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import type { ContextKey, Domain } from '../types/schema';

/** Tên lĩnh vực thường gặp ứng với từng ngữ cảnh câu hỏi (so không dấu, không phân biệt hoa thường). */
const CONTEXT_WORDS: Record<ContextKey, string[]> = {
  work: ['cong viec', 'su nghiep', 'nghe nghiep', 'viec lam', 'kinh doanh'],
  money: ['tai chinh', 'tien', 'dau tu'],
  health: ['suc khoe', 'the chat', 'benh'],
  love: ['tinh cam', 'tinh yeu', 'hon nhan', 'gia dinh', 'vo chong'],
  travel: ['di lai', 'noi o', 'tim kiem', 'di xa', 'du lich', 'xuat hanh', 'chuyen nha'],
};

const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();

/** Lĩnh vực hợp với ngữ cảnh câu hỏi nhất (hoặc undefined nếu không khớp tên nào). */
export function suggestDomain(domains: Domain[], context?: ContextKey): Domain | undefined {
  if (!context) return undefined;
  const words = CONTEXT_WORDS[context];
  return domains.find((d) => words.some((w) => fold(d.name).includes(w)));
}

/**
 * Sau khi gieo: mời chuyển sang tự định vị lĩnh vực liên quan kỳ này — cầu nối từ
 * việc hỏi quẻ sang vòng tự soi (nhìn sự thật, phản biện, nhìn lại).
 */
export function NextPositioning({ domains, context }: { domains: Domain[]; context?: ContextKey }) {
  const suggested = suggestDomain(domains, context);
  const [pick, setPick] = useState(suggested?.id ?? domains[0]?.id ?? '');
  if (!domains.length) return null;
  const chosen = domains.find((d) => d.id === pick) ?? domains[0];
  return (
    <section className="card stack next-positioning">
      <p className="small-caps">{t('next.title')}</p>
      <p>{t('next.body')}</p>
      <div className="row-inline">
        <label className="field">
          <span className="small muted">{t('next.domain')}</span>
          <select value={chosen.id} onChange={(e) => setPick(e.target.value)}>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.id === suggested?.id ? ` · ${t('next.suggested')}` : ''}
              </option>
            ))}
          </select>
        </label>
        <Link className="button primary" to={`/position/${chosen.id}`}>
          {t('next.go', { domain: chosen.name })}
        </Link>
      </div>
    </section>
  );
}
