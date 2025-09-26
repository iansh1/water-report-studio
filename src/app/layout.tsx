import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: 'Water Quality Reporter',
  description: 'Workspace for transforming water quality reports into SQL scripts',
  keywords: ['water quality', 'PDF reports', 'SQL scripts', 'data transformation', 'MariaDB'],
  authors: [{ name: 'Ian' }],
  creator: 'Ian',
  publisher: 'Water Quality Reporter',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://waterreportapp.vercel.app'),
  openGraph: {
    title: 'Water Quality Reporter',
    description: 'Workspace for transforming water quality reports into SQL scripts',
    url: '/',
    siteName: 'Water Quality Reporter',
    images: [
      {
        url: '/og-image',
        width: 1200,
        height: 630,
        alt: 'Water Quality Reporter - Transform PDF reports into SQL scripts',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Quality Reporter',
    description: 'Workspace for transforming water quality reports into SQL scripts',
    creator: '@water_reporter',
    images: ['/og-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
