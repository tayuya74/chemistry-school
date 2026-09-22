import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { root } from "./oge-migrate-lib.mjs";

const generatedDir = path.join(root, "pages", "oge");

function snapshot(dir, prefix = "") {
  const files = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const [name, hash] of snapshot(filePath, relative)) {
        files.set(name, hash);
      }
      continue;
    }
    const hash = crypto
      .createHash("sha256")
      .update(fs.readFileSync(filePath))
      .digest("hex");
    files.set(relative, hash);
  }
  return files;
}

const before = snapshot(generatedDir);
await import("./build-oge-from-json.mjs");
const after = snapshot(generatedDir);
const names = new Set([...before.keys(), ...after.keys()]);
const changed = [...names].filter(
  (name) => before.get(name) !== after.get(name),
);

if (changed.length) {
  console.error("Сгенерированные страницы устарели:");
  for (const name of changed.slice(0, 30)) console.error(`  pages/oge/${name}`);
  if (changed.length > 30) console.error(`  …и ещё ${changed.length - 30}`);
  process.exitCode = 1;
} else {
  console.log(`Сгенерированные страницы актуальны (${after.size} файлов)`);
}
