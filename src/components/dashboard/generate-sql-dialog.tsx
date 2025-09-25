'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContaminantRecord } from '@/pdf/types';
import { useWaterStore } from '@/store/useWaterStore';
import { DeployGuide } from './deploy-guide';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

export const GenerateSqlDialog = () => {
  const contaminants = useWaterStore((state) => state.contaminants);
  const warnings = useWaterStore((state) => state.warnings);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [editableScript, setEditableScript] = useState('');
  const [contaminantCount, setContaminantCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'sql' | 'guide'>('sql');

  const handleGenerate = async () => {
    if (contaminants.length === 0) {
      setError('Upload a report and review contaminants before generating SQL.');
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setScript(null);
    setEditableScript('');
    setContaminantCount(0);

    try {
      const payload = {
        formData: {},
        contaminants: contaminants.map(({ __id, ...rest }) => rest) as ContaminantRecord[],
      };

      const response = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to generate SQL script.');
      }

      const result = await response.json();
      const generatedScript = String(result.script ?? '');
      setScript(generatedScript);
      setEditableScript(generatedScript);
      setContaminantCount(result.contaminantCount ?? contaminants.length);
      setActiveTab('sql');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error generating SQL.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!editableScript) return;
    try {
      await navigator.clipboard.writeText(editableScript);
      setError('SQL copied to clipboard.');
    } catch {
      setError('Copy failed. Try selecting the text manually.');
    }
  };

  const handleDownload = () => {
    if (!editableScript) return;
    const blob = new Blob([editableScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water_quality_report_${Date.now()}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
        disabled={contaminants.length === 0}
      >
        Generate SQL
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(event) => event.stopPropagation()}
              className="card-surface no-hover-glow relative max-h-[85vh] w-full max-w-3xl overflow-hidden border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950/70"
            >
              <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-slate-900/60">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">SQL Script Preview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isLoading
                      ? 'Generating script...'
                      : `Ready for ${contaminantCount} contaminants`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  Close
                </button>
              </header>

              <div className="flex flex-col gap-4 px-6 py-5">
                {Array.isArray(warnings) && warnings.length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <p className="font-semibold">Warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {error && !isLoading ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                  </div>
                ) : null}

                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
                    Generating SQL script...
                  </div>
                ) : script ? (
                  <>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-1 py-1 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => setActiveTab('sql')}
                        className={
                          activeTab === 'sql'
                            ? 'rounded-full bg-white px-3 py-1 font-medium text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                            : 'rounded-full px-3 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }
                      >
                        SQL Script
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('guide')}
                        className={
                          activeTab === 'guide'
                            ? 'rounded-full bg-white px-3 py-1 font-medium text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                            : 'rounded-full px-3 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }
                      >
                        Deploy Guide
                      </button>
                    </div>

                    {activeTab === 'sql' ? (
                      <textarea
                        value={editableScript}
                        onChange={(event) => setEditableScript(event.target.value)}
                        spellCheck={false}
                        className="mt-4 h-[45vh] w-full resize-none rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 shadow-inner outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100"
                      />
                    ) : (
                      <div className="mt-4">
                        <DeployGuide contaminantCount={contaminantCount} sqlScript={editableScript} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-300">
                    Click “Generate SQL” to produce a ready-to-run script and an interactive deployment walkthrough.
                  </div>
                )}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!editableScript}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!editableScript}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Regenerating…' : 'Regenerate'}
                </button>
              </footer>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
