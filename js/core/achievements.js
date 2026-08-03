export const ACHIEVEMENTS = Object.freeze({
  first_portal: { icon: '🌀', title: 'Primer portal', text: 'Superaste tu primera recarga.' },
  clean_pilot: { icon: '🛡️', title: 'Vuelo impecable', text: 'Llegaste a un portal sin chocar.' },
  streak_three: { icon: '🧠', title: 'Mente estelar', text: 'Lograste tres respuestas seguidas.' },
  sharpshooter: { icon: '⚡', title: 'Puntería galáctica', text: 'Usaste las tres cargas con éxito.' },
  explorer: { icon: '🏆', title: 'Explorador cósmico', text: 'Recorriste 1.000 kilómetros.' }
});

export function normalizeAchievements(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => Boolean(ACHIEVEMENTS[id])))];
}
