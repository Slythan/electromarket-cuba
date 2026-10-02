import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminAccessGate from './AdminAccessGate';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAccessGate>{children}</AdminAccessGate>;
}