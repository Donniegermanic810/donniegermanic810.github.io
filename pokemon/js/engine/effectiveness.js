import { OFFENSIVE_CHART, TYPES } from '../data/types.js';

export function getMultiplier(attackingType, defendingTypes) {
  if (!OFFENSIVE_CHART[attackingType]) throw new Error(`Unknown attacking type: ${attackingType}`);
  return defendingTypes.reduce((total, defendingType) => {
    if (!TYPES.includes(defendingType)) throw new Error(`Unknown defending type: ${defendingType}`);
    return total * (OFFENSIVE_CHART[attackingType][defendingType] ?? 1);
  }, 1);
}

export function getDefendingTypesAtMultiplier(attackingType, multiplier) {
  return TYPES.filter(defendingType => getMultiplier(attackingType, [defendingType]) === multiplier);
}

export function runEngineSelfTests() {
  const cases = [
    ['normal', ['ghost'], 0],
    ['fire', ['bug', 'steel'], 4],
    ['ice', ['fire', 'steel'], .25],
    ['electric', ['water', 'flying'], 4]
  ];
  return cases.map(([attack, defend, expected]) => {
    const actual = getMultiplier(attack, defend);
    return {
      name: `${attack} → ${defend.join('/')}: expected ${expected}×`,
      attack,
      defend,
      expected,
      actual,
      passed: actual === expected
    };
  });
}
