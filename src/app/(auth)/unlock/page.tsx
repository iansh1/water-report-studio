import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { UnlockForm, UnlockFormState } from '@/components/unlock-form';
import { AUTH_COOKIE_NAME, AUTH_REDIRECT_PARAM } from '@/lib/constants';
import { setAuthCookie, verifyPassword } from '@/lib/auth';

const initialState: UnlockFormState = {};

export default function UnlockPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const redirectTarget = typeof searchParams?.[AUTH_REDIRECT_PARAM] === 'string' ? (searchParams?.[AUTH_REDIRECT_PARAM] as string) : '/dashboard';
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.has(AUTH_COOKIE_NAME);

  if (isAuthenticated) {
    redirect(redirectTarget);
  }

  const unlockAction = async (_prevState: UnlockFormState, formData: FormData): Promise<UnlockFormState> => {
    'use server';

    const password = formData.get('password');
    const target = (formData.get(AUTH_REDIRECT_PARAM) as string) || '/dashboard';

    if (typeof password !== 'string') {
      return { error: 'Password is required.' };
    }

    if (!(await verifyPassword(password))) {
      return { error: 'Incorrect password. Please try again.' };
    }

    await setAuthCookie();
    redirect(target);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Unlock Water Quality Reporter</h1>
          <p className="text-sm text-slate-200">
            Enter the shared internal password to access the dashboards.
          </p>
        </div>
        <div className="mt-8">
          <UnlockForm action={unlockAction} defaultRedirect={redirectTarget} initialState={initialState} />
        </div>
      </div>
    </main>
  );
}
