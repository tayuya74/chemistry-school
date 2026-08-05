import fs from "node:fs";
import path from "node:path";
import { loadRegistry, root } from "./oge-migrate-lib.mjs";
import { validateTask } from "./oge-task-schema.mjs";

const tasksDir = path.join(root, "data", "oge", "tasks");

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
