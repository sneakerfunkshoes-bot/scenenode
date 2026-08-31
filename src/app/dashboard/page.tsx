import { redirect } from 'next/navigation';

/** Legacy Breakdown Studio removed — send users to the Reference Analysis workspace. */
export default function DashboardPage() {
  redirect('/inspect?workspace=1');
}
