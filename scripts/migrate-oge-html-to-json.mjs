import fs from "node:fs";
import path from "node:path";
import { loadRegistry, migrateRowToTask, root } from "./oge-migrate-lib.mjs";

const tasksDir = path.join(root, "data", "oge", "tasks");
const reportPath = path.join(root, "data", "oge", "migrate-report.json");

function main() {
  const rows = loadRegistry();
  fs.mkdirSync(tasksDir, { recursive: true });

  const ok = [];
  const failed = [];

  for (const row of rows) {
    try {
      const task = migrateRowToTask(row);
      const outPath = path.join(tasksDir, `${row.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(task, null, 2) + "\n", "utf8");
      ok.push(row.id);
    } catch (err) {
      failed.push({
        id: row.id,
        examType: row.type,
        sourceDir: row.sourceDir ?? "default",
        error: err.message,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    migrated: ok.length,
    failed: failed.length,
    failures: failed,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`Миграция: ${ok.length}/${rows.length} → data/oge/tasks/`);
  if (failed.length) {
    console.error(`Ошибок: ${failed.length}`);
    for (const f of failed.slice(0, 10)) {
      console.error(`  № ${f.id} (тип ${f.examType}): ${f.error}`);
    }
    process.exit(1);
  }
  console.log(`Отчёт: data/oge/migrate-report.json`);
}

main();
