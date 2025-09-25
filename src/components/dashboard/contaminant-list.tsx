'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MouseEvent } from 'react';
import { useWaterStore } from '@/store/useWaterStore';
import { ContaminantCard } from './contaminant-card';

const updateSurfaceHighlight = (event: MouseEvent<HTMLElement>) => {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--hover-x', `${x}%`);
  card.style.setProperty('--hover-y', `${y}%`);
};

export const ContaminantList = () => {
  const contaminants = useWaterStore((state) => state.contaminants);

  const hasContaminants = contaminants.length > 0;

  if (!hasContaminants) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface mx-auto max-w-3xl border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 dark:border-white/15 dark:bg-slate-900/50 dark:text-slate-300"
        onMouseMove={updateSurfaceHighlight}
        onMouseLeave={(event) => {
          event.currentTarget.style.removeProperty('--hover-x');
          event.currentTarget.style.removeProperty('--hover-y');
        }}
      >
        Upload a water quality report to review contaminants here. Each row will appear as an editable card you can tweak
        before generating SQL.
      </motion.div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4 text-center">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Review &amp; Edit Contaminants</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update names, units, and descriptive fields. Changes persist in the SQL generation step.
        </p>
      </header>
      <AnimatePresence>
        <motion.div layout className="grid gap-6 justify-items-center">
          {contaminants.map((contaminant, index) => (
            <ContaminantCard key={contaminant.__id} contaminant={contaminant} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
