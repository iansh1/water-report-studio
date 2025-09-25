'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';

const PLACEHOLDER_SCRIPT = '__SQL_SCRIPT__';

const steps = [
  {
    title: 'SSH into Vulcan',
    summary: 'Establish an SSH session on the Vulcan host that runs MariaDB.',
    command: 'ssh waterreport@vulcan.seidenberg.pace.edu',
    tip: 'Run the command from the Pace VPN if not on campus.',
  },
  {
    title: 'Authenticate with MariaDB',
    summary: 'Log into the MariaDB instance with the waterreport service account.',
    command: 'mariadb -u waterreport -ppassword',
    tip: 'Get password from an admin.',
  },
  {
    title: 'Execute generated SQL',
    summary: 'Paste the SQL script from this dialog to create tables and insert contaminant rows.',
    command: PLACEHOLDER_SCRIPT,
    tip: 'Wait for the final “Query OK” to confirm all statements have been applied.',
  },
  {
    title: 'Verify the data',
    summary: 'Run a quick aggregate to ensure the new rows landed.',
    command:
      'SELECT contaminant_name, COUNT(*) AS count\nFROM water_quality_reports\nGROUP BY contaminant_name\nORDER BY count DESC;',
    tip: 'Look for contaminants with unusually low counts—they often signal a parsing issue.',
  },
] as const;

type DeployGuideProps = {
  contaminantCount: number;
  sqlScript: string;
};

export const DeployGuide = ({ contaminantCount, sqlScript }: DeployGuideProps) => {
  const safeSqlScript = sqlScript?.trim() ? sqlScript : '/* Paste your generated SQL script here */';
  const [currentStep, setCurrentStep] = useState(0);
  const [complete, setComplete] = useState<boolean[]>(() => steps.map(() => false));
  const [copied, setCopied] = useState<string | null>(null);

  const progress = useMemo(() => {
    const done = complete.filter(Boolean).length;
    return Math.min(100, (done / steps.length) * 100);
  }, [complete]);

  const handleCopy = async (command: string) => {
    try {
      const text = command === PLACEHOLDER_SCRIPT ? safeSqlScript : command;
      await navigator.clipboard.writeText(text);
      setCopied(command);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Clipboard error', error);
    }
  };

  const advance = (index: number) => {
    setComplete((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="no-hover-glow rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Deployment progress</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {complete.filter(Boolean).length} of {steps.length} steps complete
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You generated SQL for <span className="font-semibold text-brand dark:text-sky-400">{contaminantCount}</span> contaminants.
              Walk through these checkpoints to load the data on Vulcan.
            </p>
          </div>
          <div className="min-w-[180px]">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[45vh] space-y-4 overflow-auto pr-1">
        {steps.map((step, index) => {
          const command = step.command === PLACEHOLDER_SCRIPT ? PLACEHOLDER_SCRIPT : step.command;
          const isActive = index === currentStep;
          const isDone = complete[index];

          return (
            <div
              key={step.title}
              className={clsx(
                'no-hover-glow rounded-2xl border px-5 py-4 transition-shadow',
                isActive
                  ? 'border-brand/60 bg-white/90 shadow-lg dark:border-sky-400/40 dark:bg-slate-900/80'
                  : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-slate-900/40'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'mt-1 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold',
                    isDone
                      ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                      : isActive
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-slate-300 text-slate-400 dark:border-white/10 dark:text-slate-500'
                  )}
                >
                  {isDone ? '✓' : index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{step.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleCopy(command)}
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition',
                          copied === command
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white'
                        )}
                      >
                        {copied === command ? 'Copied' : 'Copy'}
                      </button>
                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => setCurrentStep(index)}
                          className="hidden rounded-full border border-emerald-400/70 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 sm:inline-flex"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => advance(index)}
                          className="rounded-full border border-brand/40 px-3 py-1 text-xs text-brand transition hover:border-brand hover:text-brand-dark dark:border-sky-400/50 dark:text-sky-400 dark:hover:border-sky-300 dark:hover:text-sky-200"
                        >
                          Mark done
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 font-mono text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
                    {command === PLACEHOLDER_SCRIPT
                      ? 'Paste the SQL script generated in the first tab and press Enter to execute it.'
                      : step.command}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{step.tip}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeployGuide;
