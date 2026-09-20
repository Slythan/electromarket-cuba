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
        sortOrder: Math.max(0, Number(form.get('sortOrder') ?? 0)),
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
          <div className="two-col"><Field label="Tipo"><select className="input" name="parentId" defaultValue={editing?.parentId ?? ''}><option value="">Categoría principal</option>{parents.filter((parent) => parent.id !== editing?.id).map((parent) => <option key={parent.id} value={parent.id}>Subcategoría de {parent.name}</option>)}</select></Field><Field label="Orden"><input className="input" name="sortOrder" type="number" min={0} step={1} defaultValue={editing?.sortOrder ?? categories.length} /></Field></div>
          <label className="switch"><input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /><span>Mostrar en la tienda</span></label>
          <p className="form__error">{error}</p><div className="banner-form__actions"><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir categoría'}</Button>{editing && <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>}</div>
        </div>
      </form>
      <div className="banner-list-heading"><h3>Categorías creadas</h3><span className="muted">{categories.length} elementos</span></div>
      <div className="rows">{categories.map((category) => <div className="prow banner-row" key={category.id}><div className="category-admin__thumb">{category.imageUrl ? <img src={category.imageUrl} alt="" /> : '◈'}</div><div className="prow__info"><strong>{category.parentId ? '↳ ' : ''}{category.name}</strong><span className="muted">{category.parentId ? 'Subcategoría' : 'Categoría principal'} · {category.visible ? 'Visible' : 'Oculta'}</span></div><div className="prow__actions"><Button variant="ghost" size="sm" onClick={() => edit(category)}>Editar</Button><Button variant="danger" size="sm" onClick={() => remove(category)}>Eliminar</Button></div></div>)}</div>
    </div>
  );
}
