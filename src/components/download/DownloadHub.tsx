'use client';

import { useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { Navbar } from '@/components/hero/Navbar';
import { ScriptsPaymentCheckout } from '@/components/download/ScriptsPaymentCheckout';
import { AE_BUNDLE_FILE, AE_SCRIPTS } from '@/lib/ae-scripts-catalog';
import { downloadAeScript, downloadAeScripts } from '@/lib/download-ae-scripts';

export function DownloadHub() {
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const onUnlocked = useCallback(() => {
    setUnlocked(true);
  }, []);

  const onDownload = async (fileName: string, handler: () => Promise<void>) => {
    setDownloading(fileName);
    setError('');
    try {
      const unlockRes = await fetch('/api/scripts/payment/unlock', {
        method: 'POST',
        credentials: 'include',
      });
      const unlockData = (await unlockRes.json()) as { unlocked?: boolean };
      if (!unlockRes.ok || !unlockData.unlocked) {
        setError('Complete payment to unlock downloads.');
        return;
      }
      await handler();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pb-12 pt-20 sm:px-6 sm:pt-24">
        <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl sm:p-8">
          <h1 className="mb-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            After Effects Scripts
          </h1>
          <p className="mb-8 text-sm text-zinc-400">
            Download the SceneNode script pack for After Effects CC and newer.
          </p>

          {!unlocked ? (
            <ScriptsPaymentCheckout onUnlocked={onUnlocked} className="mb-8" />
          ) : null}

          {error ? <p className="mb-4 text-center text-xs text-red-400">{error}</p> : null}

          <button
            type="button"
            disabled={!unlocked || downloading === AE_BUNDLE_FILE}
            onClick={() => void onDownload(AE_BUNDLE_FILE, downloadAeScripts)}
            className="mb-8 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 px-4 font-semibold text-black shadow-sm transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={18} />
            <span>
              {downloading === AE_BUNDLE_FILE ? 'Downloading…' : 'Download Complete Script Bundle (.ZIP)'}
            </span>
          </button>

          <div className="border-t border-zinc-800 pt-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-400">
              Individual scripts
            </h2>
            <div className="space-y-3">
              {AE_SCRIPTS.map((script) => (
                <div
                  key={script.fileName}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{script.title}</p>
                    <p className="text-xs text-zinc-500">{script.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!unlocked || downloading === script.fileName}
                    onClick={() =>
                      void onDownload(script.fileName, () => downloadAeScript(script.fileName))
                    }
                    className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {downloading === script.fileName ? '…' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
