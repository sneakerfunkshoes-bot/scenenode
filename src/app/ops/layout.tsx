import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Center',
  robots: { index: false, follow: false },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
