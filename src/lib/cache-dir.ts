import os from 'os';
import path from 'path';

/** Writable cache dir — uses /tmp on serverless where project .cache is read-only. */
export function getCacheDir(): string {
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.NETLIFY);

  if (isServerless) {
    return path.join(os.tmpdir(), 'scenenode-cache');
  }

  return path.join(process.cwd(), '.cache');
}
