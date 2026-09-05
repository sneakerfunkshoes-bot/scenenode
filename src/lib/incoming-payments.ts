import 'server-only';

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getCacheDir } from '@/lib/cache-dir';
import { amountsEqual } from '@/lib/upi-amounts';

const INCOMING_FILE = path.join(getCacheDir(), 'payments-incoming.json');
const RETENTION_MS = 5 * 60 * 1000;

export interface IncomingPaymentRecord {
  id: string;
  sender?: string;
  message: string;
  amount: number;
  timestamp: number;
}

interface IncomingStore {
  records: IncomingPaymentRecord[];
}

async function loadStore(): Promise<IncomingStore> {
  try {
    const raw = await readFile(INCOMING_FILE, 'utf8');
    return JSON.parse(raw) as IncomingStore;
  } catch {
    return { records: [] };
  }
}

async function saveStore(store: IncomingStore): Promise<void> {
  await mkdir(path.dirname(INCOMING_FILE), { recursive: true });
  await writeFile(INCOMING_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function prune(store: IncomingStore): IncomingPaymentRecord[] {
  const cutoff = Date.now() - RETENTION_MS;
  return store.records.filter((r) => r.timestamp >= cutoff);
}

export async function recordIncomingPayment(input: {
  sender?: string;
  message: string;
  amount: number;
}): Promise<IncomingPaymentRecord> {
  const store = await loadStore();
  const record: IncomingPaymentRecord = {
    id: `in_${Date.now().toString(36)}`,
    sender: input.sender,
    message: input.message.slice(0, 500),
    amount: input.amount,
    timestamp: Date.now(),
  };

  store.records = [record, ...prune(store)].slice(0, 200);
  await saveStore(store);
  return record;
}

/** Find a credited SMS amount received within the last `windowMs`. */
export async function findRecentIncomingByAmount(
  amount: number,
  windowMs = 60_000
): Promise<IncomingPaymentRecord | null> {
  const store = await loadStore();
  const cutoff = Date.now() - windowMs;
  const match = store.records.find(
    (r) => r.timestamp >= cutoff && amountsEqual(r.amount, amount)
  );
  return match ?? null;
}
