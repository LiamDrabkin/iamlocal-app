import { THEMES } from '@/lib/themes';
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
// Runs before first paint so there is no flash. Mirrors resolveTheme() in lib/themes.ts.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('ial-demo-v2')||'{}'),M=${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, t.mode])))},t=s.theme||'system',d=matchMedia('(prefers-color-scheme: dark)').matches,id=t==='system'?(d?s.darkPick:s.lightPick):t==='light'?s.lightPick:t==='dark'?s.darkPick:t;if(!M[id])id=(t==='dark'||(t==='system'&&d))?'night':'brand';var r=document.documentElement;r.dataset.theme=M[id];r.dataset.skin=id}catch(e){}`;

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
