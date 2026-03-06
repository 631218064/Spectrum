import type { NextApiRequest } from 'next';
import { randomUUID } from 'crypto';

export function getRequestId(req: NextApiRequest) {
  const header = req.headers['x-request-id'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  return randomUUID();
}

export function logApiError(
  req: NextApiRequest,
  requestId: string,
  error: unknown,
  extra?: Record<string, unknown>
) {
  const err = error as any;
  console.error('[api:error]', {
    requestId,
    method: req.method,
    path: req.url,
    message: err?.message || String(error),
    stack: err?.stack,
    ...extra,
  });
}

export function logApiWarn(
  req: NextApiRequest,
  requestId: string,
  message: string,
  extra?: Record<string, unknown>
) {
  console.warn('[api:warn]', {
    requestId,
    method: req.method,
    path: req.url,
    message,
    ...extra,
  });
}

