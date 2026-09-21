'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { translateError } from '@/lib/format';
import { fileToBlob } from '@/lib/image';
import { removeProductImage, saveProduct, uploadProductImage } from '@/services/products';
import type { Product } from '@/lib/types';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Thumb from '../ui/thumb';

interface ProductFormProps {
  /** Si se pasa, el formulario edita ese producto; si no, crea uno nuevo. */
  product?: Product | null;
  onSaved: () => void | Promise<void>;
}

export default function ProductForm({ product = null, onSaved }: ProductFormProps) {
  const toast = useToast();
  const { categories } = useStore();
  const categoryGroups = useMemo(() => categories
    .filter((category) => !category.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((parent) => ({
      parent,
      children: categories
        .filter((category) => category.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    })), [categories]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(product?.imageUrl ?? '');
  const [blob, setBlob] = useState<Blob | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    []
  );

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b = await fileToBlob(file, 900);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(b);
      setBlob(b);
      setPreview(objectUrl.current);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.');
    }
  };

  const removeImage = () => {
    setBlob(null);
    setPreview('');
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') ?? '').trim();
    const price = parseFloat(String(f.get('price') ?? '').replace(',', '.'));
    const managerPrice = parseFloat(String(f.get('managerPrice') ?? '').replace(',', '.'));
    const stockRaw = String(f.get('stock') ?? '').trim();
    const stock = stockRaw === '' ? null : Math.max(0, parseInt(stockRaw, 10));

    if (!name) return setError('Escribe el nombre del producto.');
    if (!Number.isFinite(price) || price < 0) return setError('Precio no válido.');
    if (!Number.isFinite(managerPrice) || managerPrice < 0) return setError('Precio de gestor no válido.');
    if (stock !== null && Number.isNaN(stock)) return setError('Stock no válido.');

    setBusy(true);
    setError('');
    try {
      let imageUrl: string | null = blob ? null : preview || null;
      if (blob) imageUrl = await uploadProductImage(blob);

      await saveProduct(
        {
          name,
          price: Math.round(price * 100) / 100,
          managerPrice: Math.round(managerPrice * 100) / 100,
          stock,
          categoryId: String(f.get('categoryId') ?? '') || null,
          description: String(f.get('description') ?? '').trim(),
          imageUrl,
          visible: f.get('visible') === 'on',
        },
        product?.id
      );

      if (product?.imageUrl && product.imageUrl !== imageUrl) await removeProductImage(product.imageUrl);
      toast('Producto guardado');
      await onSaved();
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <Field label="Nombre">
        <input className="input" type="text" name="name" maxLength={80} defaultValue={product?.name ?? ''} required />
      </Field>

      <div className="two-col">
        <Field label="Precio final">
          <input
            className="input"
            type="text"
            name="price"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={product ? String(product.price) : ''}
            required
          />
        </Field>
        <Field label="Precio de gestor">
          <input
            className="input"
            type="text"
            name="managerPrice"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={product ? String(product.managerPrice) : ''}
            required
          />
        </Field>
        <Field label="Stock (opcional)">
          <input
            className="input"
            type="number"
            name="stock"
            min={0}
            step={1}
            placeholder="Sin límite"
            defaultValue={product?.stock ?? ''}
          />
        </Field>
      </div>

      <Field label="Descripción">
        <textarea
          className="input"
          name="description"
          maxLength={500}
          rows={3}
          placeholder="Información del producto"
          defaultValue={product?.description ?? ''}
        />
      </Field>

      <Field label="Categoría">
        <select className="input" name="categoryId" defaultValue={product?.categoryId ?? ''}>
          <option value="">Sin categoría</option>
          {categoryGroups.map(({ parent, children }) => (
            <optgroup label={parent.name} key={parent.id}>
              <option value={parent.id}>{parent.name} · categoría madre</option>
              {children.map((child) => <option key={child.id} value={child.id}>↳ {child.name}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>

      <div>
        <div className="field__label">Imagen</div>
        <div className="image-picker">
          <Thumb src={preview} size={84} />
          <div className="image-picker__actions">
            <input type="file" accept="image/*" onChange={onFile} />
            <Button variant="link" className="danger-text" onClick={removeImage}>
              Quitar imagen
            </Button>
          </div>
        </div>
      </div>

      <label className="switch">
        <input type="checkbox" name="visible" defaultChecked={product ? product.visible : true} />
        <span>Visible en la tienda</span>
      </label>

      <p className="form__error">{error}</p>
      <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar producto'}</Button>
    </form>
  );
}