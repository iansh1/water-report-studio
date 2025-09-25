import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { LinkProps } from 'next/link';
import { InteractiveSurface } from '@/components/ui/interactive-surface';
import { AUTH_REDIRECT_PARAM } from '@/lib/constants';

const ThemeFloatToggle = dynamic(() => import('@/components/ui/theme-float-toggle'), { ssr: false });

export default function HomePage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const requestedParam = typeof searchParams?.[AUTH_REDIRECT_PARAM] === 'string' ? (searchParams?.[AUTH_REDIRECT_PARAM] as string) : '/dashboard';
  const requestedPath = requestedParam.startsWith('/') ? requestedParam : '/dashboard';
  const unlockHref: LinkProps<'/unlock'>['href'] = {
    pathname: '/unlock',
    query: { [AUTH_REDIRECT_PARAM]: requestedPath },
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 transition-colors duration-300">
      <ThemeFloatToggle className="fixed bottom-8 right-8 z-40 sm:bottom-12 sm:right-12" />
      <InteractiveSurface className="mx-auto w-full max-w-5xl p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-brand dark:bg-sky-500/20 dark:text-sky-200">
              Water Report to Maria
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-1000 dark:text-slate-100 sm:text-5xl">
              From raw PDF reports to MariaDB-ready.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Upload a water quality report, validate contaminants with smart editing, and ship the results to MariaDB using a
              checklist.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={unlockHref}
                className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-base font-medium text-white shadow hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Get started
              </Link>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Made by Ian</p>
          </div>
          <div className="hidden h-full w-full max-w-sm space-y-5 lg:block">
            <InteractiveSurface className="no-hover-glow gap-3 rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">How it flows</h2>
                <ul className="mt-4 space-y-3">
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand dark:bg-sky-400" />
                    Upload a water quality PDF and let the parser extract contaminant rows automatically.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand dark:bg-sky-400" />
                    Review and tweak fields inline with instant preview of the source PDF.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand dark:bg-sky-400" />
                    Generate SQL and follow the built-in deployment guide to load Vulcan’s MariaDB.
                  </li>
                </ul>
              </div>
            </InteractiveSurface>
          </div>
        </div>
      </InteractiveSurface>
    </main>
  );
}
