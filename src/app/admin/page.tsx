import type { Metadata } from 'next';
import { AdminPanel } from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Admin | scenenode',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
