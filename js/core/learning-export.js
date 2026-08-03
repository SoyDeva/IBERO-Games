import { normalizeLearningProgress, summarizeLearningProgress } from './learning-progress.js';

function safeText(value, maximum = 80) {
  return String(value || '').trim().slice(0, maximum);
}

function normalizeGeneratedAt(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString();
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}

function csvRow(values) {
  return values.map(csvCell).join(',');
}

function createCsv(progress, summary, pilotName, generatedAt) {
  const rows = [
    csvRow(['Reporte pedagógico local', 'Misión Nébula']),
    csvRow(['Piloto', pilotName || 'Piloto local']),
    csvRow(['Generado', generatedAt]),
    csvRow(['Privacidad', 'Exportación voluntaria creada en el dispositivo; no enviada a servicios externos.']),
    '',
    csvRow(['Resumen acumulado']),
    csvRow(['Respuestas', 'Aciertos', 'Precisión', 'Mejor racha', 'Sesiones', 'Seguimiento ampliado']),
    csvRow([summary.attempts, summary.correct, summary.accuracy + '%', summary.bestStreak, summary.sessionCount, summary.longitudinalTracking ? 'Sí' : 'No']),
    '',
    csvRow(['Categorías']),
    csvRow(['Categoría', 'Respuestas', 'Aciertos', 'Errores', 'Precisión', 'Lectura'])
  ];

  for (const category of summary.categories || []) {
    rows.push(csvRow([category.name, category.attempts, category.correct, category.incorrect, category.accuracy + '%', category.status]));
  }

  rows.push('', csvRow(['Sesiones']), csvRow(['Fecha', 'Modo', 'Respuestas', 'Aciertos', 'Precisión', 'Distancia', 'Portales', 'Tema', 'Meta']));
  for (const session of progress.sessions) {
    rows.push(csvRow([
      session.completedAt,
      session.mode === 'mission' ? 'Misión' : 'Práctica',
      session.answers,
      session.correct,
      session.accuracy + '%',
      session.distance,
      session.checkpoints,
      session.focusCategory,
      session.goalReached ? 'Alcanzada' : 'En proceso'
    ]));
  }

  return '\uFEFF' + rows.join('\n');
}

export function createLearningExport(progress, {
  format = 'json',
  pilotName = '',
  generatedAt = new Date().toISOString()
} = {}) {
  const normalized = normalizeLearningProgress(progress);
  const summary = summarizeLearningProgress(normalized);
  const safePilotName = safeText(pilotName, 48);
  const safeGeneratedAt = normalizeGeneratedAt(generatedAt);
  const normalizedFormat = format === 'csv' ? 'csv' : 'json';
  const datePart = safeGeneratedAt.slice(0, 10);

  if (normalizedFormat === 'csv') {
    return {
      format: 'csv',
      mime: 'text/csv;charset=utf-8',
      extension: 'csv',
      filename: 'mision-nebula-progreso-' + datePart + '.csv',
      content: createCsv(normalized, summary, safePilotName, safeGeneratedAt)
    };
  }

  const payload = {
    schema: 'mision-nebula-learning-export-v1',
    generatedAt: safeGeneratedAt,
    privacy: 'Exportación voluntaria creada en el dispositivo; no enviada a servicios externos.',
    pilotName: safePilotName || 'Piloto local',
    summary,
    progress: normalized
  };

  return {
    format: 'json',
    mime: 'application/json;charset=utf-8',
    extension: 'json',
    filename: 'mision-nebula-progreso-' + datePart + '.json',
    content: JSON.stringify(payload, null, 2)
  };
}