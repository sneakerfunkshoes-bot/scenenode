import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reseller dashboard',
  robots: { index: false, follow: false },
};

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
