import fs from "node:fs";
import path from "node:path";
import { loadRegistry, pad2, root } from "./oge-migrate-lib.mjs";
import { buildAllVariantPages } from "./build-oge-variants.mjs";
import { renderSubtask } from "./oge-render.mjs";
import { pointsLabel, pointsNote } from "./oge-points.mjs";

/** Плашка «сколько даёт задание на экзамене» — под подзаголовком типа. */
function pointsBadge(examType) {
  const label = pointsLabel(examType);
  if (!label) return "";
  const note = pointsNote(examType);
  return `\n      <p class="oge-points">
        <span class="oge-points__value">${label}</span> на экзамене${
          note ? `<span class="oge-points__note">${note}</span>` : ""
        }
      </p>`;
}

function rowSortPriority(row) {
  if (row.sourceDir === "2026-demo") return 0;
  const m = row.sourceDir?.match(/^variant-(\d+)$/);
  if (m) return parseInt(m[1], 10);
  return 11;
}

function sortRowsForType(rows) {
  return rows.slice().sort((a, b) => {
    const ap = rowSortPriority(a);
    const bp = rowSortPriority(b);
    if (ap !== bp) return ap - bp;
    return a.id - b.id;
  });
}

function loadTask(id) {
  const p = path.join(root, "data", "oge", "tasks", `${id}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Нет JSON задания: ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function shell({ title, cssBase, jsBase, nav, articleInner, scripts = "" }) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="${cssBase}/css/style.css" />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
    />
    <script src="${jsBase}/js/theme.js"></script>
    <script src="${jsBase}/js/oge-check-feedback.js"></script>
  </head>
  <body>
    <header class="site-header">
      <div class="site-header__inner">
        <h1>ОГЭ</h1>
        <div class="site-header__tail">
          <nav>
            <a href="${nav.home}">Главная</a>
            <a href="${nav.topics}">Темы</a>
            <a href="${nav.tables}">Таблицы</a>
            <a href="${nav.oge}">ОГЭ</a>
          </nav>
          <button
            type="button"
            class="theme-toggle"
            aria-label="Включить светлую тему"
          >
            <span class="material-symbols-outlined" aria-hidden="true"
              >light_mode</span
            >
          </button>
        </div>
      </div>
    </header>

    <main class="container">
      <article class="card">
${articleInner}
      </article>
    </main>
${scripts}
  </body>
</html>
`;
}

/**
 * Звёздочка «сложное задание» — и всё, без пояснений.
 *
 * Раньше рядом печаталась плашка «★ Задание повышенной сложности» с текстом
 * `meta.advancedNote`, и тот же текст висел в подсказке при наведении. По решению
 * автора сайта это убрано: пояснения на деле подсказывали не ход рассуждения, а
 * сам ответ. `advancedNote` остаётся в JSON как внутренняя заметка и на страницы
 * не попадает.
 */
function hardMark(task) {
  if (!task.meta.advanced) return "";
  return `<span class="oge-hard" aria-label="сложное задание">★</span>`;
}

/**
 * Задания 18 и 19 в варианте идут парой с общим условием: сначала считают
 * массовую долю, затем по ней — массу. Если у задания указан meta.linkedTaskId,
 * показываем пару так же, как в экзаменационном бланке: одна напоминалка про
 * атомные массы, один текст о веществе, а под ними оба задания подряд.
 *
 * Общую часть второго задания (meta.sharedBlocks первых блоков) не повторяем —
 * она уже напечатана выше.
 */
function renderLinkedTask(task) {
  const linkedId = task.meta.linkedTaskId;
  if (!linkedId) return { html: "", script: "" };

  const linked = loadTask(linkedId);
  /* Пара упорядочена: 18 — начало задачи, 19 — её продолжение. Разворачиваем
     на странице только вперёд, иначе задание 19 показало бы 18 второй раз. */
  if (linked.examType <= task.examType) {
    return {
      script: "",
      html: `
      <p class="oge-pair-back">
        Начало этой задачи — <a href="${linkedId}.html">задание ${linked.examType} № ${linkedId}</a>:
        там вычисляют массовую долю, которая нужна здесь.
      </p>`,
    };
  }

  const shared = linked.meta.sharedBlocks ?? 0;
  const own = { ...linked, blocks: linked.blocks.slice(shared) };
  const wrapId = `oge-ex-linked-${linkedId}`;
  const { html, script } = renderSubtask(own, {
    mode: "ex",
    suffix: "L",
    wrapId,
  });

  return {
    script,
    html: `
      <h3 class="oge-example-title oge-pair-title">${hardMark(linked)}<a class="oge-task-seq" href="${linkedId}.html">Задание ${linked.examType} № ${linkedId}</a></h3>
${html}
      <p>Источник: ${linked.meta.source}</p>`,
  };
}

function buildExPage(task) {
  const type = task.examType;
  const p = pad2(type);
  const prevP = type > 1 ? pad2(type - 1) : null;
  const nextP = type < 23 ? pad2(type + 1) : null;
  const prevLink = prevP
    ? `<a href="../type-${prevP}.html">← Задание ${type - 1}</a>`
    : `<a href="../index.html">← К списку</a>`;
  const nextLink = nextP
    ? `<a class="oge-task-nav__next" href="../type-${nextP}.html">Задание ${type + 1} →</a>`
    : `<a class="oge-task-nav__next" href="../index.html">К списку заданий →</a>`;

  const wrapId = `oge-ex-${task.id}`;
  const { html, script } = renderSubtask(task, { mode: "ex", wrapId });
  const linked = renderLinkedTask(task);

  const articleInner = `<p><a href="../index.html">← К списку заданий ОГЭ</a> · <a href="../type-${p}.html">Задание ${type}</a></p>
      <nav class="oge-task-nav" aria-label="Соседние типы заданий ОГЭ">
        ${prevLink}
        ${nextLink}
      </nav>
      <h2>${hardMark(task)}Задание ${type} № ${task.id}</h2>
      <p class="lead">${task.meta.lead}</p>${pointsBadge(type)}

      ${html}
      <p>Источник: ${task.meta.source}</p>
${linked.html}`;

  return shell({
    title: `ОГЭ, задание ${type} № ${task.id} — ${task.meta.lead}`,
    cssBase: "../../..",
    jsBase: "../../..",
    nav: {
      home: "../../../index.html",
      topics: "../../topics/index.html",
      tables: "../../tables.html",
      oge: "../index.html",
    },
    articleInner,
    scripts: [script, linked.script].filter(Boolean).join("\n"),
  });
}

function buildTypePage(examType, tasks) {
  const p = pad2(examType);
  const lead = tasks[0].meta.lead;
  const prevP = examType > 1 ? pad2(examType - 1) : null;
  const nextP = examType < 23 ? pad2(examType + 1) : null;
  const prevLink = prevP
    ? `<a href="type-${prevP}.html">← Задание ${examType - 1}</a>`
    : `<a href="index.html">← К списку заданий</a>`;

  let inserts = "";
  let scripts = "";

  /* Каждый пример заворачиваем в section.oge-example: заголовок, плашку ★ и само
     условие нужно переставлять одним куском, когда включают сортировку по сложности. */
  for (const task of tasks) {
    const suffix = `-${task.id}`;
    const { html, script } = renderSubtask(task, {
      mode: "type",
      suffix,
      wrapId: `oge-ex-${task.id}`,
    });
    inserts += `      <section class="oge-example"${task.meta.advanced ? ' data-oge-advanced="1"' : ""}>
      <h3 class="oge-example-title" id="oge-ex-title-${task.id}">${hardMark(task)}<a class="oge-task-seq" href="ex/${task.id}.html">Задание ${examType} № ${task.id}</a></h3>
${html}
      </section>
`;
    if (script) scripts += script + "\n";
  }

  const advancedCount = tasks.filter((t) => t.meta.advanced).length;
  /* Кнопка нужна только там, где вообще есть ★ — иначе сортировать нечего. */
  const sortControl = advancedCount
    ? `\n        <p class="oge-sort">
          <button type="button" class="btn-secondary oge-sort-btn">
            Порядок: обычный
          </button>
          <span class="oge-sort__note"
            >★ сложных: ${advancedCount} из ${tasks.length}</span
          >
        </p>`
    : "";

  const articleInner = `<p><a href="index.html">← К списку заданий ОГЭ</a></p>
        <nav class="oge-task-nav" aria-label="Соседние задания ОГЭ">
          ${prevLink}
          ${
            nextP
              ? `<a class="oge-task-nav__next" href="type-${nextP}.html">К следующему типу (задание ${examType + 1}) →</a>`
              : `<a class="oge-task-nav__next" href="index.html">К списку заданий →</a>`
          }
        </nav>
        <h2>Задание ${examType}</h2>
        <p class="lead">${lead}</p>${pointsBadge(examType)}${sortControl}
${inserts.trimEnd()}`;

  return shell({
    title: `ОГЭ, задание ${examType} — ${lead}`,
    cssBase: "../..",
    jsBase: "../..",
    nav: {
      home: "../../index.html",
      topics: "../topics/index.html",
      tables: "../tables.html",
      oge: "index.html",
    },
    articleInner,
    scripts,
  });
}

function main() {
  const rows = loadRegistry();
  const ogeDir = path.join(root, "pages", "oge");
  const exDir = path.join(ogeDir, "ex");
  fs.mkdirSync(exDir, { recursive: true });

  const byType = new Map();
  for (const row of rows) {
    if (!byType.has(row.type)) byType.set(row.type, []);
    byType.get(row.type).push(row);
  }

  const index = [];
  for (const row of rows) {
    const task = loadTask(row.id);
    fs.writeFileSync(
      path.join(exDir, `${row.id}.html`),
      buildExPage(task),
      "utf8",
    );
    index.push({
      id: task.id,
      examType: task.examType,
      lead: task.meta.lead,
      ...(task.meta.advanced ? { advanced: true } : {}),
    });
  }
  index.sort((a, b) => a.id - b.id);
  fs.writeFileSync(
    path.join(ogeDir, "task-index.json"),
    JSON.stringify(index, null, 2) + "\n",
    "utf8",
  );

  for (let examType = 1; examType <= 23; examType++) {
    const typeRows = byType.get(examType);
    if (!typeRows?.length) continue;
    const tasks = sortRowsForType(typeRows).map((r) => loadTask(r.id));
    fs.writeFileSync(
      path.join(ogeDir, `type-${pad2(examType)}.html`),
      buildTypePage(examType, tasks),
      "utf8",
    );
    console.log(`OK type-${pad2(examType)}.html (${tasks.length} примеров)`);
  }

  console.log(`Готово: ${rows.length} ex-страниц и type-01…23 из JSON`);
  console.log(`Готово: pages/oge/task-index.json (${index.length} записей)`);
  const variantCount = buildAllVariantPages();
  console.log(`Готово: ${variantCount} вариантов в pages/oge/variants/`);
}

main();
