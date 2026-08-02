import { loadSettings, saveSettings } from './storage.js';

let settings = loadSettings();
let audioContext;

export function applySettings(next = settings) {
  settings = { ...settings, ...next };
  document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
  document.documentElement.classList.toggle('high-contrast', settings.highContrast);
  document.documentElement.classList.toggle('large-text', settings.largeText);
  document.querySelectorAll('[data-setting]').forEach((control) => {
    control.checked = Boolean(settings[control.dataset.setting]);
  });
  document.querySelectorAll('[data-sound-label]').forEach((button) => {
    button.setAttribute('aria-label', settings.sound ? 'Silenciar sonidos' : 'Activar sonidos');
    button.textContent = settings.sound ? '🔊 Sonido' : '🔇 Silencio';
  });
  saveSettings(settings);
  return settings;
}
export function getSettings() {
  return { ...settings };
}

export function bindSettings(root = document) {
  root.querySelectorAll('[data-setting]').forEach((control) => {
    control.addEventListener('change', () => applySettings({ [control.dataset.setting]: control.checked }));
  });
  root.querySelectorAll('[data-sound-label]').forEach((button) => {
    button.addEventListener('click', () => applySettings({ sound: !settings.sound }));
  });
  applySettings();
}

export function announce(message) {
  const region = document.getElementById('announcer');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => { region.textContent = message; }, 20);
}

export function playTone(type = 'select') {
  if (!settings.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const tones = { select: [440, 0.06], complete: [660, 0.18], core: [880, 0.3], alert: [260, 0.22] };
    const [frequency, duration] = tones[type] || tones.select;
    oscillator.type = type === 'alert' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    if (type === 'core') oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + duration);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('El sonido no está disponible en este navegador.', error);
  }
}
