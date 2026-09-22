'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney, translateError } from '@/lib/format';
import { deleteProduct, removeProductImages, setProductVisible } from '@/services/products';
import type { Product } from '@/lib/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Thumb from '../ui/thumb';
import ProductForm from './ProductForm';

export default function ProductsTab() {
  const { products, settings, reloadProducts } = useStore();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);

  const formOpen = creating || editing !== null;
  const closeForm = useCallback(() => {
    setCreating(false);
    setEditing(null);
  }, []);

  const showError = (e: unknown) => toast(translateError(e instanceof Error ? e.message : undefined));

  const toggleVisible = async (p: Product, visible: boolean) => {
    try {
      await setProductVisible(p.id, visible);
      await reloadProducts();
    } catch (e) {
      showError(e);
    }
  };

  const remove = async (p: Product) => {
    // Primer clic: pide confirmación · segundo clic: elimina
    if (armedDelete !== p.id) {
      setArmedDelete(p.id);
      setTimeout(() => setArmedDelete((cur) => (cur === p.id ? null : cur)), 3500);
      return;
    }
    setArmedDelete(null);
    try {
      await deleteProduct(p.id);
      await removeProductImages(p.imageUrls);
      await reloadProducts();
      toast('Producto eliminado');
    } catch (e) {
      showError(e);
    }
  };

  return (
    <>
      <div className="toolbar">
        <Button onClick={() => setCreating(true)}>＋ Nuevo producto</Button>
      </div>

      {products.length === 0 ? (
        <div className="note">Todavía no hay productos. Crea el primero con el botón de arriba.</div>
      ) : (
        <div className="rows">
          {products.map((p) => (
            <div className="prow" key={p.id}>
              <div className="prow__thumbs">
                {(p.imageUrls.length ? p.imageUrls : ['']).map((url, index) => (
                  <Thumb key={url || `empty-${index}`} src={url} size={56} />
                ))}
              </div>
              <div className="prow__info">
                <strong>{p.name}</strong>
                <span className="muted">
                  Cliente final {formatMoney(p.price, settings.currency)} · Gestor {formatMoney(p.managerPrice, settings.currency)} ·{' '}
                  {p.imageUrls.length} {p.imageUrls.length === 1 ? 'foto' : 'fotos'} ·{' '}
                  {p.stock !== null ? `${p.stock} en stock` : 'sin límite de stock'}
                </span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={p.visible} onChange={(e) => toggleVisible(p, e.target.checked)} />
                <span>Visible</span>
              </label>
              <div className="prow__actions">
                <Link className="btn btn--ghost btn--sm" href={`/productos/${p.id}`} target="_blank" rel="noopener noreferrer">Ver</Link>
                <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => remove(p)}>
                  {armedDelete === p.id ? '¿Seguro?' : 'Eliminar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={closeForm} size="wide">
          <ProductForm
            product={editing}
            onSaved={async () => {
              await reloadProducts();
              closeForm();
            }}
          />
        </Modal>
      )}
    </>
  );
}