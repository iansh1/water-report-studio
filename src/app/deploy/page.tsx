import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DeployGuide } from '@/components/dashboard/deploy-guide';
import { InteractiveSurface } from '@/components/ui/interactive-surface';
import { AUTH_COOKIE_NAME, AUTH_REDIRECT_PARAM } from '@/lib/constants';
import { isRequestAuthenticated } from '@/lib/auth-edge';

export default async function DeployPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!(await isRequestAuthenticated(token))) {
    redirect(`/?${AUTH_REDIRECT_PARAM}=${encodeURIComponent('/deploy')}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="no-hover-glow rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft dark:border-white/10 dark:bg-slate-900/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">MariaDB Connection Guide</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Step through the same deployment checklist you receive after generating SQL. Keep this handy when you just need the
              connection instructions.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="no-hover-glow inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="m15 18-6-6 6-6" />
              <path d="M9 12h12" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <InteractiveSurface className="no-hover-glow flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-soft transition hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/75">
        <DeployGuide contaminantCount={0} sqlScript={''} />
      </InteractiveSurface>
    </div>
  );
}
