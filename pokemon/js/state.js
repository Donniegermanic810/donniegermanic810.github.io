export const state = {
  route: 'quiz',
  quiz: {
    mode: 'select-all',
    status: 'idle',
    question: null,
    selectedTypes: new Set(),
    result: null
  },
  settings: {
    quizMode: 'select-all'
  },
  study: { selectedType: null },
  progress: { totalAnswered: 0, totalCorrect: 0 }
};

export function resetQuestionState() {
  state.quiz.selectedTypes = new Set();
  state.quiz.result = null;
}
