const HIGHLIGHTS = [
  { icon: '♢', title: 'Garantía real', text: 'Productos respaldados y atención posventa.' },
  { icon: '↗', title: 'Entrega confiable', text: 'Coordinamos tu entrega donde la necesites.' },
  { icon: '◌', title: 'Soporte cercano', text: 'Asesoría antes, durante y después de comprar.' },
  { icon: '□', title: 'Compra segura', text: 'Proceso claro y pagos protegidos.' },
];

export default function StoreHighlights() {
  return <section className="highlights" aria-label="Beneficios de ElectroMarket">
    {HIGHLIGHTS.map((highlight) => <article className="highlight" key={highlight.title}>
      <span className="highlight__icon" aria-hidden="true">{highlight.icon}</span>
      <div><strong>{highlight.title}</strong><p>{highlight.text}</p></div>
    </article>)}
  </section>;
}
