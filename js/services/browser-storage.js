function resolveStorage(storage) {
  return storage || globalThis.localStorage;
}

export function readStorageValue(key, options = {}) {
  try {
    return resolveStorage(options.storage).getItem(key);
  } catch (error) {
    options.onError?.(error);
    return null;
  }
}

export function readStorageJson(key, fallback = null, options = {}) {
  const value = readStorageValue(key, options);
  if (value === null || value === '') return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    options.onError?.(error);
    return fallback;
  }
}

export function writeStorageJson(key, value, options = {}) {
  try {
    resolveStorage(options.storage).setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    options.onError?.(error);
    return false;
  }
}

export function removeStorageValue(key, options = {}) {
  try {
    resolveStorage(options.storage).removeItem(key);
    return true;
  } catch (error) {
    options.onError?.(error);
    return false;
  }
}

export function hasStorageValue(key, options = {}) {
  return readStorageValue(key, options) !== null;
}
