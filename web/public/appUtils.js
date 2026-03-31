/**
 * Browser app utilities shared across runtime and tests.
 */

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

export function isDebugEnabled(search = '', storage = null) {
  try {
    const debugParam = new URLSearchParams(search).get('debug');
    if (debugParam && TRUTHY.has(String(debugParam).toLowerCase())) return true;
  } catch (_) {
    // Ignore malformed query strings.
  }

  try {
    const stored = storage?.getItem?.('sctmg.debug');
    return !!stored && TRUTHY.has(String(stored).toLowerCase());
  } catch (_) {
    return false;
  }
}

function serializeError(err) {
  if (!err) return { message: 'Unknown error', status: undefined };
  return {
    name: err.name,
    message: String(err.message || 'Unknown error'),
    status: typeof err.status === 'number' ? err.status : undefined,
  };
}

export function classifyError(err) {
  const status = typeof err?.status === 'number' ? err.status : undefined;
  const retryableStatus = typeof status === 'number' && (
    status === 408 ||
    status === 425 ||
    status === 429 ||
    (status >= 500 && status <= 504)
  );

  return {
    status,
    retryable: retryableStatus,
  };
}

export function getUserFacingError(action, err) {
  const label = action || 'request';
  const info = classifyError(err);
  const base = err?.message ? String(err.message) : 'Unexpected error';
  if (info.retryable) return `${label} failed (${base}). Try again in a moment.`;
  return `${label} failed (${base}).`;
}

export function createDebugLogger({ search = '', storage = null, sink = console, now = () => new Date().toISOString() } = {}) {
  const enabled = isDebugEnabled(search, storage);

  function emit(level, event, payload = {}) {
    if (!enabled) return;
    const line = {
      ts: now(),
      event,
      ...payload,
    };
    const method = level === 'error' ? sink.error : sink.log;
    method.call(sink, '[sctmg-debug]', line);
  }

  return {
    enabled,
    log(event, payload) {
      emit('log', event, payload);
    },
    error(event, err, payload = {}) {
      emit('error', event, { ...payload, err: serializeError(err) });
    },
  };
}
