import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTeacherLearningReport } from '../js/ui/teacher-learning-report.js';

test('representa métricas, categorías y sesiones sin inyectar HTML', () => {
  const html = renderTeacherLearningReport({
    pilotName: '<img src=x onerror=alert(1)>',
    learning: {
      attempts: 9,
      accuracy: 67,
      bestStreak: 3,
      sessionCount: 2,
      strength: { name: '<b>Ciencias</b>', accuracy: 80 },
      focus: [{ name: 'Matemáticas' }],
      goal: { text: 'Responder 8 preguntas.' },
      categories: [{ name: '<script>Arte</script>', attempts: 3, accuracy: 66, status: 'En progreso' }],
      recentSessions: [{
        completedAt: '2026-08-03T20:00:00.000Z',
        mode: 'practice',
        answers: 3,
        accuracy: 66,
        checkpoints: 2,
        goalReached: false
      }]
    }
  });

  assert.match(html, /Lectura pedagógica local/);
  assert.match(html, /Imprimir reporte/);
  assert.match(html, /Matemáticas/);
  assert.match(html, /En proceso/);
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;Arte&lt;\/script&gt;/);
});

test('explica la ausencia de datos sin presentar una calificación', () => {
  const html = renderTeacherLearningReport({ learning: {} });
  assert.match(html, /Aún no hay respuestas registradas/);
  assert.match(html, /no debe convertirse automáticamente en una calificación/);
  assert.match(html, /permanecen en este navegador/);
});
