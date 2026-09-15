import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AE Script Bundle',
  description: 'Buy the SceneNode After Effects script bundle for ₹499. Resellers earn ₹300 per sale.',
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
