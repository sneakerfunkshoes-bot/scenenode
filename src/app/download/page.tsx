import { redirect } from 'next/navigation';

/** Script selling removed — send visitors to edit deconstruction. */
export default function DownloadPage() {
  redirect('/inspect?workspace=1');
}
