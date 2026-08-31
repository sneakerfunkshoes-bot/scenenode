import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { UsageTracker } from '@/components/UsageTracker';
import { ClientAnalytics } from '@/components/ClientAnalytics';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://scenenode.app'),
  title: {
    default: 'scenenode | Deconstruct the Edit',
    template: '%s | scenenode',
  },
  description:
    'Reverse-engineer short-form video edits into beat-synced breakdowns, layered effect recipes, and step-by-step recreation guides for DaVinci Resolve, Premiere Pro, After Effects, CapCut, and VN.',
  keywords: [
    'video edit analysis',
    'short form edit breakdown',
    'CapCut tutorial',
    'After Effects recreation',
    'beat sync edit',
    'color grade analysis',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'scenenode',
    title: 'scenenode | Deconstruct the Edit',
    description:
      'Upload a reference or paste a Reel link. Get beats, cuts, layered effects, and a recreation guide for your NLE.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'scenenode' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'scenenode | Deconstruct the Edit',
    description:
      'Reverse-engineer short-form edits into beat-synced breakdowns and recreation guides.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/favicon.png?v=scenenode', type: 'image/png' }],
    apple: [{ url: '/logo.png?v=scenenode', type: 'image/png' }],
    shortcut: '/favicon.png?v=scenenode',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} font-sans min-h-screen bg-black text-silver antialiased`}>
        <ClientAnalytics>
          <UsageTracker />
          {children}
        </ClientAnalytics>
      </body>
    </html>
  );
}
