import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: 'Water Quality Reporter',
  description: 'Next.js migration workspace for transforming water quality reports into structured SQL scripts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-slate-900 transition-colors duration-300 dark:text-slate-100">
        <AppProviders>
          <div className="min-h-screen bg-transparent transition-colors duration-300">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
