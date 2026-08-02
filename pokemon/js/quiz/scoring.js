function intersection(left, right) {
  return left.filter(value => right.includes(value));
}

function difference(left, right) {
  return left.filter(value => !right.includes(value));
}

export function scoreMultiSelect(question, submittedAnswers) {
  const correctAnswers = [...question.correctAnswers];
  const selectedAnswers = [...submittedAnswers];
  const correctlySelected = intersection(selectedAnswers, correctAnswers);
  const missedAnswers = difference(correctAnswers, selectedAnswers);
  const incorrectAnswers = difference(selectedAnswers, correctAnswers);
  const unionSize = new Set([...correctAnswers, ...selectedAnswers]).size;
  const score = unionSize === 0 ? 1 : correctlySelected.length / unionSize;

  return {
    score,
    correctlySelected,
    missedAnswers,
    incorrectAnswers,
    correctAnswers,
    selectedAnswers
  };
}

export const SCORING_STRATEGIES = {
  'type-multi-select': scoreMultiSelect
};

export function scoreQuestion(question, submittedAnswers) {
  const strategy = SCORING_STRATEGIES[question.answerType];
  if (!strategy) throw new Error(`No scoring strategy for answer type: ${question.answerType}`);
  return strategy(question, submittedAnswers);
}
