export const QUESTION_FEEDBACK = Object.freeze({
  correct: '✅ ¡Correcto! Combustible recargado.',
  missionIncorrectPrefix: '❌ ',
  practiceIncorrectPrefix: '💡 Aprendimos: '
});

export const QUESTION_DELAYS = Object.freeze({
  correct: 1050,
  missionIncorrect: 1700,
  practiceIncorrect: 2100
});

export function evaluateQuestionAnswer(question, selectedIndex, mode = 'mission') {
  if (!question || !Array.isArray(question.options)) return null;

  const correctIndex = Number(question.answer);
  const selected = Number(selectedIndex);
  const correct = selected === correctIndex;
  const practice = mode === 'practice';
  const fact = String(question.fact || '');

  return {
    correct,
    practice,
    selectedIndex: selected,
    correctIndex,
    fact,
    feedback: correct
      ? QUESTION_FEEDBACK.correct
      : (practice ? QUESTION_FEEDBACK.practiceIncorrectPrefix : QUESTION_FEEDBACK.missionIncorrectPrefix) + fact,
    delayMs: correct
      ? QUESTION_DELAYS.correct
      : practice
        ? QUESTION_DELAYS.practiceIncorrect
        : QUESTION_DELAYS.missionIncorrect
  };
}
