export const TUTORIAL_QUESTION = Object.freeze({
  icon: '🌎',
  category: 'Nuestro planeta',
  level: 1,
  text: '¿En qué planeta vivimos?',
  options: Object.freeze(['Marte', 'La Tierra', 'Júpiter']),
  answer: 1,
  fact: 'Vivimos en la Tierra, el tercer planeta del sistema solar.'
});

export const TUTORIAL_STEPS = Object.freeze({
  left: Object.freeze({
    icon: '👈',
    title: 'Muévete a la izquierda',
    detail: 'Pulsa el botón IZQUIERDA o la flecha ←',
    targets: Object.freeze(['#steer-left', '#mobile-steer-left'])
  }),
  right: Object.freeze({
    icon: '👉',
    title: '¡Muy bien! Ahora a la derecha',
    detail: 'Pulsa DERECHA o la flecha →',
    targets: Object.freeze(['#steer-right', '#mobile-steer-right'])
  }),
  fire: Object.freeze({
    icon: '⚡',
    title: 'Destruye el meteorito',
    detail: 'Pulsa ESPACIO o el botón DISPARAR',
    targets: Object.freeze(['[data-fire-plasma]'])
  }),
  question: Object.freeze({
    icon: '🧠',
    title: 'Último paso: responde',
    detail: 'Elige el planeta donde vivimos',
    targets: Object.freeze([]),
    showQuestion: true,
    delayMs: 650
  })
});

export const TUTORIAL_COMPLETION = Object.freeze({
  icon: '🏅',
  title: '¡Entrenamiento completado!',
  detail: 'Ya sabes pilotar. Comienza tu primera misión.',
  delayMs: 1700,
  toast: '🚀 MISIÓN REAL · ¡TÚ PUEDES!'
});

export function tutorialStep(step) {
  return TUTORIAL_STEPS[String(step || '')] || null;
}

export function evaluateTutorialAnswer(selectedIndex, question = TUTORIAL_QUESTION) {
  const selected = Number(selectedIndex);
  const correct = Number.isInteger(selected) && selected === question.answer;
  return {
    correct,
    selectedIndex: selected,
    correctIndex: question.answer,
    fact: question.fact,
    message: correct
      ? '🌟 ¡Exacto! La Tierra es nuestro hogar.'
      : '💡 Casi. Mira las opciones y prueba otra vez.',
    tone: correct ? 'achievement' : 'alert',
    delayMs: correct ? 900 : 0
  };
}
