import { useId, useState } from 'react';
import { GLOSSARY, type GlossaryKey } from '../data/glossary';

/** Nút ⓘ cạnh thuật ngữ; bấm để mở/đóng giải thích ngắn ngay tại chỗ. */
export function Term({ k }: { k: GlossaryKey }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const g = GLOSSARY[k];
  return (
    <span className="term">
      <button
        type="button"
        className="term-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Giải thích: ${g.term}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        ⓘ
      </button>
      {open && (
        <span id={id} role="note" className="term-pop">
          <strong>{g.term}.</strong> {g.text}
        </span>
      )}
    </span>
  );
}
