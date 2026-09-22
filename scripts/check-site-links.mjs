import fs from "node:fs";
import path from "node:path";
import { root } from "./oge-migrate-lib.mjs";

const ignoredSchemes = /^(https?:|mailto:|tel:|data:|javascript:)/i;
const linkPattern = /(?:href|src)=["']([^"'#?]+)["']/g;

function collectHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(filePath, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(filePath);
    }
  }
  return files;
}

function publicHtmlFiles() {
  return [
    ...["index.html", "oge.html", "tables.html", "topics.html"].map((name) =>
      path.join(root, name),
    ),
    ...collectHtmlFiles(path.join(root, "pages")),
  ];
}

function targetPath(sourceFile, reference) {
  if (reference.startsWith("/")) return path.join(root, reference.slice(1));
  return path.resolve(path.dirname(sourceFile), reference);
}

const missing = [];
const files = publicHtmlFiles();

for (const filePath of files) {
  const html = fs.readFileSync(filePath, "utf8");
  for (const match of html.matchAll(linkPattern)) {
    const reference = match[1];
    if (ignoredSchemes.test(reference)) continue;

    const target = targetPath(filePath, reference);
    if (!fs.existsSync(target)) {
      missing.push(`${path.relative(root, filePath)} → ${reference}`);
    }
  }
}

console.log(`Проверено HTML-страниц: ${files.length}`);
console.log(`Недоступных локальных ссылок: ${missing.length}`);

if (missing.length) {
  console.error(missing.join("\n"));
  process.exitCode = 1;
}
