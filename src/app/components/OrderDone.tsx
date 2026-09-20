'use client';

import { useUI } from '@/context/UIContext';
import Button from './ui/Button';
import Modal from './ui/Modal';

export default function OrderDone() {
  const { done, close } = useUI();
  if (!done) return null;

  return (
    <Modal title="Pedido" onClose={close}>
      <div className="done">
        <div className="done__icon">✅</div>
        <h3>¡Pedido listo!</h3>
        <p className="muted">
          Se abrió WhatsApp con el detalle de tu pedido. Envía el mensaje para confirmarlo con la tienda.
        </p>
        {!done.saved && (
          <p className="warn">
            No pudimos registrar el pedido en el sistema, pero el mensaje de WhatsApp sí está listo. Envíalo para que la
            tienda lo reciba.
          </p>
        )}
        <a className="btn btn--primary btn--block" href={done.url} target="_blank" rel="noopener noreferrer">
          Abrir WhatsApp de nuevo
        </a>
        <Button variant="ghost" block onClick={close}>Seguir comprando</Button>
      </div>
    </Modal>
  );
}