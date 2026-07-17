import fs from "node:fs";
import path from "node:path";
import { root } from "./oge-migrate-lib.mjs";
import { VARIANT_META } from "./oge-variant-meta.mjs";
import { renderSubtask } from "./oge-render.mjs";

function loadTask(id) {
  const p = path.join(root, "data", "oge", "tasks", `${id}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadVariants() {
  const dir = path.join(root, "data", "oge", "variants");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    .sort((a, b) => {
      const ao = VARIANT_META[a.sourceDir]?.sortOrder ?? 99;
      const bo = VARIANT_META[b.sourceDir]?.sortOrder ?? 99;
      return ao - bo;
    });
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

function buildVariantPage(variant) {
  let body = "";
  let scripts = "";

  for (const slot of variant.tasks) {
    const task = loadTask(slot.taskId);
    const suffix = `-t${task.id}`;
    const { html, script } = renderSubtask(task, {
      mode: "type",
      suffix,
      wrapId: `oge-var-${task.id}`,
    });

    body += `        <section class="oge-variant-task" id="oge-variant-slot-${slot.slot}">
          <h3 class="oge-variant-task__title">
            Задание ${slot.slot}
            <span class="oge-variant-task__meta"
              >(<a class="oge-task-seq" href="../ex/${task.id}.html">№ ${task.id}</a> ·
              <a href="../type-${String(slot.slot).padStart(2, "0")}.html">все примеры типа</a>)</span
            >
          </h3>
          <p class="lead oge-variant-task__lead">${task.meta.lead}</p>
${html}
        </section>
`;
    if (script) scripts += script + "\n";
  }

  const articleInner = `        <p><a href="index.html">← К списку вариантов</a> · <a href="../index.html">ОГЭ</a></p>
        <h2>${variant.title}</h2>
        <p class="lead">Полный вариант ОГЭ по химии: задания 1–23 на одной странице.</p>
        <p>Источник: ${variant.source}</p>
${body.trimEnd()}`;

  return shell({
    title: `ОГЭ — ${variant.title}`,
    cssBase: "../../..",
    jsBase: "../../..",
    nav: {
      home: "../../../index.html",
      topics: "../../topics/index.html",
      tables: "../../tables.html",
      oge: "../index.html",
    },
    articleInner,
    scripts,
  });
}

function buildVariantsIndex(variants) {
  const items = variants
    .map((v) => {
      const ids = v.tasks.map((t) => t.taskId);
      return `          <li>
            <a href="${v.slug}.html"><strong>${v.title}</strong></a>
            <span class="oge-variant-list__ids"> (задания № ${ids[0]}–${ids[ids.length - 1]})</span>
          </li>`;
    })
    .join("\n");

  const articleInner = `        <p><a href="../index.html">← К разделу ОГЭ</a></p>
        <h2>Готовые варианты ОГЭ</h2>
        <p class="lead">
          Полные варианты из 23 заданий. Каждый вариант — отдельная страница для
          решения подряд, как на экзамене.
        </p>
        <ul class="topic-list oge-variant-list">
${items}
        </ul>`;

  return shell({
    title: "ОГЭ — готовые варианты",
    cssBase: "../../..",
    jsBase: "../../..",
    nav: {
      home: "../../../index.html",
      topics: "../../topics/index.html",
      tables: "../../tables.html",
      oge: "../index.html",
    },
    articleInner,
    scripts: "",
  });
}

export function buildAllVariantPages() {
  const variants = loadVariants();
  if (!variants.length) {
    throw new Error(
      "Нет data/oge/variants/*.json — запустите npm run generate:oge-variants",
    );
  }

  const outDir = path.join(root, "pages", "oge", "variants");
  fs.mkdirSync(outDir, { recursive: true });

  for (const variant of variants) {
    fs.writeFileSync(
      path.join(outDir, `${variant.slug}.html`),
      buildVariantPage(variant),
      "utf8",
    );
    console.log(`OK variants/${variant.slug}.html`);
  }

  fs.writeFileSync(
    path.join(outDir, "index.html"),
    buildVariantsIndex(variants),
    "utf8",
  );
  console.log("OK variants/index.html");
  return variants.length;
}
