import Link from 'next/link';

export default function SiteFooter() {
  return <>
    <section className="newsletter">
      <div><span className="eyebrow">MANTENTE CERCA</span><h2>Ofertas útiles, directo a tu correo</h2><p>Novedades, consejos y promociones sin ruido.</p></div>
      <form className="newsletter__form" action="#">
        <input className="input" type="email" placeholder="tuemail@ejemplo.com" aria-label="Correo electrónico" required />
        <button className="btn" type="submit">Suscribirme</button>
      </form>
    </section>
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand"><div className="footer-mark"><span aria-hidden="true">ϟ</span><strong>ElectroMarket</strong></div><p>Soluciones confiables para tu hogar, tu energía y tu movilidad en Cuba.</p></div>
        <div><h3>Comprar</h3><Link href="/">Energía</Link><Link href="/">Electrodomésticos</Link><Link href="/">Climatización</Link><Link href="/">Movilidad</Link></div>
        <div><h3>Ayuda</h3><Link href="/terms">Cómo comprar</Link><Link href="/terms">Entregas</Link><Link href="/terms">Garantía</Link><Link href="/privacy">Privacidad</Link></div>
        <div><h3>Mi cuenta</h3><Link href="/admin">Panel</Link><Link href="/">Carrito</Link><Link href="/terms">Términos</Link></div>
      </div>
      <div className="site-footer__bottom"><span>© {new Date().getFullYear()} ElectroMarket. Todos los derechos reservados.</span><span><Link href="/privacy">Privacidad</Link><Link href="/terms">Términos</Link></span></div>
    </footer>
  </>;
}
