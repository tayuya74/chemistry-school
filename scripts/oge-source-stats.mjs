/**
 * Сколько заданий каждого типа взято из какого источника.
 *
 * Нужен, чтобы не держать это число в голове и не переписывать руками в AGENTS.md:
 * заметка про «сколько взято из банка ФИПИ» уже успела разойтись с реальностью
 * (утверждала, что типы 11–23 не брались, когда по типу 21 было уже 30 заданий).
 */
import fs from "node:fs";
import path from "node:path";
import { loadRegistry, root } from "./oge-migrate-lib.mjs";

const tasksDir = path.join(root, "data", "oge", "tasks");
const onlyBank = process.argv.includes("--bank");

const byType = new Map();
for (const row of loadRegistry()) {
  const file = path.join(tasksDir, `${row.id}.json`);
  if (!fs.existsSync(file)) continue;
  const task = JSON.parse(fs.readFileSync(file, "utf8"));
  const src = task.meta?.sourceDir ?? "(default)";
  if (!byType.has(row.type)) byType.set(row.type, new Map());
  const m = byType.get(row.type);
  m.set(src, (m.get(src) ?? 0) + 1);
}

const types = [...byType.keys()].sort((a, b) => a - b);

if (onlyBank) {
  const parts = types
    .map((t) => `${t} — ${byType.get(t).get("fipi-bank") ?? 0}`)
    .join(", ");
  console.log(`Из банка ФИПИ по типам: ${parts}`);
} else {
  let totalBank = 0;
  for (const t of types) {
    const m = byType.get(t);
    const bank = m.get("fipi-bank") ?? 0;
    totalBank += bank;
    /* Типовые варианты дают ровно по одному заданию каждого типа — перечислять их
       все для каждой строки бессмысленно, сворачиваем в одно число. */
    const others = [...m.entries()].filter(([k]) => k !== "fipi-bank");
    const variants = others.filter(([k]) => /^variant-\d+$/.test(k));
    const named = others.filter(([k]) => !/^variant-\d+$/.test(k));
    const rest = [
      variants.length
        ? `типовые варианты: ${variants.reduce((a, [, v]) => a + v, 0)}`
        : null,
      ...named.sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`),
    ]
      .filter(Boolean)
      .join(", ");
    const flag = bank > 25 ? "  ← за 25, добирать только после разговора" : "";
    console.log(
      `тип ${String(t).padStart(2)} | всего ${String(
        [...m.values()].reduce((a, b) => a + b, 0),
      ).padStart(3)} | банк ФИПИ ${String(bank).padStart(3)}${flag}` +
        (rest ? `\n            прочее — ${rest}` : ""),
    );
  }
  console.log(`\nВсего из банка ФИПИ: ${totalBank}`);
}
