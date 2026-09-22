'use client';

import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import Button from './ui/Button';
import Modal from './ui/Modal';

/**
 * Copia texto con la API moderna (portapapeles Unicode) y, si no está disponible
 * —por ejemplo en http sin localhost—, con un textarea temporal.
 * Al copiar desde el portapapeles ANSI de Windows los emojis se convierten en el
 * carácter de reemplazo (U+FFFD): esta vía garantiza que el texto pegado los conserve.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* se intenta el método antiguo */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

export default function OrderDone() {
  const { done, close } = useUI();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  if (!done) return null;

  const copyMessage = async () => {
    if (await copyText(done.text)) {
      setCopied(true);
      toast('Mensaje copiado. Pégalo en WhatsApp.');
    } else {
      toast('No se pudo copiar. Selecciona el texto de abajo y cópialo.');
    }
  };

  return (
    <Modal title="Pedido" onClose={close}>
      <div className="done">
        <div className="done__icon">✅</div>
        <h3>¡Pedido listo!</h3>
        <p className="muted">
          Se abrió WhatsApp con el detalle de tu pedido. Envía el mensaje para confirmarlo con la tienda.
        </p>
        {!done.saved && (
          <div className="warn">
            No pudimos registrar el pedido en el sistema, pero el mensaje de WhatsApp sí está listo. Envíalo para que la
            tienda lo reciba.
            {done.error && <><br /><strong>Detalle técnico:</strong> {done.error}</>}
          </div>
        )}
        <a className="btn btn--primary btn--block" href={done.url} target="_blank" rel="noopener noreferrer">
          Abrir WhatsApp de nuevo
        </a>
        <Button variant="ghost" block onClick={() => void copyMessage()}>
          {copied ? '✓ Mensaje copiado' : 'Copiar mensaje'}
        </Button>
        <details className="done__preview">
          <summary>Ver el mensaje que se envía</summary>
          <pre>{done.text}</pre>
        </details>
        <Button variant="ghost" block onClick={close}>Seguir comprando</Button>
      </div>
    </Modal>
  );
}