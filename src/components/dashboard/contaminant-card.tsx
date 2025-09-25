'use client';

import { memo, MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { ContaminantRecord } from '@/pdf/types';
import { useWaterStore, type ContaminantWithId } from '@/store/useWaterStore';

const FIELD_DEFINITIONS: Array<{
  key: keyof ContaminantRecord;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea';
}> = [
  { key: 'Contaminant', label: 'Display Name', placeholder: 'e.g. Chlorine Residual' },
  { key: 'Violation', label: 'Violation', placeholder: 'Yes / No' },
  { key: 'Date of Sample', label: 'Sample Date', placeholder: 'MM/DD/YYYY' },
  { key: 'Level Detected (Avg/Max)', label: 'Level Detected (Avg/Max)', placeholder: 'Numeric value' },
  { key: 'Level Detected (Range)', label: 'Level Range', placeholder: '(min – max)' },
  { key: 'Unit Measurement', label: 'Unit', placeholder: 'mg/L, ug/L…' },
  { key: 'MCLG', label: 'MCLG', placeholder: 'Goal or N/A' },
  { key: 'Regulatory Limit', label: 'Regulatory Limit', placeholder: 'Limit or N/A' },
  {
    key: 'Likely Source of Contamination',
    label: 'Likely Source of Contamination',
    placeholder: 'Describe likely sources…',
    type: 'textarea',
  },
];

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 220, damping: 24, mass: 0.6 },
  },
};

const updateSurfaceHighlight = (event: ReactMouseEvent<HTMLElement>) => {
  const card = event.currentTarget as HTMLElement;
  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--hover-x', `${x}%`);
  card.style.setProperty('--hover-y', `${y}%`);
};

type ContaminantCardProps = {
  contaminant: ContaminantWithId;
  index: number;
};

export const ContaminantCard = memo(({ contaminant, index }: ContaminantCardProps) => {
  const updateContaminant = useWaterStore((state) => state.updateContaminant);
  const removeContaminant = useWaterStore((state) => state.removeContaminant);

  const subtitle = [
    contaminant['Violation'],
    contaminant['Date of Sample'],
    contaminant['Unit Measurement'],
  ]
    .filter(Boolean)
    .join(' · ');

  const handleFieldChange = (key: keyof ContaminantRecord) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateContaminant(contaminant.__id, {
        [key]: event.target.value,
      });
    };

  return (
    <motion.article
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="hidden"
      layout
      whileHover={{ translateY: -4 }}
      onMouseMove={updateSurfaceHighlight}
      onMouseLeave={(event) => {
        const target = event.currentTarget as HTMLElement;
        target.style.removeProperty('--hover-x');
        target.style.removeProperty('--hover-y');
      }}
      className="card-surface group w-full max-w-3xl p-6"
    >
      <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Contaminant #{index + 1}</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {contaminant.Contaminant || 'Unnamed contaminant'}
          </h3>
          {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => removeContaminant(contaminant.__id)}
          className="self-start rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/10"
        >
          Remove
        </button>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {FIELD_DEFINITIONS.map(({ key, label, placeholder, type }) => {
          const value = contaminant[key] ?? '';
          const isTextarea = type === 'textarea';

          return (
            <label key={String(key)} className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
              {isTextarea ? (
                <textarea
                  value={value as string}
                  onChange={handleFieldChange(key)}
                  placeholder={placeholder}
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              ) : (
                <input
                  value={value as string}
                  onChange={handleFieldChange(key)}
                  placeholder={placeholder}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              )}
            </label>
          );
        })}
      </div>

      {contaminant.rawText ? (
        <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
          <summary className="cursor-pointer select-none text-slate-600 dark:text-slate-300">Source row preview</summary>
          <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {contaminant.rawText}
          </pre>
        </details>
      ) : null}
    </motion.article>
  );
});

ContaminantCard.displayName = 'ContaminantCard';
