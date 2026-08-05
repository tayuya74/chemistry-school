import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./oge-migrate-lib.mjs";
import { validateDraft } from "./oge-task-schema.mjs";

const registryPath = path.join(root, "data", "oge-registry.json");
const tasksDir = path.join(root, "data", "oge", "tasks");

const LAST_ENTRY_RE =
  /(\{ "id": \d+, "type": \d+, "sourceDir": "[^"]*" \})(\r?\n)(\s*)\]/;

function loadRegistryRows() {
  const raw = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  return raw.examples ?? raw;
}

function nextId(rows) {
  return Math.max(...rows.map((r) => r.id)) + 1;
}

/** Дописывает одну запись в конец массива реестра текстом, не трогая остальной файл (сохраняет компактный стиль «один пример — одна строка»). */
function appendRegistryEntry(id, type, sourceDir) {
  const text = fs.readFileSync(registryPath, "utf8");
  const m = text.match(LAST_ENTRY_RE);
  if (!m) {
    throw new Error("Не удалось найти место вставки в data/oge-registry.json — неожиданный формат файла");
  }
  const [whole, lastEntry, newline, closingIndent] = m;
  const entryLine = `{ "id": ${id}, "type": ${type}, "sourceDir": ${JSON.stringify(sourceDir)} }`;
  const replacement = `${lastEntry},${newline}    ${entryLine}${newline}${closingIndent}]`;
  const newText = text.slice(0, m.index) + replacement + text.slice(m.index + whole.length);
  fs.writeFileSync(registryPath, newText, "utf8");
}

function run(npmScript) {
  execFileSync("npm", ["run", npmScript], { cwd: root, stdio: "pipe", shell: true });
}

function main() {
  const draftPath = process.argv[2];
  if (!draftPath) {
    console.error("Использование: npm run add:oge-task -- <путь-к-черновику.json>");
    process.exit(1);
  }

  const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
  const issues = validateDraft(draft);
  if (issues.length) {
    console.error("Черновик не прошёл проверку:");
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const rows = loadRegistryRows();
  const id = nextId(rows);
  const sourceDir = draft.meta?.sourceDir || "own";

  const task = {
    id,
    examType: draft.examType,
    uiKind: draft.uiKind,
    meta: { ...draft.meta, sourceDir },
    blocks: draft.blocks,
    content: draft.content,
    answer: draft.answer,
    solution: draft.solution ?? null,
  };

  const taskPath = path.join(tasksDir, `${id}.json`);
  const registryBackup = fs.readFileSync(registryPath, "utf8");

  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2) + "\n", "utf8");
  appendRegistryEntry(id, draft.examType, sourceDir);

  try {
    run("validate:oge-tasks");
    run("build:oge");
  } catch (err) {
    fs.rmSync(taskPath, { force: true });
    fs.writeFileSync(registryPath, registryBackup, "utf8");
    console.error("Сборка/валидация не прошла — откатил изменения. Ничего не опубликовано.");
    console.error(err.stdout?.toString() ?? err.message);
    process.exit(1);
  }

  console.log(`Готово: задание № ${id} (тип ${draft.examType}) добавлено.`);
  console.log(`  data/oge/tasks/${id}.json`);
  console.log(`  pages/oge/ex/${id}.html`);
  console.log(`  pages/oge/type-${String(draft.examType).padStart(2, "0")}.html`);
}

main();
