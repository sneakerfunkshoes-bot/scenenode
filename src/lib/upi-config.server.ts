import 'server-only';

/** Server-only UPI payee — never import from client components. */
export const UPI_PAYEE_ID = '9529586536-3@ibl';
export const UPI_PAYEE_NAME = 'SceneNode';

/**
 * SMS forwarder auth — set ?secret= on POST /api/webhook
 * Override via PAYMENT_WEBHOOK_SECRET env if needed.
 */
export const UPI_WEBHOOK_SECRET_FALLBACK = 'scenenode-sms-verify';
