import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomBytes } from 'crypto';
import path from 'path';
import { getCacheDir } from '@/lib/cache-dir';
import {
  MIN_PAYOUT_INR,
  RESELLER_COMMISSION_INR,
  SCRIPT_BUNDLE_PRICE_INR,
  normalizeResellerCode,
} from '@/lib/script-catalog';

const STORE_FILE = path.join(getCacheDir(), 'reseller-ledger.json');

export type PayoutStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface ResellerPartner {
  code: string;
  createdAt: string;
  visitorId: string;
}

export interface ResellerSale {
  id: string;
  code: string;
  paymentId: string;
  amount: number;
  commission: number;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  code: string;
  upiId: string;
  upiName: string;
  amount: number;
  status: PayoutStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

interface Ledger {
  partners: ResellerPartner[];
  sales: ResellerSale[];
  withdrawals: WithdrawalRequest[];
}

async function loadLedger(): Promise<Ledger> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Ledger>;
    return {
      partners: parsed.partners ?? [],
      sales: parsed.sales ?? [],
      withdrawals: parsed.withdrawals ?? [],
    };
  } catch {
    return { partners: [], sales: [], withdrawals: [] };
  }
}

async function saveLedger(ledger: Ledger): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(ledger, null, 2));
}

function newCode(): string {
  return `SN_${randomBytes(4).toString('hex').toUpperCase()}`;
}

export { normalizeResellerCode } from '@/lib/script-catalog';

export async function getOrCreatePartner(visitorId: string, existingCode?: string | null) {
  const ledger = await loadLedger();
  const fromCookie = normalizeResellerCode(existingCode);
  if (fromCookie) {
    const match = ledger.partners.find((p) => p.code === fromCookie);
    if (match) return match;
  }

  const byVisitor = ledger.partners.find((p) => p.visitorId === visitorId);
  if (byVisitor) return byVisitor;

  const partner: ResellerPartner = {
    code: newCode(),
    createdAt: new Date().toISOString(),
    visitorId,
  };
  ledger.partners.unshift(partner);
  await saveLedger(ledger);
  return partner;
}

export async function getPartner(code: string): Promise<ResellerPartner | null> {
  const normalized = normalizeResellerCode(code);
  if (!normalized) return null;
  const ledger = await loadLedger();
  return ledger.partners.find((p) => p.code === normalized) ?? null;
}

export function availableBalance(ledger: Pick<Ledger, 'sales' | 'withdrawals'>, code: string): number {
  const earned = ledger.sales
    .filter((s) => s.code === code)
    .reduce((sum, s) => sum + s.commission, 0);
  const reserved = ledger.withdrawals
    .filter((w) => w.code === code && (w.status === 'PENDING' || w.status === 'PAID'))
    .reduce((sum, w) => sum + w.amount, 0);
  return Math.max(0, earned - reserved);
}

export async function getResellerSummary(code: string) {
  const ledger = await loadLedger();
  const partner = ledger.partners.find((p) => p.code === code);
  if (!partner) return null;

  const sales = ledger.sales.filter((s) => s.code === code);
  const withdrawals = ledger.withdrawals.filter((w) => w.code === code);
  const earned = sales.reduce((sum, s) => sum + s.commission, 0);

  return {
    code: partner.code,
    createdAt: partner.createdAt,
    saleCount: sales.length,
    earned,
    available: availableBalance(ledger, code),
    withdrawals,
  };
}

export async function creditResellerSale(input: {
  code: string;
  paymentId: string;
}): Promise<ResellerSale | null> {
  const code = normalizeResellerCode(input.code);
  if (!code) return null;

  const ledger = await loadLedger();
  if (!ledger.partners.some((p) => p.code === code)) return null;
  if (ledger.sales.some((s) => s.paymentId === input.paymentId)) {
    return ledger.sales.find((s) => s.paymentId === input.paymentId) ?? null;
  }

  const sale: ResellerSale = {
    id: `SALE_${Date.now().toString(36).toUpperCase()}`,
    code,
    paymentId: input.paymentId,
    amount: SCRIPT_BUNDLE_PRICE_INR,
    commission: RESELLER_COMMISSION_INR,
    createdAt: new Date().toISOString(),
  };
  ledger.sales.unshift(sale);
  await saveLedger(ledger);
  return sale;
}

export async function createWithdrawal(input: {
  code: string;
  upiId: string;
  upiName: string;
  amount?: number;
}): Promise<{ ok: true; request: WithdrawalRequest } | { ok: false; error: string }> {
  const ledger = await loadLedger();
  const partner = ledger.partners.find((p) => p.code === input.code);
  if (!partner) return { ok: false, error: 'Reseller not found.' };

  const available = availableBalance(ledger, input.code);
  const amount = input.amount && input.amount > 0 ? Math.floor(input.amount) : available;

  if (amount < MIN_PAYOUT_INR) {
    return { ok: false, error: `Minimum payout is ₹${MIN_PAYOUT_INR}.` };
  }
  if (amount > available) {
    return { ok: false, error: 'Amount exceeds available balance.' };
  }

  const request: WithdrawalRequest = {
    id: `RES_${Date.now().toString(36).toUpperCase()}`,
    code: input.code,
    upiId: input.upiId.trim(),
    upiName: input.upiName.trim(),
    amount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ledger.withdrawals.unshift(request);
  await saveLedger(ledger);
  return { ok: true, request };
}

export async function listWithdrawals(): Promise<WithdrawalRequest[]> {
  const ledger = await loadLedger();
  return ledger.withdrawals;
}

export async function setWithdrawalStatus(
  id: string,
  status: PayoutStatus
): Promise<WithdrawalRequest | null> {
  const ledger = await loadLedger();
  const request = ledger.withdrawals.find((w) => w.id === id);
  if (!request) return null;
  request.status = status;
  request.updatedAt = new Date().toISOString();
  if (status === 'PAID') request.paidAt = request.updatedAt;
  await saveLedger(ledger);
  return request;
}
