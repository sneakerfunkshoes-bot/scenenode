async function downloadScriptBlob(fileName: string): Promise<Blob> {
  const res = await fetch(`/api/scripts/download?file=${encodeURIComponent(fileName)}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || 'Download failed. Complete payment verification first.');
  }

  return res.blob();
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadAeScripts(): Promise<void> {
  const blob = await downloadScriptBlob('SceneNode_AE_Scripts.zip');
  triggerBlobDownload(blob, 'SceneNode_AE_Scripts.zip');
}

export async function downloadAeScript(fileName: string): Promise<void> {
  const blob = await downloadScriptBlob(fileName);
  triggerBlobDownload(blob, fileName);
}
