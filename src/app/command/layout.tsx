import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-command-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Command Center',
  description: 'Velop AI Employee Workspace and Master Command Center.',
  robots: { index: false, follow: false },
};

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${mono.variable} min-h-screen`}>{children}</div>;
}
