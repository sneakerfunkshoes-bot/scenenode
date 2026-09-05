/**
 * Hardcoded UPI checkout details (no .env required for payee).
 * Safe to import from client components for display only.
 */
export const UPI_DETAILS = {
  payeeName: 'SceneNode',
  /** Base list price in INR (unique paisa suffix added per order server-side). */
  amount: '499.00',
} as const;

/** Display-only mask — full VPA shown only after checkout starts via server QR/intent. */
export const UPI_ID_MASK = '9529586536-3@ibl';
