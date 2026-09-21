'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { fileToBlob } from '@/lib/image';
import { translateError } from '@/lib/format';
import { deleteCategory, fetchAllCategories, removeCategoryImage, saveCategory, uploadCategoryImage } from '@/services/categories';
import type { Category } from '@/lib/types';
import Button from '../ui/Button';
import Field from '../ui/Field';

export default function CategoriesTab() {
  const { reloadCategories } = useStore();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [preview, setPreview] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const objectUrl = useRef<string | null>(null);

  const load = async () => {
    try { setCategories(await fetchAllCategories()); }
    catch (err) { setError(translateError(err instanceof Error ? err.message : undefined)); }
  };

  useEffect(() => {
    void load();
    return () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); };
  }, []);

  const reset = () => {
    setEditing(null); setPreview(''); setBlob(null); setError(''); setDragActive(false);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  };

  const acceptFile = async (file?: File) => {
    if (!file) return;
    try {
      const nextBlob = await fileToBlob(file, 1000);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(nextBlob);
      setBlob(nextBlob); setPreview(objectUrl.current); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.'); }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault(); setDragActive(false); void acceptFile(event.dataTransfer.files?.[0]);
  };

  const edit = (category: Category) => {
    setEditing(category); setPreview(category.imageUrl); setBlob(null); setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const imageUrl = blob ? await uploadCategoryImage(blob) : preview || null;
      const parentId = String(form.get('parentId') ?? '') || null;
      await saveCategory({
        name: String(form.get('name') ?? '').trim(),
        imageUrl,
        parentId,
        sortOrder: Math.max(0, Number(form.get('sortOrder') ?? 1) - 1),
        visible: form.get('visible') === 'on',
      }, editing?.id);
      if (editing?.imageUrl && editing.imageUrl !== imageUrl) await removeCategoryImage(editing.imageUrl);
      await load(); await reloadCategories(); reset(); toast('Categoría guardada');
    } catch (err) { setError(translateError(err instanceof Error ? err.message : undefined)); }
    finally { setBusy(false); }
  };

  const remove = async (category: Category) => {
    if (!window.confirm('¿Eliminar esta categoría? Las subcategorías asociadas también deben revisarse.')) return;
    try {
      await deleteCategory(category.id); await removeCategoryImage(category.imageUrl); await load(); await reloadCategories(); toast('Categoría eliminada');
    } catch (err) { setError(translateError(err instanceof Error ? err.message : undefined)); }
  };

  const parents = categories.filter((category) => !category.parentId);
  const sortedParents = [...parents].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const siblingCount = editing?.parentId
    ? categories.filter((category) => category.parentId === editing.parentId && category.id !== editing.id).length
    : categories.filter((category) => !category.parentId && category.id !== editing?.id).length;
  const nextPosition = editing ? editing.sortOrder + 1 : siblingCount + 1;
  const categoryActions = (category: Category) => (
    <div className="category-tree__actions">
      <Button variant="ghost" size="sm" onClick={() => edit(category)}>Editar</Button>
      <Button variant="danger" size="sm" onClick={() => remove(category)}>Eliminar</Button>
    </div>
  );
  const toggleParent = (parentId: string) => {
    setExpandedParents((current) => {
      const next = new Set(current);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };
  return (
    <div className="category-admin">
      <div className="banner-admin__intro"><div><h2>Categorías y subcategorías</h2><p className="muted">Organiza la tienda y muestra cada sección con su imagen.</p></div><Button onClick={reset}>＋ Nueva categoría</Button></div>
      <form className="category-form" onSubmit={submit} key={editing?.id ?? 'new-category'}>
        <label className={`banner-dropzone${dragActive ? ' is-dragging' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false); }} onDrop={onDrop}>
          {preview ? <img src={preview} alt="Vista previa de categoría" /> : <span className="banner-dropzone__icon" aria-hidden="true">↥</span>}
          <strong>{dragActive ? 'Suelta la imagen aquí' : 'Arrastra la imagen aquí'}</strong><small>o haz clic para seleccionarla</small>
          <input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => void acceptFile(event.target.files?.[0])} />
        </label>
        <div className="banner-form__fields">
          <Field label="Nombre"><input className="input" name="name" defaultValue={editing?.name ?? ''} maxLength={50} required /></Field>
          <div className="two-col"><Field label="Categoría madre"><select className="input" name="parentId" defaultValue={editing?.parentId ?? ''}><option value="">Sin madre · categoría principal</option>{parents.filter((parent) => parent.id !== editing?.id).map((parent) => <option key={parent.id} value={parent.id}>Subcategoría de {parent.name}</option>)}</select></Field><Field label="Posición dentro del grupo"><input className="input" name="sortOrder" type="number" min={1} step={1} defaultValue={nextPosition} /><small className="field__hint">1 aparece primero. La posición solo se compara con sus hermanas.</small></Field></div>
          <label className="switch"><input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /><span>Mostrar en la tienda</span></label>
          <p className="form__error">{error}</p><div className="banner-form__actions"><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir categoría'}</Button>{editing && <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>}</div>
        </div>
      </form>
      <div className="banner-list-heading"><div><h3>Estructura de categorías</h3><p className="muted">Las categorías madre aparecen primero y sus subcategorías quedan agrupadas debajo.</p></div><span className="muted">{categories.length} elementos</span></div>
      <div className="category-tree">
        {sortedParents.map((parent) => {
          const children = categories.filter((category) => category.parentId === parent.id).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
          return (
            <section className="category-tree__group" key={parent.id}>
              <div className="category-tree__parent">
                <button type="button" className="category-tree__toggle" onClick={() => toggleParent(parent.id)} aria-expanded={expandedParents.has(parent.id)} disabled={!children.length}>
                  <span className="category-tree__chevron" aria-hidden="true">{children.length ? (expandedParents.has(parent.id) ? '⌄' : '›') : '·'}</span>
                  <div className="category-admin__thumb">{parent.imageUrl ? <img src={parent.imageUrl} alt="" /> : '◈'}</div>
                  <div className="prow__info"><strong>{parent.name}</strong><span className="muted">Categoría madre · Posición {parent.sortOrder + 1} · {parent.visible ? 'Visible' : 'Oculta'}{children.length ? ` · ${children.length} subcategoría${children.length === 1 ? '' : 's'}` : ''}</span></div>
                </button>
                {categoryActions(parent)}
              </div>
              {children.length > 0 && expandedParents.has(parent.id) ? <div className="category-tree__children">{children.map((child, index) => <div className="category-tree__child" key={child.id}><span className="category-tree__branch" aria-hidden="true">↳</span><div className="category-admin__thumb">{child.imageUrl ? <img src={child.imageUrl} alt="" /> : '◈'}</div><div className="prow__info"><strong>{child.name}</strong><span className="muted">Subcategoría de {parent.name} · Posición {index + 1} · {child.visible ? 'Visible' : 'Oculta'}</span></div>{categoryActions(child)}</div>)}</div> : children.length === 0 ? <p className="category-tree__empty">Sin subcategorías todavía.</p> : null}
            </section>
          );
        })}
        {!sortedParents.length && <div className="empty">Todavía no hay categorías creadas.</div>}
      </div>
    </div>
  );
}
