import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Consulta los términos de compra, pedidos, entregas, productos y garantía de ElectroMarketCuba.',
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return <LegalPage type="terms" />;
}
