"use client";

import { Suspense } from 'react';
import Shop from '@/components/Shop';

export default function HomePage() {
  return <Suspense fallback={null}><Shop /></Suspense>;
}