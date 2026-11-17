import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { loadData } from '@/lib/db';
import { AuthProvider } from '@/lib/auth';
import { AppProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = { title: 'I am local (mock-up)', description: 'Interactive mock-up. All scores, reviews and deals are sample data.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: [{ media: '(prefers-color-scheme: light)', color: '#FFF7EB' }, { media: '(prefers-color-scheme: dark)', color: '#0E2527' }] };
export const revalidate = 60; // re-read Supabase at most once a minute

// Runs before first paint so there is no light flash for dark-mode visitors.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('ial-demo-v2')||'{}').theme||'system';var d=s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const data = await loadData();
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Source+Code+Pro:wght@600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <AppProvider data={data}>{children}</AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
