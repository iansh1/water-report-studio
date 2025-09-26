"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UploadPanel } from '@/components/dashboard/upload-panel';
import { ContaminantList } from '@/components/dashboard/contaminant-list';
import { GenerateSqlDialog } from '@/components/dashboard/generate-sql-dialog';
import { InteractiveSurface } from '@/components/ui/interactive-surface';
import { DeployGuide } from '@/components/dashboard/deploy-guide';
import { useWaterStore } from '@/store/useWaterStore';

const PdfPreviewPanel = dynamic(() => import('@/components/dashboard/pdf-preview-panel').then((mod) => mod.PdfPreviewPanel), {
  ssr: false,
});

export default function DashboardPage() {
  const contaminants = useWaterStore((state) => state.contaminants);

  return (
    <div className="w-full px-4 pt-16 pb-16 sm:px-6 lg:flex lg:items-start lg:gap-8 xl:gap-12 xl:px-12">
      <div className="flex-1 min-w-0 space-y-8">
        <UploadPanel />

        <ContaminantList />

        <div className="flex justify-center">
          <GenerateSqlDialog />
        </div>

        <InteractiveSurface className="no-hover-glow space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Need the connection steps?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            When you&apos;re ready to load the latest contaminants into MariaDB, open the dedicated connection guide for the full checklist.
          </p>
          <div>
            <Link
              href="/deploy"
              className="no-hover-glow inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-white/20 dark:bg-slate-900/60 dark:text-slate-200"
            >
              Open Connection Guide
            </Link>
          </div>
        </InteractiveSurface>
      </div>

      <PdfPreviewPanel />
    </div>
  );
}