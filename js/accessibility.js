import { loadSettings, saveSettings } from './storage.js';

let settings = loadSettings();
let audioContext;
let musicTimer = 0;
let musicStep = 0;
let musicLevel = 1;
let musicRequested = false;
let musicMaster;
let effectsMaster;

function ensureAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function ensureMusicMaster(context) {
  if (musicMaster) return musicMaster;
  musicMaster = context.createGain();
  const limiter = context.createDynamicsCompressor();
  musicMaster.gain.setValueAtTime(2.4, context.currentTime);
  limiter.threshold.setValueAtTime(-2.5, context.currentTime);
  limiter.knee.setValueAtTime(3, context.currentTime);
  limiter.ratio.setValueAtTime(20, context.currentTime);
  limiter.attack.setValueAtTime(.001, context.currentTime);
  limiter.release.setValueAtTime(.14, context.currentTime);
  musicMaster.connect(limiter).connect(context.destination);
  return musicMaster;
}

function ensureEffectsMaster(context) {
  if (effectsMaster) return effectsMaster;
  effectsMaster = context.createGain();
  const limiter = context.createDynamicsCompressor();
  effectsMaster.gain.setValueAtTime(1.8, context.currentTime);
  limiter.threshold.setValueAtTime(-1.5, context.currentTime);
  limiter.knee.setValueAtTime(2, context.currentTime);
  limiter.ratio.setValueAtTime(20, context.currentTime);
  limiter.attack.setValueAtTime(.001, context.currentTime);
  limiter.release.setValueAtTime(.1, context.currentTime);
  effectsMaster.connect(limiter).connect(context.destination);
  return effectsMaster;
}

function scheduleSynthNote(context, destination, frequency, start, duration, volume, type = 'triangle') {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .025);
  gain.gain.exponentialRampToValueAtTime(.001, start + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .03);
}

function playMusicNote() {
  if (!settings.sound || !musicRequested) return;
  try {
    const context = ensureAudioContext();
    const master = ensureMusicMaster(context);
    const now = context.currentTime + .015;
    const melody = [220, 261.63, 329.63, 293.66, 392, 329.63, 261.63, 246.94, 220, 293.66, 349.23, 329.63, 440, 392, 329.63, 261.63];
    const roots = [110, 87.31, 130.81, 98];
    const frequency = melody[musicStep % melody.length] * (musicLevel >= 6 && musicStep % 8 === 7 ? 2 : 1);
    const beatSeconds = Math.max(.19, .38 - Math.min(musicLevel, 8) * .018);

    scheduleSynthNote(context, master, frequency, now, beatSeconds * .82, .22, musicLevel >= 4 ? 'square' : 'triangle');
    if (musicStep % 2 === 0) {
      const root = roots[Math.floor(musicStep / 4) % roots.length];
      scheduleSynthNote(context, master, root, now, beatSeconds * 1.75, .18, 'sine');
    }
    if (musicStep % 4 === 0) {
      const root = roots[Math.floor(musicStep / 4) % roots.length];
      scheduleSynthNote(context, master, root * 2, now, beatSeconds * 3.6, .085, 'sine');
      scheduleSynthNote(context, master, root * 2.5, now, beatSeconds * 3.6, .065, 'sine');
      scheduleSynthNote(context, master, 62 + Math.min(musicLevel, 8) * 2, now, .13, .22, 'sawtooth');
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
  document.querySelectorAll('[data-music-label]').forEach((button) => {
    button.setAttribute('aria-label', settings.sound ? 'Silenciar música y sonidos' : 'Activar música y sonidos');
    button.setAttribute('aria-pressed', String(settings.sound));
    button.innerHTML = settings.sound ? '<span>🎵</span><strong>Música</strong>' : '<span>🔇</span><strong>Activar música</strong>';
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
    const tones = { select: [440, 0.06], complete: [660, 0.18], core: [880, 0.3], alert: [260, 0.22], laser: [1180, .16], blast: [170, .32], empty: [145, .11] };
    const volumes = { select: .22, complete: .28, core: .32, alert: .34, laser: .3, blast: .38, empty: .24 };
    const [frequency, duration] = tones[type] || tones.select;
    oscillator.type = ['alert', 'laser', 'blast'].includes(type) ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    if (type === 'core') oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + duration);
    if (type === 'laser') oscillator.frequency.exponentialRampToValueAtTime(260, audioContext.currentTime + duration);
    if (type === 'blast') oscillator.frequency.exponentialRampToValueAtTime(62, audioContext.currentTime + duration);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(volumes[type] || volumes.select, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(ensureEffectsMaster(audioContext));
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
  try {
    const context = ensureAudioContext();
    const resume = context.state === 'suspended' ? context.resume() : Promise.resolve();
    Promise.resolve(resume).then(scheduleMusic);
  } catch (error) {
    console.warn('La música no está disponible en este navegador.', error);
  }
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
