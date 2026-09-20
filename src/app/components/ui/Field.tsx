import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** Etiqueta + ayuda + campo. Úsalo con <input className="input" /> o <textarea className="input" />. */
export default function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {hint && <small className="field__hint">{hint}</small>}
      {children}
    </label>
  );
}