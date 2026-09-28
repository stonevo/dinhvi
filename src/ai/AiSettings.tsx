import { useState } from 'react';
import { t } from '../i18n';
import { aiConfigured, aiEnabled, setAiEnabled } from './client';

/** Mục bật / tắt "Diễn giải bằng AI" trong Cài đặt (ẩn khi chưa có máy chủ AI). */
export function AiSettings() {
  const [on, setOn] = useState(aiEnabled);
  if (!aiConfigured()) return null;
  return (
    <section className="card stack">
      <h2>{t('ai.settings.title')}</h2>
      <p className="muted small">{t('ai.settings.intro')}</p>
      <p className="small warning">{t('ai.settings.privacy')}</p>
      <label className="row-inline">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setAiEnabled(e.target.checked);
            setOn(e.target.checked);
          }}
        />
        <span>{t('ai.settings.toggle')}</span>
      </label>
    </section>
  );
}
