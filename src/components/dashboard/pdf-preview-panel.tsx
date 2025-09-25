'use client';

import dynamic from 'next/dynamic';
import { useWaterStore } from '@/store/useWaterStore';
import { Suspense } from 'react';

const PdfPreviewClient = dynamic(() => import('./pdf-preview-panel.client').then((mod) => mod.PdfPreviewPanelClient), {
  ssr: false,
});

export const PdfPreviewPanel = () => {
  const pdfUrl = useWaterStore((state) => state.pdfPreviewUrl);
  const baseClass =
    'hidden h-full w-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500 shadow-soft transition-colors dark:border-white/15 dark:bg-[#070b16] dark:text-slate-200 lg:flex';

  if (!pdfUrl) {
    return <div className={baseClass}>Upload a report to preview the PDF here.</div>;
  }

  return (
    <Suspense fallback={<div className={baseClass.replace('border-dashed', 'border')}>Loading PDF…</div>}>
      <PdfPreviewClient />
    </Suspense>
  );
};