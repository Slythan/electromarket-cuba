'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import Button from './ui/Button';
import Modal from './ui/Modal';

type DoneState = NonNullable<ReturnType<typeof useUI>['done']>;

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

  const previousFocus = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  try {
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length); // necesario en iOS
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    // Siempre se limpia el textarea y se devuelve el foco a donde estaba.
    if (area.parentNode) area.parentNode.removeChild(area);
    previousFocus?.focus?.();
  }
}

function OrderDoneContent({
  done,
  close,
}: {
  done: DoneState;
  close: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const copyMessage = async () => {
    if (await copyText(done.text)) {
      setCopied(true);
      toast('Mensaje copiado. Pégalo en WhatsApp.');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2500);
    } else {
      // Se abre la vista previa para que el texto quede visible y se pueda seleccionar.
      setPreviewOpen(true);
      toast('No se pudo copiar. Selecciona el mensaje de abajo y cópialo.');
    }
  };

  return (
    <Modal title="Pedido" onClose={close}>
      <div className="done">
        <div className="done__icon" aria-hidden="true">
          ✅
        </div>
        <h3>Tu pedido está casi listo</h3>
        {done.orderId && (
          <p className="muted">
            Pedido n.º <strong>{done.orderId.slice(0, 8).toUpperCase()}</strong>
          </p>
        )}
        <p className="muted">
          Envía el mensaje por WhatsApp para confirmarlo con la tienda. Si no se abrió
          automáticamente, usa el botón de abajo.
        </p>

        {!done.saved && (
          <div className="warn" role="alert">
            No pudimos registrar el pedido en el sistema, pero el mensaje de WhatsApp sí está
            listo. Envíalo para que la tienda lo reciba.
            {/* El detalle técnico solo se muestra en desarrollo: en producción
                puede revelar información interna (tablas, políticas, etc.). */}
            {process.env.NODE_ENV === 'development' && done.error && (
              <>
                <br />
                <strong>Detalle técnico:</strong> {done.error}
              </>
            )}
          </div>
        )}

        <a
          className="btn btn--primary btn--block"
          href={done.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir WhatsApp
        </a>

        <Button variant="ghost" block onClick={() => void copyMessage()}>
          {copied ? '✓ Mensaje copiado' : 'Copiar mensaje'}
        </Button>

        <details
          className="done__preview"
          open={previewOpen}
          onToggle={(event) => setPreviewOpen(event.currentTarget.open)}
        >
          <summary>Ver el mensaje que se envía</summary>
          <pre>{done.text}</pre>
        </details>

        <Button variant="ghost" block onClick={close}>
          Seguir comprando
        </Button>
      </div>
    </Modal>
  );
}

export default function OrderDone() {
  const { done, dismissDone } = useUI();
  if (!done) return null;
  // El contenido se monta solo cuando hay un pedido: así "copied" y "previewOpen"
  // empiezan limpios con cada pedido nuevo. Al cerrar se descarta `done` por completo.
  return <OrderDoneContent done={done} close={dismissDone} />;
}
