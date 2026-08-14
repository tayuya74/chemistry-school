import { allowedUiKinds, isAllowedUiKind } from "./oge-ui-kind-map.mjs";

const OPEN_KINDS = new Set(["openReference", "experimentOpen"]);

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
