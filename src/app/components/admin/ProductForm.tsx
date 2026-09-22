'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { translateError } from '@/lib/format';
import { fileToBlob } from '@/lib/image';
import { MAX_PRODUCT_IMAGES, type Product } from '@/lib/types';
import { removeProductImages, saveProduct, uploadProductImage } from '@/services/products';
import Button from '../ui/Button';
import Field from '../ui/Field';

interface ProductFormProps {
  /** Si se pasa, el formulario edita ese producto; si no, crea uno nuevo. */
  product?: Product | null;
  onSaved: () => void | Promise<void>;
}

/** Foto ya guardada (url pública) o recién elegida (blob + vista previa temporal). */
interface PhotoSlot {
  key: string;
  url: string;
  blob: Blob | null;
}

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Ranuras de foto (máximo 3) rellenas con las del producto que se está editando. */
const initialPhotos = (product: Product | null): (PhotoSlot | null)[] => {
  const saved = (product?.imageUrls ?? [])
    .slice(0, MAX_PRODUCT_IMAGES)
    .map((url) => ({ key: newKey(), url, blob: null }));
  return Array.from({ length: MAX_PRODUCT_IMAGES }, (_, index) => saved[index] ?? null);
};

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
  const [photos, setPhotos] = useState<(PhotoSlot | null)[]>(() => initialPhotos(product));
  const previews = useRef<string[]>([]);

  // Las vistas previas temporales se liberan al cerrar el formulario.
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const releasePreview = (url: string) => {
    previews.current = previews.current.filter((item) => item !== url);
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  const onFile = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    try {
      const blob = await fileToBlob(file, 1000);
      const url = URL.createObjectURL(blob);
      previews.current.push(url);
      setPhotos((current) => {
        const previous = current[index];
        if (previous) releasePreview(previous.url);
        const next = [...current];
        next[index] = { key: newKey(), url, blob };
        return next;
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const photo = current[index];
      if (photo) releasePreview(photo.url);
      const next = [...current];
      next[index] = null;
      return next;
    });
  };

  /** Mueve esa foto al primer lugar: es la que se muestra en el catálogo. */
  const makeCover = (index: number) =>
    setPhotos((current) => {
      const chosen = current[index];
      if (!chosen) return current;
      return [chosen, ...current.filter((_, position) => position !== index)].slice(0, MAX_PRODUCT_IMAGES);
    });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const price = parseFloat(String(form.get('price') ?? '').replace(',', '.'));
    const managerPrice = parseFloat(String(form.get('managerPrice') ?? '').replace(',', '.'));
    const stockRaw = String(form.get('stock') ?? '').trim();
    const stock = stockRaw === '' ? null : Math.max(0, parseInt(stockRaw, 10));

    if (!name) return setError('Escribe el nombre del producto.');
    if (!Number.isFinite(price) || price < 0) return setError('El precio de cliente final no es válido.');
    if (!Number.isFinite(managerPrice) || managerPrice < 0) return setError('El precio de gestor no es válido.');
    if (managerPrice > price) return setError('El precio de gestor no puede ser mayor que el precio de cliente final.');
    if (stock !== null && Number.isNaN(stock)) return setError('Stock no válido.');

    setBusy(true);
    setError('');
    const uploaded: string[] = [];
    try {
      const chosen = photos.filter((photo): photo is PhotoSlot => photo !== null);
      const imageUrls: string[] = [];
      for (const photo of chosen) {
        if (photo.blob) {
          const url = await uploadProductImage(photo.blob);
          uploaded.push(url);
          imageUrls.push(url);
        } else {
          imageUrls.push(photo.url);
        }
      }

      await saveProduct(
        {
          name,
          price: Math.round(price * 100) / 100,
          managerPrice: Math.round(managerPrice * 100) / 100,
          stock,
          categoryId: String(form.get('categoryId') ?? '') || null,
          description: String(form.get('description') ?? '').trim(),
          imageUrls,
          visible: form.get('visible') === 'on',
        },
        product?.id
      );

      // Las fotos que se quitaron del formulario se borran del storage.
      const removed = (product?.imageUrls ?? []).filter((url) => !imageUrls.includes(url));
      if (removed.length) await removeProductImages(removed);

      toast('Producto guardado');
      await onSaved();
    } catch (err) {
      // Si algo falló a mitad de la subida, no dejamos fotos sueltas en el storage.
      if (uploaded.length) await removeProductImages(uploaded);
      setError(translateError(err instanceof Error ? err.message : undefined));
      setBusy(false);
    }
  };

  const filled = photos.filter(Boolean).length;

  return (
    <form className="product-form" onSubmit={onSubmit}>
      <div className="product-form__media">
        <span className="field__label">Fotos · {filled} de {MAX_PRODUCT_IMAGES}</span>
        <div className="photo-slots">
          {photos.map((photo, index) => (
            <div className={`photo-slot${photo ? ' is-filled' : ''}`} key={photo?.key ?? `empty-${index}`}>
              {photo ? (
                <>
                  <img src={photo.url} alt={`Foto ${index + 1} del producto`} />
                  {index === 0
                    ? <span className="photo-slot__badge">Portada</span>
                    : <button type="button" className="photo-slot__cover" onClick={() => makeCover(index)}>Usar de portada</button>}
                  <button type="button" className="photo-slot__remove" aria-label={`Quitar foto ${index + 1}`} onClick={() => removePhoto(index)}>✕</button>
                </>
              ) : (
                <label className="photo-slot__picker">
                  <span aria-hidden="true">＋</span>
                  <small>Foto {index + 1}</small>
                  <input type="file" accept="image/*" onChange={(event) => void onFile(index, event)} />
                </label>
              )}
            </div>
          ))}
        </div>
        <p className="field__hint">Hasta {MAX_PRODUCT_IMAGES} fotos por producto. La portada es la que se ve en el catálogo y en el carrito.</p>
      </div>

      <div className="product-form__fields">
        <Field label="Nombre">
          <input className="input" type="text" name="name" maxLength={80} defaultValue={product?.name ?? ''} required />
        </Field>

        <div className="product-form__prices">
          <Field label="Precio cliente final" hint="Lo que paga un comprador normal.">
            <input className="input" type="text" name="price" inputMode="decimal" placeholder="0.00" defaultValue={product ? String(product.price) : ''} required />
          </Field>
          <Field label="Precio de gestor" hint="Lo que paga un gestor aprobado.">
            <input className="input" type="text" name="managerPrice" inputMode="decimal" placeholder="0.00" defaultValue={product ? String(product.managerPrice) : ''} required />
          </Field>
          <Field label="Stock" hint="Vacío = sin límite.">
            <input className="input" type="number" name="stock" min={0} step={1} placeholder="Sin límite" defaultValue={product?.stock ?? ''} />
          </Field>
        </div>

        <Field label="Descripción" hint="Se muestra en la página propia del producto.">
          <textarea className="input" name="description" maxLength={900} rows={5} placeholder="Características, incluye, garantía…" defaultValue={product?.description ?? ''} />
        </Field>

        <Field label="Categoría" hint="El producto aparece en esta categoría y en su página propia.">
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

        <label className="switch">
          <input type="checkbox" name="visible" defaultChecked={product ? product.visible : true} />
          <span>Visible en la tienda</span>
        </label>

        <p className="form__error">{error}</p>
        <div className="banner-form__actions">
          <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar producto'}</Button>
        </div>
      </div>
    </form>
  );
}
