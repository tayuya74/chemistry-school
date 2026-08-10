/**
 * Поиск повторяющихся заданий в банке ОГЭ.
 *
 * Запускается по требованию, а не при каждой сборке: часть повторов законна
 * (ФИПИ переносит задания из демоверсии в демоверсию, издательство ставит одно
 * задание в два варианта), и такую проверку нельзя делать блокирующей —
 * к постоянной ругани на то, что менять не нужно, быстро перестают
 * прислушиваться.
 *
 *   npm run check:oge-duplicates            — отчёт
 *   npm run check:oge-duplicates -- --near  — плюс похожие, но не одинаковые
 *   npm run check:oge-duplicates -- --strict — ненулевой код возврата при полных дублях
 */
import fs from "node:fs";
import path from "node:path";
import { loadRegistry, root } from "./oge-migrate-lib.mjs";

const tasksDir = path.join(root, "data", "oge", "tasks");
const variantsDir = path.join(root, "data", "oge", "variants");

/** Порог совпадения набора вариантов, при котором задания считаются похожими. */
const NEAR_THRESHOLD = 0.6;

const args = process.argv.slice(2);
const showNear = args.includes("--near");
const strict = args.includes("--strict");

/** Приводит текст к виду, в котором сравнение не зависит от вёрстки и пунктуации. */
function normalize(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/ /g, " ")
    .toLowerCase()
    .replace(/[«»"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Варианты ответа лежат в разных полях в зависимости от uiKind. */
function optionsOf(task) {
  const content = task.content ?? {};
  if (content.statements) return content.statements;
  if (content.items) return content.items;
  if (content.left || content.right)
    return [...(content.left ?? []), ...(content.right ?? [])];
  return [];
}

/**
 * Отпечаток содержания задания. У части шаблонов списка вариантов нет
 * (схема строения атома, числовой ответ) — там сравниваем само содержимое,
 * иначе все задания с одинаковой вводной фразой слиплись бы в одну «группу».
 */
function shapeOf(task, options) {
  if (options.length) return [...options].sort().join("~");
  return normalize(JSON.stringify(task.content ?? {}));
}

function answerOf(task) {
  const a = task.answer ?? {};
  return JSON.stringify(
    a.correct ?? a.sequence ?? a.mapping ?? a.values ?? null,
  );
}

/** В какие собранные варианты входит задание — удалять входящее в вариант нельзя. */
function loadVariantMembership() {
  const map = new Map();
  if (!fs.existsSync(variantsDir)) return map;
  for (const file of fs.readdirSync(variantsDir)) {
    if (!file.endsWith(".json")) continue;
    const variant = JSON.parse(
      fs.readFileSync(path.join(variantsDir, file), "utf8"),
    );
    for (const entry of variant.tasks ?? []) {
      const list = map.get(entry.taskId) ?? [];
      list.push(variant.title ?? variant.slug);
      map.set(entry.taskId, list);
    }
  }
  return map;
}

function jaccard(a, b) {
  let shared = 0;
  for (const value of a) if (b.has(value)) shared++;
  return shared / (a.size + b.size - shared);
}

function describe(task, membership) {
  const where = membership.get(task.id);
  const place = where ? where.join(", ") : "не входит ни в один вариант";
  return `id ${task.id} [${task.sourceDir}] — ${place}`;
}

function main() {
  const membership = loadVariantMembership();
  const tasks = [];

  for (const row of loadRegistry()) {
    const filePath = path.join(tasksDir, `${row.id}.json`);
    if (!fs.existsSync(filePath)) continue;
    const task = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const options = optionsOf(task).map(normalize);
    tasks.push({
      id: row.id,
      examType: row.type,
      sourceDir: row.sourceDir ?? "default",
      prompt: normalize((task.blocks ?? []).map((b) => b.html).join(" ")),
      options,
      optionSet: new Set(options),
      shape: shapeOf(task, options),
      answer: answerOf(task),
      fipi: (task.meta?.source ?? "").match(/№\s*(\S+)/)?.[1] ?? null,
    });
  }

  console.log(`Проверено заданий: ${tasks.length}\n`);
  let exactGroups = 0;

  /* 1. Один и тот же номер задания в банке ФИПИ использован дважды. */
  const byFipi = new Map();
  for (const task of tasks) {
    if (!task.fipi) continue;
    const list = byFipi.get(task.fipi) ?? [];
    list.push(task);
    byFipi.set(task.fipi, list);
  }
  const fipiRepeats = [...byFipi.entries()].filter(
    ([, list]) => list.length > 1,
  );
  if (fipiRepeats.length) {
    console.log(`ПОВТОР НОМЕРА ФИПИ: ${fipiRepeats.length}`);
    for (const [number, list] of fipiRepeats) {
      console.log(`  № ${number}: ${list.map((t) => t.id).join(", ")}`);
    }
    console.log("");
  }

  /* 2. Полные дубли: тот же тип, тот же вопрос, тот же набор вариантов. */
  const byShape = new Map();
  for (const task of tasks) {
    const key = [task.examType, task.prompt, task.shape].join("|");
    const list = byShape.get(key) ?? [];
    list.push(task);
    byShape.set(key, list);
  }

  for (const group of byShape.values()) {
    if (group.length < 2) continue;
    exactGroups++;
    const sameOrder = new Set(group.map((t) => t.options.join("~"))).size === 1;
    const sameAnswer = new Set(group.map((t) => t.answer)).size === 1;
    const kind =
      sameOrder && sameAnswer
        ? "ПОЛНЫЙ ДУБЛЬ"
        : sameOrder
          ? "то же содержание, ответы разные"
          : "тот же вопрос, порядок вариантов переставлен";
    console.log(`ДУБЛЬ (тип ${group[0].examType}) — ${kind}`);
    console.log(`  ${group[0].prompt.slice(0, 120)}`);
    for (const task of group) console.log(`  ${describe(task, membership)}`);
    if (!sameAnswer)
      console.log("  ответы разные — это ожидаемо при перестановке вариантов");
    const removable = group.filter((t) => !membership.has(t.id));
    console.log(
      removable.length
        ? `  можно удалить без вреда: ${removable.map((t) => t.id).join(", ")}`
        : "  все копии входят в собранные варианты — удаление сломает вариант",
    );
    console.log("");
  }

  /* 3. Похожие задания — только по флагу, иначе отчёт тонет в них. */
  if (showNear) {
    let near = 0;
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const a = tasks[i];
        const b = tasks[j];
        if (a.examType !== b.examType) continue;
        /* Шаблоны без списка вариантов сравнивать по «общим вариантам» нечем. */
        if (!a.optionSet.size || !b.optionSet.size) continue;
        /* Уже показано выше как группа с одинаковым содержанием. */
        if (a.prompt === b.prompt && a.shape === b.shape) continue;
        const score = jaccard(a.optionSet, b.optionSet);
        if (score < NEAR_THRESHOLD) continue;
        near++;
        const samePrompt = a.prompt === b.prompt;
        const sameAnswer = a.answer === b.answer;
        const note =
          samePrompt && sameAnswer
            ? " — вопрос и ответ совпадают, стоит посмотреть"
            : sameAnswer
              ? " — формулировки разные, ответ один"
              : "";
        console.log(
          `похоже (тип ${a.examType}): ${a.id} и ${b.id}, общих вариантов ${Math.round(score * 100)}%${note}`,
        );
      }
    }
    console.log(`\nПохожих пар: ${near}`);
  }

  console.log(
    exactGroups
      ? `Групп с одинаковым содержанием: ${exactGroups}`
      : "Заданий с одинаковым содержанием не найдено",
  );
  if (!showNear)
    console.log("Похожие, но не одинаковые задания: запустите с --near");

  process.exit(strict && (exactGroups || fipiRepeats.length) ? 1 : 0);
}

main();
