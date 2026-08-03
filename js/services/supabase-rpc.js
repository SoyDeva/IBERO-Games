import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_RPC_TIMEOUT_MS,
  SUPABASE_URL
} from '../config/supabase.js';
import { createGalacticError } from '../core/galactic-errors.js';

function resolveErrorCode(payload) {
  return payload?.message || payload?.code || 'network_error';
}

/**
 * Transporte HTTP mínimo para invocar funciones RPC públicas de Supabase.
 * Mantiene fuera del dominio los detalles de fetch, encabezados y tiempo límite.
 */
export async function callSupabaseRpc(name, body, options = {}) {
  const timeout = Number(options.timeout) || SUPABASE_RPC_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw createGalacticError(resolveErrorCode(payload), { status: response.status });
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') throw createGalacticError('timeout', { cause: error });
    if (error?.code) throw error;
    throw createGalacticError('network_error', { cause: error });
  } finally {
    globalThis.clearTimeout(timer);
  }
}
