/** Hand off a local file from the landing page to /inspect in the same tab. */
let pendingFile: File | null = null;
let pendingEditorId: string | null = null;

export function setPendingInspectFile(file: File, editorId?: string) {
  pendingFile = file;
  pendingEditorId = editorId ?? null;
}

export function takePendingInspectFile(): { file: File; editorId: string | null } | null {
  if (!pendingFile) return null;
  const payload = { file: pendingFile, editorId: pendingEditorId };
  pendingFile = null;
  pendingEditorId = null;
  return payload;
}
