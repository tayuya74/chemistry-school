/**
 * Конструктор своего варианта: случайный отбор N заданий каждого типа
 * из pages/oge/task-index.json.
 *
 * Скрипт обслуживает две страницы:
 *   builder.html          — таблица с числами по каждому типу;
 *   variants/index.html   — одна кнопка «сгенерировать вариант»
 *                           (по одному заданию каждого типа).
 * Путь к каталогу берётся из data-index на кнопке, потому что страницы
 * лежат на разной глубине.
 */
(function () {
  const TOTAL_TYPES = 23;

  function renderTypeRows(tbody) {
    for (let type = 1; type <= TOTAL_TYPES; type++) {
      const tr = document.createElement("tr");

      const labelCell = document.createElement("td");
      labelCell.textContent = `Задание ${type}`;
      tr.appendChild(labelCell);

      const inputCell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = "0";
      input.className = "oge-answer-input";
      input.id = `builderCount${type}`;
      input.setAttribute("aria-label", `Сколько заданий типа ${type} взять`);
      inputCell.appendChild(input);
      tr.appendChild(inputCell);

      tbody.appendChild(tr);
    }
  }

  /** Проставляет одно и то же число во все поля таблицы. */
  function setAllCounts(value) {
    for (let type = 1; type <= TOTAL_TYPES; type++) {
      const input = document.getElementById(`builderCount${type}`);
      if (input) input.value = String(value);
    }
  }

  function readCounts() {
    const counts = [];
    for (let type = 1; type <= TOTAL_TYPES; type++) {
      const input = document.getElementById(`builderCount${type}`);
      const n = parseInt(input.value, 10);
      if (n > 0) counts.push([type, n]);
    }
    return counts;
  }

  /** По одному заданию каждого из 23 типов — целый вариант. */
  function fullVariantCounts() {
    const counts = [];
    for (let type = 1; type <= TOTAL_TYPES; type++) counts.push([type, 1]);
    return counts;
  }

  function pickRandom(list, n) {
    const pool = list.slice();
    const picked = [];
    while (picked.length < n && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(i, 1)[0]);
    }
    return picked;
  }

  function groupByType(index) {
    const byType = new Map();
    index.forEach((row) => {
      if (!byType.has(row.examType)) byType.set(row.examType, []);
      byType.get(row.examType).push(row);
    });
    return byType;
  }

  function renderResult(container, groups, warnings, options) {
    const opts = options || {};
    container.innerHTML = "";

    if (opts.title) {
      const h = document.createElement("h3");
      h.textContent = opts.title;
      container.appendChild(h);
    }

    if (warnings.length) {
      const warn = document.createElement("p");
      warn.className = "tip";
      warn.textContent = warnings.join(" ");
      container.appendChild(warn);
    }

    if (!groups.length) {
      const empty = document.createElement("p");
      empty.textContent =
        opts.emptyText || "Укажите хотя бы одно число больше нуля.";
      container.appendChild(empty);
      return;
    }

    groups.forEach(({ type, picked }) => {
      const heading = document.createElement("h3");
      heading.className = "oge-example-title";
      heading.textContent =
        picked.length > 1
          ? `Задание ${type} (${picked.length})`
          : `Задание ${type}`;
      container.appendChild(heading);

      const list = document.createElement("ul");
      list.className = "topic-list";
      picked.forEach((row) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `${opts.linkPrefix || "ex/"}${row.id}.html`;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = `${row.advanced ? "★ " : ""}№ ${row.id} — ${row.lead}`;
        item.appendChild(link);
        list.appendChild(item);
      });
      container.appendChild(list);
    });
  }

  async function loadIndex(url) {
    const res = await fetch(url);
    return res.json();
  }

  async function loadTask(taskDir, id) {
    const res = await fetch(`${taskDir}${id}.json`);
    return res.json();
  }

  /**
   * Как build(), но вместо ссылок вставляет само содержимое заданий
   * (текст, поля ответа, кнопку «Проверить») — для кнопки «Сгенерировать
   * вариант», которая должна сразу показать вариант, а не список ссылок.
   */
  async function buildFull(resultEl, counts, options) {
    const opts = options || {};
    resultEl.textContent = "Собираю…";

    let index;
    try {
      index = await loadIndex(opts.indexUrl || "task-index.json");
    } catch {
      resultEl.textContent =
        "Не удалось загрузить каталог заданий (task-index.json).";
      return;
    }

    const byType = groupByType(index);
    const warnings = [];
    const picks = [];
    counts.forEach(([type, n]) => {
      const available = byType.get(type) ?? [];
      if (available.length < n) {
        warnings.push(
          `Тип ${type}: запрошено ${n}, в наличии только ${available.length} — взяты все.`,
        );
      }
      pickRandom(available, n).forEach((row) => picks.push({ type, row }));
    });

    if (!picks.length) {
      resultEl.innerHTML = "";
      const empty = document.createElement("p");
      empty.textContent = opts.emptyText || "В каталоге не нашлось заданий.";
      resultEl.appendChild(empty);
      return;
    }

    resultEl.textContent = "Загружаю задания…";
    const taskDir = opts.taskDir || "../../../data/oge/tasks/";
    let tasks;
    try {
      tasks = await Promise.all(picks.map((p) => loadTask(taskDir, p.row.id)));
    } catch {
      resultEl.textContent = "Не удалось загрузить содержимое заданий.";
      return;
    }

    resultEl.innerHTML = "";
    if (opts.title) {
      const h = document.createElement("h3");
      h.textContent = opts.title;
      resultEl.appendChild(h);
    }
    if (warnings.length) {
      const warn = document.createElement("p");
      warn.className = "tip";
      warn.textContent = warnings.join(" ");
      resultEl.appendChild(warn);
    }

    const linkPrefix = opts.linkPrefix || "../ex/";
    picks.forEach((p, i) => {
      const task = tasks[i];
      const suffix = `-t${task.id}`;
      const wrapId = `oge-quick-${task.id}`;
      const section = document.createElement("section");
      section.className = "oge-variant-task";
      section.innerHTML = `<h3 class="oge-variant-task__title">Задание ${p.type}
        <span class="oge-variant-task__meta">(<a class="oge-task-seq" href="${linkPrefix}${task.id}.html" target="_blank" rel="noopener">№ ${task.id}</a>)</span>
      </h3>
      <p class="lead oge-variant-task__lead">${task.meta.lead}</p>
      ${window.OGE_RENDER.buildSubtaskHtml(task, suffix, wrapId)}`;
      resultEl.appendChild(section);

      const root = document.getElementById(wrapId);
      if (root) window.OGE_RENDER.attachCheckHandlers(root, task, suffix);
    });

    if (window.OGE_attachNumericGuards) window.OGE_attachNumericGuards();
    if (window.initOgeSubtaskCheckboxLimits) window.initOgeSubtaskCheckboxLimits();
  }

  /** Общая сборка: считает выборку и рисует результат. */
  async function build(resultEl, counts, options) {
    const opts = options || {};
    resultEl.textContent = "Собираю…";

    let index;
    try {
      index = await loadIndex(opts.indexUrl || "task-index.json");
    } catch {
      resultEl.textContent =
        "Не удалось загрузить каталог заданий (task-index.json).";
      return;
    }

    const onlyHard = opts.onlyHard;
    const pool = onlyHard ? index.filter((row) => row.advanced) : index;
    const byType = groupByType(pool);
    const warnings = [];
    const groups = [];

    counts.forEach(([type, n]) => {
      const available = byType.get(type) ?? [];
      if (available.length < n) {
        warnings.push(
          `Тип ${type}: запрошено ${n}, ${onlyHard ? "сложных заданий" : "в наличии"} только ${available.length} — взяты все.`,
        );
      }
      const picked = pickRandom(available, n);
      if (picked.length) groups.push({ type, picked });
    });

    renderResult(resultEl, groups, warnings, opts);
  }

  function initBuilder() {
    const tbody = document.querySelector("#builderTable tbody");
    const buildBtn = document.getElementById("buildBtn");
    const resultEl = document.getElementById("builderResult");
    if (!tbody || !buildBtn || !resultEl) return false;

    renderTypeRows(tbody);

    const fillBtn = document.getElementById("fillOnesBtn");
    if (fillBtn) {
      const useFullRender = Boolean(window.OGE_RENDER);
      fillBtn.addEventListener("click", () => {
        setAllCounts(1);
        (useFullRender ? buildFull : build)(resultEl, fullVariantCounts(), {
          linkPrefix: "ex/",
          taskDir: fillBtn.dataset.taskDir || "../../data/oge/tasks/",
          title: "Случайный вариант из банка заданий",
          emptyText: "В каталоге не нашлось заданий.",
        });
      });
    }

    const clearBtn = document.getElementById("clearCountsBtn");
    if (clearBtn) clearBtn.addEventListener("click", () => setAllCounts(0));

    buildBtn.addEventListener("click", () =>
      build(resultEl, readCounts(), {
        onlyHard: document.getElementById("onlyHard")?.checked,
      }),
    );
    return true;
  }

  function initQuickVariant() {
    const btn = document.getElementById("quickVariantBtn");
    const resultEl = document.getElementById("builderResult");
    if (!btn || !resultEl) return false;

    const useFullRender = Boolean(window.OGE_RENDER);
    btn.addEventListener("click", () =>
      (useFullRender ? buildFull : build)(resultEl, fullVariantCounts(), {
        indexUrl: btn.dataset.index || "../task-index.json",
        linkPrefix: btn.dataset.linkPrefix || "../ex/",
        taskDir: btn.dataset.taskDir || "../../../data/oge/tasks/",
        title: "Случайный вариант из банка заданий",
        emptyText: "В каталоге не нашлось заданий.",
      }),
    );
    return true;
  }

  function init() {
    initBuilder();
    initQuickVariant();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
