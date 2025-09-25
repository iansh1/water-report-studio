'use client';

import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ContaminantRecord } from '@/pdf/types';
import { useWaterStore } from '@/store/useWaterStore';

const STEPS = [
  { id: 0, label: 'Select PDF' },
  { id: 1, label: 'Upload & analyze' },
  { id: 2, label: 'Extract contaminant data' },
  { id: 3, label: 'Ready for review' },
];

const formatSize = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const updateSurfaceHighlight = (event: MouseEvent<HTMLElement>) => {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--hover-x', `${x}%`);
  card.style.setProperty('--hover-y', `${y}%`);
};

export const UploadPanel = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    startProcessing,
    setResult,
    setError,
    reset,
    pdfMeta,
    contaminants,
    warnings,
    isProcessing,
    error,
    setPdfPreviewUrl,
  } = useWaterStore();
  const previewUrlRef = useRef<string | null>(null);

  const handleSelectClick = () => {
    setLocalError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await processFile(file);
    event.target.value = '';
  };

  const processFile = async (file: File) => {
    setStatusMessage(null);
    setLocalError(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    startProcessing({ fileName: file.name, size: file.size });
    setCurrentStep(1);

    setPdfPreviewUrl(previewUrl);

    const formData = new FormData();
    formData.append('waterreport', file);

    try {
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed to process PDF report.' }));
        const message = payload?.error ?? 'Failed to process PDF report.';
        setError(message);
        setLocalError(message);
        setCurrentStep(0);
        setPdfPreviewUrl(undefined);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        return;
      }

      setCurrentStep(2);
      const result = await response.json();
      setResult(result);

      if (process.env.NODE_ENV !== 'production') {
        const contaminantsList: ContaminantRecord[] = result.contaminants ?? [];
        const header = `[upload] ${file.name} → ${contaminantsList.length} contaminants`;

        if (contaminantsList.length > 0) {
          console.groupCollapsed(header);
          contaminantsList.forEach((item, index) => {
            const preview = item.rawText ?? JSON.stringify(item);
            console.log(`#${index + 1} ${item.Contaminant || 'Unknown'} → ${preview}`);
          });
          if (Array.isArray(result.warnings) && result.warnings.length > 0) {
            console.warn('Warnings:', result.warnings);
          }
          console.groupEnd();
        } else {
          console.info(header);
        }
      }

      setCurrentStep(3);

      const previewNames = (result.contaminants ?? [])
        .slice(0, 5)
        .map((contaminant: ContaminantRecord) => contaminant.Contaminant)
        .filter(Boolean);

      const previewText = previewNames.length
        ? ` → ${previewNames.join(', ')}${result.contaminants.length > previewNames.length ? '…' : ''}`
        : '';

      setStatusMessage(`Extracted ${result.contaminants.length} contaminants from ${file.name}${previewText}.`);
    } catch (err) {
      console.error('Upload error', err);
      const message = 'Unable to upload report. Please try again.';
      setError(message);
      setLocalError(message);
      setCurrentStep(0);
      setPdfPreviewUrl(undefined);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    }
  };

  const activeWarnings = useMemo(() => warnings?.filter(Boolean) ?? [], [warnings]);

  return (
    <div
      className="card-surface p-8 backdrop-blur"
      onMouseMove={updateSurfaceHighlight}
      onMouseLeave={(event) => {
        event.currentTarget.style.removeProperty('--hover-x');
        event.currentTarget.style.removeProperty('--hover-y');
      }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Upload Water Quality Report</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select a PDF report to extract contaminant data. The processed values populate the editor for review.
          </p>
          {localError || error ? (
            <p className="mt-2 text-sm font-medium text-red-500 dark:text-rose-300">
              {localError || error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectClick}
            disabled={isProcessing}
            className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? 'Processing…' : 'Select PDF'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setCurrentStep(0);
              setStatusMessage(null);
              setLocalError(null);
              setPdfPreviewUrl(undefined);
              if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
              }
            }}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/20 dark:text-slate-200 dark:hover:border-white/40 dark:hover:text-white"
          >
            Clear Session
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 dark:border-white/10 dark:bg-slate-900/60">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Progress</h3>
            <ol className="mt-4 space-y-3">
              {STEPS.map((step) => {
                const isActive = currentStep >= step.id;
                return (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
                        isActive
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-300 text-slate-400 dark:border-white/20 dark:text-slate-500'
                      }`}
                    >
                      {step.id + 1}
                    </span>
                    <span className={isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/60">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Current Upload</h3>
            <dl className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <dt>File name</dt>
                <dd className="text-slate-500 dark:text-slate-400">{pdfMeta?.fileName ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>File size</dt>
                <dd className="text-slate-500 dark:text-slate-400">{formatSize(pdfMeta?.size)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Pages detected</dt>
                <dd className="text-slate-500 dark:text-slate-400">{pdfMeta?.pageCount ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Contaminants extracted</dt>
                <dd className="text-slate-500 dark:text-slate-400">{contaminants.length}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-700 transition dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          <p className="font-semibold">Next steps</p>
          <p className="mt-2">
            Review the extracted contaminant rows in the editor panel (work in progress) and apply any adjustments before generating
            SQL.
          </p>
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 text-sm text-blue-700 transition dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-200">
            {statusMessage}
          </div>
        ) : null}

        {activeWarnings.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-700 transition dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="font-semibold">Warnings</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {activeWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};
