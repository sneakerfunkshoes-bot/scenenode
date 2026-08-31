import type { Metadata } from 'next';
import { DownloadHub } from '@/components/download/DownloadHub';

export const metadata: Metadata = {
  title: 'Download AE Scripts | scenenode',
  description: 'Download SceneNode After Effects script pack — Auto Edit, Beat Mark, and Vault.',
};

export default function DownloadPage() {
  return <DownloadHub />;
}
