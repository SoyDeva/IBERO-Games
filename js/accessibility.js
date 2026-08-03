import { loadSettings, saveSettings } from './storage.js';

let settings = loadSettings();
let audioContext;
let musicTimer = 0;
let musicStep = 0;
let musicLevel = 1;
let musicRequested = false;

function ensureAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playMusicNote() {
  if (!settings.sound || !musicRequested) return;
  try {
    const context = ensureAudioContext();
    const sequence = [110, 146.83, 164.81, 220, 196, 164.81, 146.83, 130.81];
    const frequency = sequence[musicStep % sequence.length] * (musicLevel >= 6 && musicStep % 4 === 3 ? 2 : 1);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = musicLevel >= 4 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + .025);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + .24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .26);
    if (musicStep % 4 === 0) {
      const pulse = context.createOscillator();
      const pulseGain = context.createGain();
      pulse.type = 'sawtooth';
      pulse.frequency.setValueAtTime(55 + Math.min(musicLevel, 8) * 2, context.currentTime);
      pulseGain.gain.setValueAtTime(.022, context.currentTime);
      pulseGain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .12);
      pulse.connect(pulseGain).connect(context.destination);
      pulse.start();
      pulse.stop(context.currentTime + .14);
    }
    musicStep += 1;
  } catch (error) {
    console.warn('La música no está disponible en este navegador.', error);
  }
}

function scheduleMusic() {
  window.clearInterval(musicTimer);
  musicTimer = 0;
  if (!settings.sound || !musicRequested) return;
  playMusicNote();
  musicTimer = window.setInterval(playMusicNote, Math.max(165, 340 - Math.min(musicLevel, 8) * 20));
}

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
  if (!settings.sound) { window.clearInterval(musicTimer); musicTimer = 0; }
  else if (musicRequested && !musicTimer) scheduleMusic();
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
    ensureAudioContext();
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

export function startMusic(level = 1) {
  musicRequested = true;
  musicLevel = Math.max(1, Number(level) || 1);
  musicStep = 0;
  scheduleMusic();
}

export function setMusicIntensity(level) {
  const nextLevel = Math.max(1, Number(level) || 1);
  if (nextLevel === musicLevel) return;
  musicLevel = nextLevel;
  if (musicRequested) scheduleMusic();
}

export function stopMusic() {
  musicRequested = false;
  window.clearInterval(musicTimer);
  musicTimer = 0;
}
