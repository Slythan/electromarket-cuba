import Link from 'next/link';

interface LegalPageProps { type: 'privacy' | 'terms'; }

export default function LegalPage({ type }: LegalPageProps) {
  const privacy = type === 'privacy';
  return <div className="legal-page container">
    <Link className="legal-page__back" href="/">← Volver a ElectroMarket</Link>
    <span className="eyebrow">ELECTROMARKETCUBA</span>
    <h1>{privacy ? 'Política de privacidad' : 'Términos y condiciones'}</h1>
    <p className="legal-page__lead">Última actualización: 20 de septiembre de 2026</p>
    {privacy ? <>
      <h2>Información que recopilamos</h2><p>Recopilamos los datos necesarios para crear tu cuenta, gestionar tus pedidos y comunicarnos contigo: nombre, correo, teléfono, dirección y los detalles de tu compra.</p>
      <h2>Cómo usamos tus datos</h2><p>Usamos esta información para procesar pedidos, coordinar entregas, ofrecer soporte y mejorar la experiencia de ElectroMarket. No vendemos tus datos personales.</p>
      <h2>Supabase y seguridad</h2><p>Los datos se almacenan mediante Supabase y se protegen con autenticación y políticas de acceso. Solo el personal autorizado puede consultar la información administrativa.</p>
      <h2>Tus derechos</h2><p>Puedes solicitar la actualización o eliminación de tus datos escribiendo a la tienda por los canales de contacto disponibles.</p>
    </> : <>
      <h2>Compras</h2><p>Los productos, precios y disponibilidad se muestran en la tienda y pueden cambiar sin aviso previo. Un pedido se considera recibido cuando la tienda lo confirma.</p>
      <h2>Pedidos y entregas</h2><p>Al finalizar una compra, los datos del pedido se guardan y se prepara un mensaje de WhatsApp para coordinarlo. Los tiempos y costos de entrega se confirman con cada cliente.</p>
      <h2>Productos y garantía</h2><p>La garantía y el soporte dependen del producto y se informan al momento de la compra. Conserva la confirmación de tu pedido para cualquier reclamación.</p>
      <h2>Contacto</h2><p>Para dudas sobre un pedido, disponibilidad o devolución, utiliza los canales de contacto de ElectroMarket.</p>
    </>}
  </div>;
}
