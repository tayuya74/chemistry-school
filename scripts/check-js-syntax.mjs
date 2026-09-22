import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root } from "./oge-migrate-lib.mjs";

function collectScripts(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectScripts(filePath, files);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) {
      files.push(filePath);
    }
  }
  return files;
}

const files = [
  ...collectScripts(path.join(root, "js")),
  ...collectScripts(path.join(root, "scripts")),
];
const invalid = [];

for (const filePath of files) {
  const result = spawnSync(process.execPath, ["--check", filePath], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    invalid.push({ filePath, error: result.stderr.trim() });
  }
}

console.log(`Проверено JavaScript-файлов: ${files.length}`);
console.log(`Ошибок синтаксиса: ${invalid.length}`);

if (invalid.length) {
  for (const { filePath, error } of invalid) {
    console.error(`\n${path.relative(root, filePath)}\n${error}`);
  }
  process.exitCode = 1;
}
