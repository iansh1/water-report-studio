'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AnimatePresence, motion } from 'framer-motion';
import { useWaterStore } from '@/store/useWaterStore';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const MIN_WIDTH = 280;
const MAX_WIDTH = 760;
const PANEL_TOP_OFFSET_REM = 5.5; // matches sticky offset below header

const PanelContainer = ({ width, children }: { width: number; children: React.ReactNode }) => (
  <div
    className="hidden flex-shrink-0 min-h-0 lg:sticky lg:top-[5.5rem] lg:flex lg:flex-col"
    style={{ width, height: `calc(100vh - ${PANEL_TOP_OFFSET_REM}rem)`, maxHeight: `calc(100vh - ${PANEL_TOP_OFFSET_REM}rem)` }}
  >
    {children}
  </div>
);

export const PdfPreviewPanelClient = () => {
  const pdfUrl = useWaterStore((state) => state.pdfPreviewUrl);
  const fileName = useWaterStore((state) => state.pdfMeta?.fileName);

  const [width, setWidth] = useState(420);
  const [scale, setScale] = useState(1.1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const startXRef = useRef(0);
  const startWidthRef = useRef(width);
  const isDraggingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageNumberRef = useRef(pageNumber);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const delta = startXRef.current - event.clientX;
    const next = Math.min(Math.max(startWidthRef.current + delta, MIN_WIDTH), MAX_WIDTH);
    setWidth(next);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (numPages && pageNumber > numPages) {
      setPageNumber(numPages);
    }
  }, [numPages, pageNumber]);

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = width;
    event.preventDefault();
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.1);
  const registerPageRef = useCallback(
    (page: number) => (node: HTMLDivElement | null) => {
      const current = pageRefs.current[page];
      const observer = observerRef.current;

      if (current && observer) {
        observer.unobserve(current);
      }

      if (node) {
        pageRefs.current[page] = node;
        node.dataset.pageNumber = String(page);
        observer?.observe(node);
      } else {
        delete pageRefs.current[page];
      }
    },
    []
  );

  const scrollToPage = useCallback((target: number) => {
    const node = pageRefs.current[target];
    const container = contentRef.current;

    if (!node) {
      return;
    }

    if (container && container.contains(node)) {
      const nodeRect = node.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = nodeRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top, behavior: 'smooth' });
    } else {
      node.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }, []);

  const goToPage = useCallback(
    (target: number) => {
      setPageNumber(target);
      scrollToPage(target);
    },
    [scrollToPage]
  );

  const handleNextPage = () => {
    if (!numPages) return;
    const next = Math.min(numPages, pageNumber + 1);
    if (next !== pageNumber) {
      goToPage(next);
    }
  };

  const handlePrevPage = () => {
    if (!numPages) return;
    const prev = Math.max(1, pageNumber - 1);
    if (prev !== pageNumber) {
      goToPage(prev);
    }
  };

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const toolbarTitle = useMemo(() => {
    if (!fileName) return 'PDF Preview';
    return fileName.length > 40 ? `${fileName.slice(0, 37)}…` : fileName;
  }, [fileName]);

  const pageNumbers = useMemo(() => {
    if (!numPages) return [] as number[];
    return Array.from({ length: numPages }, (_, index) => index + 1);
  }, [numPages]);

  useEffect(() => {
    pageRefs.current = {};
    observerRef.current?.disconnect();
    observerRef.current = null;
    setNumPages(null);
    setPageNumber(1);
    pageNumberRef.current = 1;
    const container = contentRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [pdfUrl]);

  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) {
          return;
        }

        const topEntry = visible[0];
        const element = topEntry.target as HTMLElement;
        const pageAttr = element.dataset.pageNumber;
        const visiblePage = pageAttr ? Number(pageAttr) : NaN;

        if (Number.isFinite(visiblePage) && visiblePage !== pageNumberRef.current) {
          pageNumberRef.current = visiblePage;
          setPageNumber(visiblePage);
        }
      },
      {
        root: container,
        threshold: [0.2, 0.4, 0.6, 0.8],
      }
    );

    observerRef.current = observer;

    Object.values(pageRefs.current).forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [pageNumbers.length]);

  if (!pdfUrl) {
    return (
      <PanelContainer width={width}>
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500 shadow-soft dark:border-white/15 dark:bg-[#070b16] dark:text-slate-200">
          Upload a report to preview the PDF here. The viewer updates automatically when a new file is processed.
        </div>
      </PanelContainer>
    );
  }

  if (isCollapsed) {
    return (
      <PanelContainer width={64}>
        <button
          type="button"
          onClick={toggleCollapse}
          className="mt-4 inline-flex h-40 items-center justify-center self-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow hover:border-brand/40 hover:text-brand dark:border-white/20 dark:bg-slate-900/80 dark:text-slate-200"
        >
          Show PDF
        </button>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer width={width}>
      <div className="relative h-full min-h-0">
        <div
          onMouseDown={startResize}
          className="group absolute -left-6 top-0 hidden h-full w-12 cursor-col-resize items-center justify-center lg:flex"
          role="presentation"
          aria-hidden
        >
          <div className="flex h-20 items-center justify-center gap-1 rounded-full bg-white px-2 py-6 shadow-md ring-1 ring-slate-300 transition group-hover:ring-brand dark:bg-slate-900 dark:ring-white/20">
            <span className="block h-full w-1 rounded-full bg-slate-400 transition group-hover:bg-brand dark:bg-slate-500" />
            <span className="block h-full w-1 rounded-full bg-slate-300 transition group-hover:bg-brand/70 dark:bg-slate-600" />
          </div>
        </div>
        <div className="card-surface no-hover-glow relative flex h-full min-h-0 flex-col overflow-hidden backdrop-blur">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-900/60">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Source PDF</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{toolbarTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
              >
                –
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={toggleCollapse}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
              >
                Hide
              </button>
            </div>
          </header>

          <div
            ref={contentRef}
            className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950/60"
            style={{
              direction: 'rtl',
              paddingInlineStart: '1.25rem',
              paddingInlineEnd: '0.75rem',
              paddingBlockStart: '1rem',
              paddingBlockEnd: '1rem',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={pdfUrl}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="flex w-full items-start justify-start"
              >
                <div className="flex min-w-max flex-col items-start gap-6" style={{ direction: 'ltr' }}>
                  <Document
                    file={pdfUrl}
                    loading={<div className="py-12 text-sm text-slate-500 dark:text-slate-400">Loading PDF…</div>}
                    onLoadSuccess={({ numPages }) => {
                      pageRefs.current = {};
                      setNumPages(numPages);
                      setPageNumber(1);
                    }}
                    onLoadError={(err) => {
                      console.error('PDF preview error', err);
                    }}
                  >
                    {(pageNumbers.length > 0 ? pageNumbers : [1]).map((page) => (
                      <Page
                        key={`pdf-page-${page}`}
                        pageNumber={page}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className={`max-w-none rounded-2xl border border-slate-200 bg-white shadow transition dark:border-white/10 dark:bg-slate-900/80 ${
                          page === pageNumber ? 'ring-1 ring-brand/40 dark:ring-sky-400/50' : ''
                        }`}
                        style={{ width: 'auto' }}
                        inputRef={registerPageRef(page)}
                      />
                    ))}
                  </Document>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {numPages && numPages > 1 ? (
            <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
              <span>
                Page {pageNumber} of {numPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={pageNumber >= numPages}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  Next
                </button>
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </PanelContainer>
  );
};
