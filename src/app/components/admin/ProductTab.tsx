'use client';

import { useCallback, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney, translateError } from '@/lib/format';
import { deleteProduct, removeProductImage, setProductVisible } from '@/services/products';
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
      await removeProductImage(p.imageUrl);
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
              <Thumb src={p.imageUrl} />
              <div className="prow__info">
                <strong>{p.name}</strong>
                <span className="muted">
                  Final {formatMoney(p.price, settings.currency)} · Gestor {formatMoney(p.managerPrice, settings.currency)} ·{' '}
                  {p.stock !== null ? `${p.stock} en stock` : 'sin límite de stock'}
                </span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={p.visible} onChange={(e) => toggleVisible(p, e.target.checked)} />
                <span>Visible</span>
              </label>
              <div className="prow__actions">
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
        <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={closeForm}>
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