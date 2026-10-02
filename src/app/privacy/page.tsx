import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Conoce cómo ElectroMarketCuba protege y utiliza los datos necesarios para gestionar cuentas, pedidos y entregas.',
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return <LegalPage type="privacy" />;
}
