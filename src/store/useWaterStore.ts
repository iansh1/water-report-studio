import { create } from 'zustand';
import { ContaminantRecord, PdfExtractionResult } from '@/pdf/types';

export type ContaminantWithId = ContaminantRecord & { __id: string };

type PdfMeta = {
  fileName: string;
  size: number;
  pageCount?: number;
};

type WaterStore = {
  pdfMeta?: PdfMeta;
  rawText?: string;
  contaminants: ContaminantWithId[];
  warnings: string[];
  isProcessing: boolean;
  error?: string;
  pdfPreviewUrl?: string;
  startProcessing: (meta?: PdfMeta) => void;
  setResult: (result: PdfExtractionResult) => void;
  setError: (message: string | undefined) => void;
  updateContaminant: (id: string, updates: Partial<ContaminantRecord>) => void;
  removeContaminant: (id: string) => void;
  setPdfPreviewUrl: (url?: string) => void;
  reset: () => void;
};

const createInternalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `contaminant-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

export const useWaterStore = create<WaterStore>((set) => ({
  contaminants: [],
  warnings: [],
  isProcessing: false,
  pdfPreviewUrl: undefined,
  startProcessing: (meta) =>
    set(() => ({
      pdfMeta: meta,
      contaminants: [],
      warnings: [],
      rawText: undefined,
      isProcessing: true,
      error: undefined,
      pdfPreviewUrl: undefined,
    })),
  setResult: (result) =>
    set((state) => ({
      contaminants: (result.contaminants ?? []).map((contaminant) => ({
        ...contaminant,
        __id: createInternalId(),
      })),
      warnings: result.warnings,
      rawText: result.rawText,
      pdfMeta: {
        fileName: result.metadata.fileName,
        size: state.pdfMeta?.size ?? 0,
        pageCount: result.metadata.pageCount,
      },
      isProcessing: false,
      error: undefined,
      pdfPreviewUrl: state.pdfPreviewUrl,
    })),
  setError: (message) =>
    set(() => ({
      error: message,
      isProcessing: false,
    })),
  updateContaminant: (id, updates) =>
    set((state) => ({
      contaminants: state.contaminants.map((contaminant) =>
        contaminant.__id === id
          ? {
              ...contaminant,
              ...updates,
            }
          : contaminant
      ),
    })),
  removeContaminant: (id) =>
    set((state) => ({
      contaminants: state.contaminants.filter((contaminant) => contaminant.__id !== id),
    })),
  setPdfPreviewUrl: (url) =>
    set(() => ({
      pdfPreviewUrl: url,
    })),
  reset: () =>
    set(() => ({
      pdfMeta: undefined,
      rawText: undefined,
      contaminants: [],
      warnings: [],
      isProcessing: false,
      error: undefined,
      pdfPreviewUrl: undefined,
    })),
}));
