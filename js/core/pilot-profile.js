export function cleanPilotName(value = '') {
  return String(value)
    .replace(/[^\p{L}\p{N} ._-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18);
}

export function normalizePilotProfile(profile = {}, remember = false) {
  return {
    name: cleanPilotName(profile.nickname || profile.name),
    token: String(profile.token || ''),
    protected: Boolean(profile.protected),
    remember: Boolean(remember)
  };
}

export function parseRememberedPilot(profile = {}) {
  const normalized = normalizePilotProfile(profile, profile.remember);
  return normalized.remember && normalized.name ? normalized : null;
}
