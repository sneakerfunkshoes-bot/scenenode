import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getCacheDir } from '@/lib/cache-dir';
import {
  amountsEqual,
  pickUniqueCheckoutAmount,
} from '@/lib/upi-payment';

const PAYMENTS_FILE = path.join(getCacheDir(), 'script-payments.json');

export type PaymentStatus = 'pending' | 'paid' | 'rejected' | 'expired';

export interface ScriptPaymentRecord {
  id: string;
  visitorId: string;
  status: PaymentStatus;
  amount: number;
  gatewayRef?: string;
  razorpayOrderId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

interface PaymentStore {
  records: ScriptPaymentRecord[];
}

async function loadStore(): Promise<PaymentStore> {
  try {
    const raw = await readFile(PAYMENTS_FILE, 'utf8');
    return JSON.parse(raw) as PaymentStore;
  } catch {
    return { records: [] };
  }
}

async function saveStore(store: PaymentStore): Promise<void> {
  await mkdir(path.dirname(PAYMENTS_FILE), { recursive: true });
  await writeFile(PAYMENTS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function newPaymentId(): string {
  return `SN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createPaymentSession(
  visitorId: string,
  options?: { amount?: number; razorpayOrderId?: string }
): Promise<ScriptPaymentRecord> {
  const store = await loadStore();
  const now = new Date().toISOString();

  const usedPending = store.records
    .filter((r) => r.status === 'pending')
    .map((r) => r.amount);

  const record: ScriptPaymentRecord = {
    id: newPaymentId(),
    visitorId,
    status: 'pending',
    amount: options?.amount ?? pickUniqueCheckoutAmount(usedPending),
    razorpayOrderId: options?.razorpayOrderId,
    createdAt: now,
    updatedAt: now,
  };

  store.records.unshift(record);
  if (store.records.length > 500) {
    store.records = store.records.slice(0, 500);
  }

  await saveStore(store);
  return record;
}

export async function attachRazorpayOrderId(
  paymentId: string,
  razorpayOrderId: string
): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  const record = store.records.find((r) => r.id === paymentId);
  if (!record) return null;
  record.razorpayOrderId = razorpayOrderId;
  record.updatedAt = new Date().toISOString();
  await saveStore(store);
  return record;
}

export async function getPaymentByRazorpayOrderId(
  razorpayOrderId: string
): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  return store.records.find((r) => r.razorpayOrderId === razorpayOrderId) ?? null;
}

export async function getPaymentById(id: string): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  return store.records.find((r) => r.id === id) ?? null;
}

export async function markPaymentPaid(
  paymentId: string,
  gatewayRef?: string
): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  const record = store.records.find((r) => r.id === paymentId);
  if (!record || record.status === 'paid') return record ?? null;

  record.status = 'paid';
  record.paidAt = new Date().toISOString();
  record.updatedAt = record.paidAt;
  if (gatewayRef) record.gatewayRef = gatewayRef;
  await saveStore(store);
  return record;
}

export async function rejectPayment(paymentId: string): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  const record = store.records.find((r) => r.id === paymentId);
  if (!record) return null;

  record.status = 'rejected';
  record.updatedAt = new Date().toISOString();
  await saveStore(store);
  return record;
}

export async function listPendingPayments(): Promise<ScriptPaymentRecord[]> {
  const store = await loadStore();
  return store.records.filter((r) => r.status === 'pending');
}

/** Claim newest pending order with exact paisa amount. */
export async function claimPendingPaymentByAmount(
  amount: number,
  gatewayRef?: string
): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  const pending = store.records
    .filter((r) => r.status === 'pending' && amountsEqual(r.amount, amount))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const record = pending[0];
  if (!record) return null;

  record.status = 'paid';
  record.paidAt = new Date().toISOString();
  record.updatedAt = record.paidAt;
  if (gatewayRef) record.gatewayRef = gatewayRef;
  await saveStore(store);
  return record;
}

/** Prefer order ID in SMS; else exact amount match. */
export async function claimPendingPaymentByOrderHint(
  smsText: string,
  amount: number,
  gatewayRef?: string
): Promise<ScriptPaymentRecord | null> {
  const store = await loadStore();
  const upper = smsText.toUpperCase();

  const pending = store.records.filter(
    (r) => r.status === 'pending' && amountsEqual(r.amount, amount)
  );

  const byId = pending.find((r) => upper.includes(r.id.toUpperCase()));
  if (byId) {
    byId.status = 'paid';
    byId.paidAt = new Date().toISOString();
    byId.updatedAt = byId.paidAt;
    if (gatewayRef) byId.gatewayRef = gatewayRef;
    await saveStore(store);
    return byId;
  }

  return claimPendingPaymentByAmount(amount, gatewayRef);
}

export async function listRecentPayments(limit = 20): Promise<ScriptPaymentRecord[]> {
  const store = await loadStore();
  return store.records.slice(0, limit);
}

export const approvePayment = markPaymentPaid;
