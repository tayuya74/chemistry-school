import fs from "node:fs";
import path from "node:path";
import { expectedUiKind } from "./oge-ui-kind-map.mjs";
import { loadRegistry, root } from "./oge-migrate-lib.mjs";

const tasksDir = path.join(root, "data", "oge", "tasks");
const OPEN_KINDS = new Set(["openReference", "experimentOpen"]);

function validateTask(task, row) {
  const issues = [];

  if (task.id !== row.id) issues.push(`id mismatch: ${task.id}`);
  if (task.examType !== row.type) issues.push(`examType mismatch`);
  if (task.uiKind !== expectedUiKind(row.type)) {
    issues.push(`uiKind ${task.uiKind} != ${expectedUiKind(row.type)}`);
  }
  if (!task.meta?.lead) issues.push("meta.lead missing");
  if (!task.meta?.source) issues.push("meta.source missing");
  if (!Array.isArray(task.blocks)) issues.push("blocks must be array");

  if (OPEN_KINDS.has(task.uiKind)) {
    if (task.answer !== null) issues.push("open task answer must be null");
    if (!task.solution?.html) issues.push("solution.html missing");
  } else {
    if (!task.answer) issues.push("answer missing");
  }

  switch (task.uiKind) {
    case "twoChoice":
      if (task.content.statements?.length < 2) issues.push("twoChoice: statements");
      if (task.answer?.correct?.length !== 2) issues.push("twoChoice: correct");
      break;
    case "matchTriple":
      if (!task.answer?.mapping?.A) issues.push("matchTriple: mapping");
      break;
    case "orderedDigits":
      if (!task.content?.items?.length) issues.push("orderedDigits: items");
      if (!task.answer?.sequence?.length) issues.push("orderedDigits: sequence");
      break;
    case "periodDiagram":
      if (!task.content?.figure?.html) issues.push("periodDiagram: figure");
      if (!task.answer?.values?.X) issues.push("periodDiagram: values");
      break;
    case "multiChoiceFour":
      if (task.content?.statements?.length !== 4) issues.push("multiChoiceFour: statements");
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
      if (typeof task.answer?.value !== "number" || Number.isNaN(task.answer.value)) {
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

function main() {
  const rows = loadRegistry();
  const missing = [];
  const invalid = [];

  for (const row of rows) {
    const filePath = path.join(tasksDir, `${row.id}.json`);
    if (!fs.existsSync(filePath)) {
      missing.push(row.id);
      continue;
    }
    const task = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const issues = validateTask(task, row);
    if (issues.length) invalid.push({ id: row.id, examType: row.type, issues });
  }

  console.log(`Заданий в реестре: ${rows.length}`);
  console.log(`JSON-файлов: ${rows.length - missing.length}`);
  console.log(`Валидных: ${rows.length - missing.length - invalid.length}`);

  if (missing.length) {
    console.error(`Нет файлов: ${missing.length}`);
    console.error(missing.slice(0, 10).join(", "));
  }
  if (invalid.length) {
    console.error(`Невалидных: ${invalid.length}`);
    for (const item of invalid.slice(0, 10)) {
      console.error(`  № ${item.id}: ${item.issues.join("; ")}`);
    }
  }

  process.exit(missing.length + invalid.length > 0 ? 1 : 0);
}

main();
