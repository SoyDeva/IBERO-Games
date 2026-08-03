import {
  assertStorageDiagnosticReady,
  diagnoseStorageSnapshot
} from '../core/storage-diagnostics.js';

const DEFAULT_PROBE_KEY = '__mision_nebula_storage_probe__';

function resolveStorage(storage) {
  return storage || globalThis.localStorage;
}

function storageKeys(storage) {
  const keys = new Set();
  const length = Number(storage?.length);
  if (Number.isFinite(length) && typeof storage?.key === 'function') {
    for (let index = 0; index < length; index += 1) {
      const key = storage.key(index);
      if (typeof key === 'string') keys.add(key);
    }
  }
  for (const key of Object.keys(storage || {})) {
    if (typeof storage?.getItem === 'function' && storage.getItem(key) !== null) keys.add(key);
  }
  return Array.from(keys);
}

export function collectStorageSnapshot({ storage } = {}) {
  const target = resolveStorage(storage);
  const entries = {};
  let readable = true;
  try {
    for (const key of storageKeys(target)) {
      const value = target.getItem(key);
      if (value !== null) entries[key] = String(value);
    }
  } catch (error) {
    readable = false;
  }
  return { entries, readable };
}

export function probeStorageWrite({ storage, probeKey = DEFAULT_PROBE_KEY } = {}) {
  const target = resolveStorage(storage);
  try {
    const previous = target.getItem(probeKey);
    target.setItem(probeKey, '1');
    if (target.getItem(probeKey) !== '1') return false;
    if (previous === null) target.removeItem(probeKey);
    else target.setItem(probeKey, previous);
    return true;
  } catch (error) {
    try { target?.removeItem?.(probeKey); } catch (cleanupError) { /* Sin efecto fuera del diagnóstico. */ }
    return false;
  }
}

export function createStorageDiagnosticsStore({
  storage,
  now = () => new Date().toISOString(),
  probeKey = DEFAULT_PROBE_KEY
} = {}) {
  function diagnose() {
    const snapshot = collectStorageSnapshot({ storage });
    const writable = snapshot.readable && probeStorageWrite({ storage, probeKey });
    return diagnoseStorageSnapshot({
      entries: snapshot.entries,
      readable: snapshot.readable,
      writable,
      now: now()
    });
  }

  function cleanupObsolete() {
    const before = assertStorageDiagnosticReady(diagnose(), 'limpiar el almacenamiento');
    const target = resolveStorage(storage);
    const removed = [];
    for (const key of before.cleanupKeys) {
      try {
        target.removeItem(key);
        if (target.getItem(key) !== null) throw new Error('La clave continúa presente.');
        removed.push(key);
      } catch (error) {
        throw new Error('No fue posible eliminar un elemento obsoleto. No se continuó con la limpieza.');
      }
    }
    return { before, removed, after: diagnose() };
  }

  function assertReady(action) {
    return assertStorageDiagnosticReady(diagnose(), action);
  }

  return Object.freeze({ diagnose, cleanupObsolete, assertReady });
}
