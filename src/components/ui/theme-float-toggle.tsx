'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/theme-provider';

type ThemeState = {
  label: string;
  caption: string;
  gradient: string;
  glyph: JSX.Element;
};

const SunGlyph = (
  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
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

const MoonGlyph = (
  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

const THEME_CONFIG: Record<'light' | 'dark', ThemeState> = {
  light: {
    label: 'Drift to dusk',
    caption: 'Switch to the obsidian workspace',
    gradient: 'from-sky-200/80 via-indigo-200/40 to-transparent',
    glyph: MoonGlyph,
  },
  dark: {
    label: 'Surface to dawn',
    caption: 'Return to the bright studio',
    gradient: 'from-indigo-500/50 via-slate-900/60 to-transparent',
    glyph: SunGlyph,
  },
};

type ThemeFloatToggleProps = {
  className?: string;
};

export const ThemeFloatToggle = ({ className }: ThemeFloatToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  const themeState = useMemo(() => THEME_CONFIG[theme], [theme]);

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={themeState.label}
      className={clsx(
        'group relative inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/40 px-4 py-2 pr-5 text-left text-slate-800 shadow-lg backdrop-blur-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:border-white/20 dark:bg-slate-800/70 dark:text-slate-100 dark:shadow-[0_25px_80px_-40px_rgba(15,23,42,0.85)]',
        className
      )}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
    >
      <span
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-slate-700 transition-colors dark:border-white/30 dark:text-sky-100',
          theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/60'
        )}
      >
        {themeState.glyph}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{themeState.label}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{themeState.caption}</span>
      </span>
      <motion.span
        aria-hidden
        className={clsx(
          'pointer-events-none absolute -inset-1 rounded-full opacity-70 blur-md transition group-hover:opacity-100',
          `bg-gradient-to-r ${themeState.gradient}`
        )}
        layoutId="theme-toggle-glow"
      />
    </motion.button>
  );
};

export default ThemeFloatToggle;
