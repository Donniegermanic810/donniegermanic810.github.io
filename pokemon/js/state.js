export const state = {
  route: 'quiz',
  quiz: {
    mode: 'select-all',
    status: 'idle',
    question: null,
    selectedAnswers: new Set(),
    result: null,
    session: {
      length: 10,
      questionNumber: 0,
      totalScore: 0,
      results: []
    }
  },
  settings: {
    theme: 'system',
    quizMode: 'select-all',
    quizLength: 10
  },
  study: { selectedType: null },
  progress: {
    totalAnswered: 0,
    totalScore: 0,
    relationshipStats: {}
  },
  cache: {
    pokemon: {}
  }
};

export function hydratePersistentState(persistentData) {
  state.settings = { ...state.settings, ...persistentData.settings };
  state.progress = { ...state.progress, ...persistentData.progress };
  state.cache = { ...state.cache, ...persistentData.cache };

  state.quiz.mode = state.settings.quizMode;
  state.quiz.session.length = state.settings.quizLength;
}

export function getPersistentSnapshot() {
  return {
    settings: { ...state.settings },
    progress: {
      ...state.progress,
      relationshipStats: { ...state.progress.relationshipStats }
    },
    cache: {
      pokemon: { ...state.cache.pokemon }
    }
  };
}

export function resetQuestionState() {
  state.quiz.selectedAnswers = new Set();
  state.quiz.result = null;
  state.quiz.question = null;
}

export function startQuizSession(length = state.settings.quizLength) {
  state.settings.quizLength = length;
  state.quiz.status = 'answering';
  state.quiz.session = {
    length,
    questionNumber: 1,
    totalScore: 0,
    results: []
  };
  resetQuestionState();
}

export function recordQuestionResult(question, result) {
  const entry = {
    questionId: question.id,
    generatorId: question.generatorId,
    score: result.score,
    metadata: question.metadata
  };

  state.quiz.session.results.push(entry);
  state.quiz.session.totalScore += result.score;
  state.progress.totalAnswered += 1;
  state.progress.totalScore += result.score;
}

export function advanceQuizSession() {
  const { length, questionNumber } = state.quiz.session;
  if (length !== 0 && questionNumber >= length) {
    state.quiz.status = 'complete';
    resetQuestionState();
    return false;
  }

  state.quiz.session.questionNumber += 1;
  resetQuestionState();
  state.quiz.status = 'answering';
  return true;
}

export function endQuizSession() {
  state.quiz.status = 'complete';
  resetQuestionState();
}

export function returnToQuizSetup() {
  state.quiz.status = 'idle';
  resetQuestionState();
}

export function getSessionAverageScore() {
  const count = state.quiz.session.results.length;
  if (count === 0) return 0;
  return state.quiz.session.totalScore / count;
}

export function getAverageScore() {
  if (state.progress.totalAnswered === 0) return 0;
  return state.progress.totalScore / state.progress.totalAnswered;
}
