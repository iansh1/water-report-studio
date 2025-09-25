import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { AUTH_COOKIE_NAME, AUTH_REDIRECT_PARAM } from '@/lib/constants';
import { isRequestAuthenticated } from '@/lib/auth-edge';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isRequestAuthenticated(token);

  if (!authenticated) {
    const target = '/dashboard';
    redirect(`/?${AUTH_REDIRECT_PARAM}=${encodeURIComponent(target)}`);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-[#01030a]">
      <TopBar />
      <main className="relative flex-1 pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_-8%,rgba(59,130,246,0.18),transparent_48%),radial-gradient(circle_at_88%_-10%,rgba(56,189,248,0.12),transparent_40%)] opacity-70 dark:opacity-0" />
        <div className="pointer-events-none absolute inset-0 -z-20 hidden bg-[radial-gradient(circle_at_15%_-10%,rgba(59,130,246,0.3),transparent_48%),radial-gradient(circle_at_82%_-5%,rgba(56,189,248,0.2),transparent_45%)] dark:block" />
        {children}
      </main>
    </div>
  );
}
