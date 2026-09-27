import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@neon-grid/kit-core/theme.css';

export const metadata: Metadata = { title: 'Neon Grid · Next.js', description: 'A native React theme with quiet animated light and readable conversation panels.' };
export const viewport: Viewport = { themeColor: '#0a0a12', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body style={{ margin: 0 }}>{children}</body></html>;
}
