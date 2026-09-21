'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category } from '@/lib/types';

interface CategoryDropdownProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}

export default function CategoryDropdown({ categories, value, onChange }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((category) => category.id === value);
  const parents = useMemo(() => categories.filter((category) => !category.parentId), [categories]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (!categories.length) return null;

  return (
    <div className="category-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`category-dropdown__trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="category-dropdown__selected-image">
          {selected?.imageUrl ? <img src={selected.imageUrl} alt="" /> : <span aria-hidden="true">⌘</span>}
        </span>
        <span className="category-dropdown__selected-text">
          <small>CATEGORÍA</small>
          <strong>{selected?.name ?? 'Todas las categorías'}</strong>
        </span>
        <span className="category-dropdown__chevron" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <>
          <button type="button" className="category-dropdown__backdrop" aria-label="Cerrar categorías" onClick={() => setOpen(false)} />
          <div className="category-dropdown__menu" role="listbox" aria-label="Seleccionar categoría">
            <button type="button" className={`category-option${!value ? ' is-selected' : ''}`} onClick={() => { onChange(''); setOpen(false); }}>
              <span className="category-option__image category-option__image--all">⌘</span>
              <span>Todas las categorías</span>
            </button>
            {parents.map((parent) => {
              const children = categories.filter((category) => category.parentId === parent.id);
              return (
                <div className="category-group" key={parent.id}>
                  <button type="button" className={`category-option${value === parent.id ? ' is-selected' : ''}`} onClick={() => { onChange(parent.id); setOpen(false); }}>
                    <span className="category-option__image">{parent.imageUrl ? <img src={parent.imageUrl} alt="" /> : '◈'}</span>
                    <strong>{parent.name}</strong>
                  </button>
                  {children.map((child) => (
                    <button type="button" className={`category-option category-option--child${value === child.id ? ' is-selected' : ''}`} key={child.id} onClick={() => { onChange(child.id); setOpen(false); }}>
                      <span className="category-option__image">{child.imageUrl ? <img src={child.imageUrl} alt="" /> : '◈'}</span>
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
