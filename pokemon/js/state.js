export const state = {
  route: 'quiz',
  quiz: {
    mode: 'select-all',
    status: 'idle',
    question: null,
    selectedAnswers: new Set(),
    result: null
  },
  settings: {
    quizMode: 'select-all'
  },
  study: { selectedType: null },
  progress: {
    totalAnswered: 0,
    totalScore: 0
  }
};

export function resetQuestionState() {
  state.quiz.selectedAnswers = new Set();
  state.quiz.result = null;
}

export function getAverageScore() {
  if (state.progress.totalAnswered === 0) return 0;
  return state.progress.totalScore / state.progress.totalAnswered;
}
