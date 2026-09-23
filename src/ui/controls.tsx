import { useId, type ReactNode } from 'react';
import type { Hexagram } from '../types/schema';
import { fullHexagramName } from '../data/names';
import { t } from '../i18n';

/** Nhóm lựa chọn một-trong-nhiều, hiển thị như các nút/thẻ. Không có mặc định. */
export function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  layout = 'row',
}: {
  label?: ReactNode;
  options: { value: T; label: ReactNode; detail?: ReactNode }[];
  value: T | undefined | null;
  onChange: (v: T) => void;
  layout?: 'row' | 'column' | 'grid';
}) {
  const name = useId();
  return (
    <fieldset className="choice-group">
      {label && <legend>{label}</legend>}
      <div className={`choices choices-${layout}`}>
        {options.map((o) => (
          <label key={String(o.value)} className={`choice${value === o.value ? ' selected' : ''}`}>
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="choice-label">{o.label}</span>
            {o.detail && <span className="choice-detail">{o.detail}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label?: ReactNode;
  value: string | undefined;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <textarea id={id} rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: ReactNode;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} type="text" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function hexagramOptionLabel(h: Hexagram): string {
  return `${h.kingWenNumber}. ${h.nameHanViet} — ${fullHexagramName(h)}`;
}

/**
 * Chọn quẻ + hào bằng tay. Không có giá trị mặc định do app đặt: người dùng
 * tự chọn, trừ khi màn hình truyền vào giá trị đã có của chính người dùng.
 */
export function HexagramLinePicker({
  hexagrams,
  hexagram,
  line,
  onChange,
  allowUnknown,
  label,
}: {
  hexagrams: Hexagram[];
  hexagram: number | null | undefined;
  line: number | null | undefined;
  onChange: (hexagram: number | null, line: number | null) => void;
  allowUnknown?: boolean;
  label?: ReactNode;
}) {
  const hexId = useId();
  const lineId = useId();
  return (
    <fieldset className="picker">
      {label && <legend>{label}</legend>}
      <div className="picker-row">
        <select
          id={hexId}
          aria-label="Quẻ"
          value={hexagram ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null, line ?? null)}
        >
          <option value="">{allowUnknown ? t('hindsight.unknownHex') : t('common.choose')}</option>
          {hexagrams.map((h) => (
            <option key={h.kingWenNumber} value={h.kingWenNumber}>
              {hexagramOptionLabel(h)}
            </option>
          ))}
        </select>
        <select
          id={lineId}
          aria-label="Hào"
          value={line ?? ''}
          onChange={(e) => onChange(hexagram ?? null, e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{allowUnknown ? t('hindsight.unknownHex') : t('common.choose')}</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {t('line.n', { n })}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
