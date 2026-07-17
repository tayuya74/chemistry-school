/** Ожидаемый uiKind для каждого examType (1–23). См. data/oge/TASK-TYPES.md */
export const EXAM_TYPE_TO_UI_KIND = {
  1: "twoChoice",
  2: "periodDiagram",
  3: "orderedDigits",
  4: "matchTriple",
  5: "twoChoice",
  6: "twoChoice",
  7: "orderedDigits",
  8: "twoChoice",
  9: "matchTriple",
  10: "matchTriple",
  11: "twoChoice",
  12: "matchTriple",
  13: "twoChoice",
  14: "twoChoice",
  15: "matchTriple",
  16: "multiChoiceFour",
  17: "matchTriple",
  18: "numericInt",
  19: "numericMassTable",
  20: "openReference",
  21: "openReference",
  22: "openReference",
  23: "experimentOpen",
};

export function expectedUiKind(examType) {
  return EXAM_TYPE_TO_UI_KIND[examType] ?? null;
}
