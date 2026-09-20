'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  /** 'center' = ventana centrada · 'right' = panel lateral (carrito) */
  side?: 'center' | 'right';
  children: ReactNode;
}

export default function Modal({ title, onClose, side = 'center', children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className={`overlay${side === 'right' ? ' overlay--right' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={side === 'right' ? 'drawer' : 'modal'} role="dialog" aria-modal="true" aria-label={title}>
        <div className="panel-head">
          <h2>{title}</h2>
          <button type="button" className="x-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}