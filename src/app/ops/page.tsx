import { redirect } from 'next/navigation';

/** Legacy ops telemetry view — now the Master Command Center. */
export default function OpsDashboardPage() {
  redirect('/command');
}
