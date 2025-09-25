'use client';

import Link from 'next/link';
import { useTheme } from '@/components/providers/theme-provider';

const SunIcon = (
  <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2" />
    <path d="M12 19v2" />
    <path d="M5.22 5.22 6.64 6.64" />
    <path d="M17.36 17.36 18.78 18.78" />
    <path d="M3 12h2" />
    <path d="M19 12h2" />
    <path d="M5.22 18.78 6.64 17.36" />
    <path d="M17.36 6.64 18.78 5.22" />
  </svg>
);

const MoonIcon = (
  <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

export const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const headerClass = isDark
    ? 'border-b border-white/10 bg-[#020616]/95 text-slate-100'
    : 'border-b border-blue-500/30 bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600 text-white';

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-xl transition-colors ${headerClass}`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col leading-tight text-left">
          <span className="text-sm font-semibold uppercase tracking-widest text-sky-100/80 dark:text-sky-200/80">
            Water Quality Reporter
          </span>
          <span className="text-xs text-sky-100/70 dark:text-slate-300/80">Analyze → review → export your sample data</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/20 dark:border-white/20 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-white/40 dark:hover:bg-slate-700/60"
            aria-pressed={isDark}
          >
            {isDark ? SunIcon : MoonIcon}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <Link
            href="/deploy"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/15 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:border-white/25 dark:hover:bg-white/10"
          >
            <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path d="M12 3v16" />
              <path d="m6 13 6 6 6-6" />
              <path d="M6 7h12" />
            </svg>
            Connection Guide
          </Link>
        </div>
      </div>
    </header>
  );
};
