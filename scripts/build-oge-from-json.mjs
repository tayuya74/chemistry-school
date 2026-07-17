import fs from "node:fs";
import path from "node:path";
import { loadRegistry, pad2, root } from "./oge-migrate-lib.mjs";
import { buildAllVariantPages } from "./build-oge-variants.mjs";
import { renderSubtask } from "./oge-render.mjs";

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

  const { html, script } = renderSubtask(task, { mode: "ex" });

  const articleInner = `<p><a href="../index.html">← К списку заданий ОГЭ</a> · <a href="../type-${p}.html">Задание ${type}</a></p>
      <nav class="oge-task-nav" aria-label="Соседние типы заданий ОГЭ">
        ${prevLink}
        ${nextLink}
      </nav>
      <h2>Задание ${type} № ${task.id}</h2>
      <p class="lead">${task.meta.lead}</p>

      ${html}

      <p>Источник: ${task.meta.source}</p>`;

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
    scripts: script,
  });
}

function buildTypePage(examType, tasks) {
  const p = pad2(examType);
  const lead = tasks[0].meta.lead;
  const nextP = examType < 23 ? pad2(examType + 1) : null;

  let inserts = "";
  let scripts = "";

  for (const task of tasks) {
    const suffix = `-${task.id}`;
    const { html, script } = renderSubtask(task, {
      mode: "type",
      suffix,
      wrapId: `oge-ex-${task.id}`,
    });
    inserts += `      <h3 class="oge-example-title" id="oge-ex-title-${task.id}"><a class="oge-task-seq" href="ex/${task.id}.html">Задание ${examType} № ${task.id}</a></h3>
${html}
`;
    if (script) scripts += script + "\n";
  }

  const articleInner = `<p><a href="index.html">← К списку заданий ОГЭ</a></p>
        <nav class="oge-task-nav" aria-label="Соседние задания ОГЭ">
          <a href="index.html">← К списку заданий</a>
          ${
            nextP
              ? `<a class="oge-task-nav__next" href="type-${nextP}.html">К следующему типу (задание ${examType + 1}) →</a>`
              : `<a class="oge-task-nav__next" href="index.html">К списку заданий →</a>`
          }
        </nav>
        <h2>Задание ${examType}</h2>
        <p class="lead">${lead}</p>
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

  for (const row of rows) {
    const task = loadTask(row.id);
    fs.writeFileSync(
      path.join(exDir, `${row.id}.html`),
      buildExPage(task),
      "utf8",
    );
  }

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
  const variantCount = buildAllVariantPages();
  console.log(`Готово: ${variantCount} вариантов в pages/oge/variants/`);
}

main();
