import { allowedUiKinds, isAllowedUiKind } from "./oge-ui-kind-map.mjs";

const OPEN_KINDS = new Set(["openReference", "experimentOpen"]);

/**
 * Условие над стрелкой (t° или реагент) должно стоять НАД ней — двухстрочным
 * inline-block, см. «Схема превращений» в data/oge/TASK-TYPES.md. Ловим способы
 * записи, которые в браузере выглядят рвано и уже встречались при оцифровке.
 */
const BAD_ARROW_PATTERNS = [
  {
    re: /—\s*t°\s*→|-\s*t°\s*-?>/,
    hint: "«—t°→» набрано тире; нужна двухстрочная стрелка с подписью сверху",
  },
  {
    re: /→\s*<\/span>\s*<sup>/,
    hint: "<sup> после стрелки уводит подпись вправо вместо того, чтобы поставить её над стрелкой",
  },
  {
    re: /\(\s*\+\s*[A-Za-zА-Яа-я(]/,
    hint: "реагент в скобках со знаком «+» попадает в общий ряд цепочки; подпись ставится над стрелкой и без «+»",
  },
];

function collectStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectStrings(v, out));
  }
  return out;
}

function arrowIssues(task) {
  const issues = [];
  const haystack = collectStrings([
    task.blocks,
    task.content,
    task.solution,
  ]).join("\n");
  for (const { re, hint } of BAD_ARROW_PATTERNS) {
    if (re.test(haystack)) issues.push(`стрелка: ${hint}`);
  }
  return issues;
}

/** Проверяет содержимое задания по правилам его uiKind — без привязки к id/реестру. */
export function validateTaskShape(task) {
  const issues = [];

  if (!task.meta?.lead) issues.push("meta.lead missing");
  if (!task.meta?.source) issues.push("meta.source missing");
  if (!Array.isArray(task.blocks)) issues.push("blocks must be array");
  /* meta.advanced — необязательная пометка «повышенная сложность» (звёздочка на странице) */
  if (
    task.meta?.advanced !== undefined &&
    typeof task.meta.advanced !== "boolean"
  ) {
    issues.push("meta.advanced must be boolean");
  }
  if (task.meta?.advanced && !task.meta?.advancedNote) {
    issues.push("meta.advancedNote missing (чем задание сложнее обычного)");
  }

  if (OPEN_KINDS.has(task.uiKind)) {
    if (task.answer !== null) issues.push("open task answer must be null");
    if (!task.solution?.html) issues.push("solution.html missing");
  } else {
    if (!task.answer) issues.push("answer missing");
  }

  /* Разбор решения необязателен везде, кроме открытых заданий, но если он есть —
     нужны оба поля, иначе на странице появится пустой раскрывающийся блок. */
  if (task.solution) {
    if (!task.solution.title) issues.push("solution.title missing");
    if (!task.solution.html) issues.push("solution.html missing");
  }

  /* hint — необязательная подсказка (кнопка рядом с «Проверить»), наводит на ответ,
     но не выдаёт его; пока используется только у twoChoice-заданий. */
  if (task.hint !== undefined && (typeof task.hint !== "string" || !task.hint.trim())) {
    issues.push("hint must be a non-empty string when present");
  }

  issues.push(...arrowIssues(task));

  switch (task.uiKind) {
    case "twoChoice":
      if (task.content.statements?.length < 2)
        issues.push("twoChoice: statements");
      if (task.answer?.correct?.length !== 2) issues.push("twoChoice: correct");
      break;
    case "matchTriple":
      if (!task.answer?.mapping?.A) issues.push("matchTriple: mapping");
      break;
    case "orderedDigits":
      if (!task.content?.items?.length) issues.push("orderedDigits: items");
      if (!task.answer?.sequence?.length)
        issues.push("orderedDigits: sequence");
      /* cellCount задаёт число ячеек ответа на странице — если оно меньше длины
         sequence, ученику физически негде вписать часть цифр (баг, который уже
         был у 10 заданий типа 3: cellCount=1 при sequence из 3 цифр). */
      if (task.content?.cellCount !== task.answer?.sequence?.length) {
        issues.push(
          `orderedDigits: cellCount (${task.content?.cellCount}) должен совпадать с длиной sequence (${task.answer?.sequence?.length})`,
        );
      }
      break;
    case "periodDiagram":
      if (!task.content?.figure?.html) issues.push("periodDiagram: figure");
      if (!task.answer?.values?.X) issues.push("periodDiagram: values");
      break;
    case "multiChoiceFour":
      if (task.content?.statements?.length !== 4)
        issues.push("multiChoiceFour: statements");
      if (
        !task.answer?.correct?.length ||
        task.answer.correct.length < 1 ||
        task.answer.correct.length > 4
      ) {
        issues.push("multiChoiceFour: correct length");
      }
      break;
    case "numericInt":
    case "numericMassTable":
      if (
        typeof task.answer?.value !== "number" ||
        Number.isNaN(task.answer.value)
      ) {
        issues.push("numeric: value");
      }
      if (task.uiKind === "numericMassTable" && !task.content?.showMassTable) {
        issues.push("numericMassTable: showMassTable");
      }
      break;
    default:
      break;
  }

  return issues;
}

/** Проверяет уже зарегистрированное задание (сверяет id/examType/uiKind с записью реестра). */
export function validateTask(task, row) {
  const issues = [];

  if (task.id !== row.id) issues.push(`id mismatch: ${task.id}`);
  if (task.examType !== row.type) issues.push(`examType mismatch`);
  if (!isAllowedUiKind(row.type, task.uiKind)) {
    issues.push(
      `uiKind ${task.uiKind} не подходит для типа ${row.type} (допустимы: ${allowedUiKinds(row.type).join(", ")})`,
    );
  }

  return [...issues, ...validateTaskShape(task)];
}

/**
 * Проверяет черновик задания (без id/sourceDir — их назначает add-oge-task.mjs).
 * Требует examType (1..23); uiKind, если указан, должен соответствовать ожидаемому.
 */
export function validateDraft(draft) {
  const issues = [];

  if (
    typeof draft.examType !== "number" ||
    draft.examType < 1 ||
    draft.examType > 23
  ) {
    return [`examType must be a number 1..23, got: ${draft.examType}`];
  }

  if (!isAllowedUiKind(draft.examType, draft.uiKind)) {
    issues.push(
      `uiKind ${draft.uiKind} не подходит для типа ${draft.examType} (допустимы: ${allowedUiKinds(draft.examType).join(", ")})`,
    );
  }

  return [...issues, ...validateTaskShape(draft)];
}
