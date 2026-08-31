import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | scenenode',
  description: 'Redirects to Reference Analysis.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
