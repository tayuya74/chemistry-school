/**
 * Свой вариант на главной странице раздела ОГЭ (pages/oge/index.html):
 * случайный отбор N заданий каждого типа из pages/oge/task-index.json.
 *
 * Числа берутся из полей рядом со списком типов (`#ogeCount{тип}`), а кнопка
 * «Собрать случайный вариант» — это те же числа, но по единице на каждый тип.
 * Раньше это были две отдельные страницы (builder.html и variants/index.html),
 * которые дублировали друг друга.
 */
(function () {
  const TOTAL_TYPES = 23;

  function countInput(type) {
    return document.getElementById(`ogeCount${type}`);
  }

  /** Проставляет одно и то же значение во все поля («Очистить» — пустую строку). */
  function setAllCounts(value) {
    for (let type = 1; type <= TOTAL_TYPES; type++) {
      const input = countInput(type);
      if (input) input.value = value;
    }
  }

  function readCounts() {
    const counts = [];
    for (let type = 1; type <= TOTAL_TYPES; type++) {
      const input = countInput(type);
      if (!input) continue;
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

  const HINTS_SHOW_LABEL = "Показать подсказки";
  const HINTS_HIDE_LABEL = "Скрыть подсказки";

  /**
   * Переключатель подсказок над собранным вариантом. По умолчанию кнопок
   * «Подсказка» не видно — вариант решается как на экзамене; по нажатию они
   * появляются у всех заданий сразу, ещё раз — исчезают вместе с уже
   * раскрытыми подсказками. Разбора («ход решения») в варианте нет вообще: за
   * ним ученик идёт по ссылке на страницу отдельного задания.
   */
  function buildHintToggle(resultEl) {
    const wrap = document.createElement("p");
    wrap.className = "oge-hints-toggle";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-secondary";
    btn.textContent = HINTS_SHOW_LABEL;
    btn.setAttribute("aria-pressed", "false");

    const note = document.createElement("span");
    note.className = "oge-hints-toggle__note";
    note.textContent =
      "Ход решения — на странице задания по ссылке в заголовке.";

    btn.addEventListener("click", () => {
      const show = btn.getAttribute("aria-pressed") === "false";
      btn.setAttribute("aria-pressed", String(show));
      btn.textContent = show ? HINTS_HIDE_LABEL : HINTS_SHOW_LABEL;
      resultEl.querySelectorAll(".oge-hint-btn").forEach((hintBtn) => {
        hintBtn.hidden = !show;
        if (show) return;
        /* Прячем и сам текст, иначе раскрытая подсказка осталась бы на виду. */
        hintBtn.setAttribute("aria-expanded", "false");
        const target = document.getElementById(hintBtn.dataset.ogeHintTarget);
        if (target) target.hidden = true;
      });
    });

    wrap.appendChild(btn);
    wrap.appendChild(note);
    return wrap;
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

    const hintToggle = buildHintToggle(resultEl);
    resultEl.appendChild(hintToggle);

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
    if (window.initOgeSubtaskCheckboxLimits)
      window.initOgeSubtaskCheckboxLimits();
    if (window.initOgeHintButtons) window.initOgeHintButtons();

    /* Заданий без подсказки не бывает, но если такой вариант всё же собрался —
       переключателю нечем управлять, и он только мешает. */
    if (!resultEl.querySelector(".oge-hint-btn")) hintToggle.remove();
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

  /** Результат длинный, поэтому после сборки подводим к нему страницу. */
  function scrollToResult(resultEl) {
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initBuilder() {
    const buildBtn = document.getElementById("buildBtn");
    const resultEl = document.getElementById("builderResult");
    if (!buildBtn || !resultEl) return false;

    const clearBtn = document.getElementById("clearCountsBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        setAllCounts("");
        resultEl.innerHTML = "";
      });
    }

    buildBtn.addEventListener("click", async () => {
      const counts = readCounts();
      if (!counts.length) {
        resultEl.innerHTML = "";
        const hint = document.createElement("p");
        hint.className = "tip";
        hint.textContent =
          "Укажите слева от нужных типов, сколько заданий взять, — хотя бы одно число больше нуля.";
        resultEl.appendChild(hint);
        return;
      }
      await build(resultEl, counts, {
        onlyHard: document.getElementById("onlyHard")?.checked,
        title: "Свой вариант из банка заданий",
      });
      scrollToResult(resultEl);
    });
    return true;
  }

  function initQuickVariant() {
    const btn = document.getElementById("quickVariantBtn");
    const resultEl = document.getElementById("builderResult");
    if (!btn || !resultEl) return false;

    const useFullRender = Boolean(window.OGE_RENDER);
    btn.addEventListener("click", async () => {
      await (useFullRender ? buildFull : build)(resultEl, fullVariantCounts(), {
        indexUrl: btn.dataset.index || "task-index.json",
        linkPrefix: btn.dataset.linkPrefix || "ex/",
        taskDir: btn.dataset.taskDir || "../../data/oge/tasks/",
        title: "Случайный вариант из банка заданий",
        emptyText: "В каталоге не нашлось заданий.",
      });
      scrollToResult(resultEl);
    });
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
