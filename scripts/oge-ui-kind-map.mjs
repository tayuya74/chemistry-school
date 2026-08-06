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

/**
 * Дополнительно допустимые шаблоны для типа — когда формулировка задания менялась.
 * Тип 3: раньше спрашивали «выберите два верных продолжения» (twoChoice),
 * сейчас — «расположите элементы в порядке…» (orderedDigits). Нужны оба.
 */
export const ALSO_ALLOWED_UI_KINDS = {
  3: ["twoChoice"],
  /* Тип 7: «выберите соль и кислотный оксид» — порядок строгий (orderedDigits),
     «выберите два оснóвных оксида» — порядок любой (twoChoice). */
  7: ["twoChoice"],
};

export function expectedUiKind(examType) {
  return EXAM_TYPE_TO_UI_KIND[examType] ?? null;
}

/** Подходит ли шаблон для этого типа задания (основной или дополнительный). */
export function isAllowedUiKind(examType, uiKind) {
  if (uiKind === expectedUiKind(examType)) return true;
  return (ALSO_ALLOWED_UI_KINDS[examType] ?? []).includes(uiKind);
}

/** Все допустимые шаблоны типа — для сообщений об ошибках. */
export function allowedUiKinds(examType) {
  const main = expectedUiKind(examType);
  return [main, ...(ALSO_ALLOWED_UI_KINDS[examType] ?? [])].filter(Boolean);
}
