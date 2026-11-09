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
  let buildVersion = 0;

  function validIds(ids) {
    return (
      Array.isArray(ids) &&
      ids.length > 0 &&
      ids.length <= 2000 &&
      ids.every((id) => Number.isSafeInteger(id) && id > 0) &&
      new Set(ids).size === ids.length
    );
  }

  function openVariant(ids, title, number) {
    if (number && !document.getElementById("ogeVariantPage")) {
      const url = new URL("variant.html", document.baseURI);
      url.hash = new URLSearchParams({ number }).toString();
      window.location.assign(url.href);
      return;
    }
    const result = document.getElementById("builderResult");
    if (!result) return;
    const heading = document.getElementById("ogeVariantTitle");
    const pageTitle = number ? `Вариант № ${number}` : title;
    if (heading && pageTitle) {
      heading.textContent = pageTitle;
      document.title = `${pageTitle} — ОГЭ по химии`;
    }
    return buildFull(result, [], {
      ids,
      title: heading ? "" : title,
      number,
      taskDir: "../../data/oge/tasks/",
      linkPrefix: "ex/",
    }).then(() => scrollToResult(result));
  }

  function openLinkedVariant() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("number")) {
      findNumber(params.get("number"));
      return;
    }
    if (!params.has("variant")) return;
    const raw = params.get("variant");
    const ids = raw.split(",").map(Number);
    if (!/^\d+(,\d+)*$/.test(raw) || !validIds(ids)) {
      const result = document.getElementById("builderResult");
      buildVersion++;
      result.textContent =
        "Ссылка на вариант повреждена. Проверьте, что она скопирована целиком.";
      scrollToResult(result);
      return;
    }
    openVariant(
      ids,
      params.get("title")?.slice(0, 120) || "Сохранённый вариант",
    );
  }

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

  function escapeHtml(text) {
    const node = document.createElement("span");
    node.textContent = text;
    return node.innerHTML;
  }

  /**
   * Готовит «чистую» копию варианта для внешней доски: само условие и
   * разметка остаются, а проверка, подсказки и поля сайта в буфер не попадают.
   * Пустые места ответа остаются видимыми, чтобы учитель при желании мог
   * использовать их как заготовку на доске.
   */
  /**
   * Доски часто вырезают SVG из вставляемого HTML. Растеризуем схемы (в
   * частности электронные оболочки из задания 2) до копирования: PNG в
   * data-URL переносится между приложениями заметно надёжнее.
   */
  async function rasterizeSvgMarkup(markup, width, height) {
    const scale = 1;
    const url = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    );

    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function svgToPngDataUrl(svg) {
    const rect = svg.getBoundingClientRect();
    const width = Number(svg.getAttribute("width")) || rect.width || 180;
    const height = Number(svg.getAttribute("height")) || rect.height || 180;
    const source = new XMLSerializer().serializeToString(svg);
    const colorsResolved = source.replace(
      /var\((--[\w-]+)(?:,[^)]+)?\)/g,
      (whole, property) =>
        getComputedStyle(svg).getPropertyValue(property).trim() || whole,
    );
    return rasterizeSvgMarkup(colorsResolved, width, height);
  }

  function drawCellText(context, text, x, y, width, height) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width <= width || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    const lineHeight = 16;
    const start = y + (height - lines.length * lineHeight) / 2 + 12;
    lines.forEach((part, index) =>
      context.fillText(part, x + width / 2, start + index * lineHeight),
    );
  }

  /** Таблицы 19 и 23 доски тоже нередко отбрасывают при вставке HTML. */
  function tableToPngDataUrl(sourceTable) {
    const rect = sourceTable.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    if (!width || !height) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.font = "14px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    sourceTable.querySelectorAll("th, td").forEach((cell) => {
      const cellRect = cell.getBoundingClientRect();
      const x = Math.round(cellRect.left - rect.left);
      const y = Math.round(cellRect.top - rect.top);
      const cellWidth = Math.round(cellRect.width);
      const cellHeight = Math.round(cellRect.height);
      context.fillStyle = cell.tagName === "TH" ? "#e2e8f0" : "#ffffff";
      context.fillRect(x, y, cellWidth, cellHeight);
      context.strokeStyle = "#64748b";
      context.strokeRect(x, y, cellWidth, cellHeight);
      context.fillStyle = "#1e293b";
      context.font = cell.tagName === "TH" ? "bold 14px Arial" : "14px Arial";
      drawCellText(
        context,
        cell.innerText.replace(/\s+/g, " ").trim(),
        x,
        y,
        cellWidth,
        cellHeight,
      );
    });
    return canvas.toDataURL("image/png");
  }

  async function replaceSvgWithPng(original, copy) {
    const sourceSvgs = original.querySelectorAll("svg");
    const copiedSvgs = copy.querySelectorAll("svg");
    await Promise.all(
      Array.from(copiedSvgs, async (copiedSvg, index) => {
        const sourceSvg = sourceSvgs[index];
        if (!sourceSvg) return;
        const png = await svgToPngDataUrl(sourceSvg);
        if (!png) return;
        const image = document.createElement("img");
        image.src = png;
        image.alt = sourceSvg.getAttribute("aria-label") || "Схема к заданию";
        image.width = Number(sourceSvg.getAttribute("width")) || 180;
        image.height = Number(sourceSvg.getAttribute("height")) || 180;
        copiedSvg.replaceWith(image);
      }),
    );
  }

  async function replaceTablesWithPng(original, copy) {
    const sourceTables = original.querySelectorAll(
      "table.oge-mass-table, table.oge-xy-table",
    );
    const copiedTables = copy.querySelectorAll(
      "table.oge-mass-table, table.oge-xy-table",
    );
    await Promise.all(
      Array.from(copiedTables, async (copiedTable, index) => {
        const sourceTable = sourceTables[index];
        if (!sourceTable) return;
        const png = tableToPngDataUrl(sourceTable);
        if (!png) return;
        const image = document.createElement("img");
        image.src = png;
        image.alt = "Таблица для выполнения задания";
        image.width = Math.ceil(sourceTable.getBoundingClientRect().width);
        image.height = Math.ceil(sourceTable.getBoundingClientRect().height);
        copiedTable.replaceWith(image);
      }),
    );
  }

  async function variantClipboardData(resultEl) {
    const copy = resultEl.cloneNode(true);
    copy
      .querySelectorAll(
        ".oge-copy-actions, .oge-hints-toggle, .oge-hint-btn, .oge-hint, .result, button",
      )
      .forEach((el) => el.remove());

    copy.querySelectorAll("input, textarea, select").forEach((field) => {
      if (field.type === "checkbox") {
        field.remove();
        return;
      }
      const blank = document.createElement("span");
      blank.textContent = "________";
      field.replaceWith(blank);
    });

    await replaceSvgWithPng(resultEl, copy);
    await replaceTablesWithPng(resultEl, copy);

    const title = document.getElementById("ogeVariantTitle")?.textContent;
    const html = `${title ? `<h2>${escapeHtml(title)}</h2>` : ""}${copy.innerHTML}`;
    const plain = `${title ? `${title}\n\n` : ""}${copy.innerText}`.trim();
    return { html, plain };
  }

  /** Один снимок сохраняет порядок блоков там, где доска разбирает HTML. */
  async function variantImageBlob(resultEl, variantNumber) {
    if (!window.html2canvas) throw new Error("image renderer unavailable");
    const capture = document.createElement("div");
    capture.className = "oge-copy-capture";
    /* Номер берём из варианта, а не только из заголовка страницы: на главной
       странице раздела отдельного заголовка нет, но в PNG он обязателен. */
    const title = variantNumber
      ? `Вариант № ${variantNumber}`
      : document.getElementById("ogeVariantTitle")?.textContent;
    if (title) {
      const heading = document.createElement("h2");
      heading.textContent = title;
      capture.appendChild(heading);
    }
    const copy = resultEl.cloneNode(true);
    copy
      .querySelectorAll(
        ".oge-copy-actions, .oge-hints-toggle, .oge-hint-btn, .oge-hint, .result, button",
      )
      .forEach((element) => element.remove());
    capture.appendChild(copy);
    document.body.appendChild(capture);

    try {
      await document.fonts?.ready;
      const canvas = await window.html2canvas(capture, {
        backgroundColor: "#ffffff",
        logging: false,
        scale: 1,
        useCORS: true,
      });
      return await new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("image failed"))),
          "image/png",
        ),
      );
    } finally {
      capture.remove();
    }
  }

  async function copyVariant(resultEl, button, status, variantNumber) {
    const oldLabel = button.textContent;
    button.disabled = true;
    status.textContent = "Копирую…";

    try {
      const image = await variantImageBlob(resultEl, variantNumber);
      if (!navigator.clipboard?.write || !window.ClipboardItem) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": image }),
      ]);
      button.textContent = "Скопировано";
      status.textContent =
        "Вариант скопирован одной картинкой. Вставьте его на интерактивную доску.";
    } catch {
      status.textContent =
        "Не удалось создать картинку для буфера обмена. Попробуйте обновить страницу.";
    } finally {
      button.disabled = false;
      window.setTimeout(() => {
        button.textContent = oldLabel;
      }, 1800);
    }
  }

  function buildCopyActions(resultEl, variantNumber) {
    const wrap = document.createElement("div");
    wrap.className = "oge-copy-actions";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-secondary";
    button.textContent = "Скопировать вариант картинкой";
    button.setAttribute("aria-describedby", "ogeCopyVariantNote");

    const note = document.createElement("span");
    note.id = "ogeCopyVariantNote";
    note.className = "oge-copy-actions__note";
    note.textContent = "Сохраняет порядок схем, таблиц и текста";

    const status = document.createElement("span");
    status.className = "oge-copy-actions__status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    button.addEventListener("click", () =>
      copyVariant(resultEl, button, status, variantNumber),
    );
    wrap.append(button, note, status);
    return wrap;
  }

  /**
   * Кнопка копирования остаётся у верхней границы длинного варианта.
   * Высоту липкой шапки измеряем, чтобы она не перекрывала кнопку на телефоне.
   */
  function updateCopyActionsOffset() {
    const header = document.querySelector(".site-header");
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty(
      "--oge-copy-actions-top",
      `${headerHeight + 12}px`,
    );
  }

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
    if (!res.ok) throw new Error("Не удалось загрузить каталог");
    return res.json();
  }

  async function loadTask(taskDir, id) {
    const res = await fetch(`${taskDir}${id}.json`);
    if (!res.ok) throw new Error(`Не удалось загрузить задание ${id}`);
    return res.json();
  }

  /**
   * Как build(), но вместо ссылок вставляет само содержимое заданий
   * (текст, поля ответа, кнопку «Проверить») — для ручной и случайной
   * сборки варианта.
   */
  async function buildFull(resultEl, counts, options) {
    const version = ++buildVersion;
    const opts = { ...options };
    resultEl.textContent = "Собираю…";

    let index;
    let numberWarnings = [];
    try {
      if (opts.number) {
        opts.number = window.OGE_VARIANTS.parse(opts.number).code;
        index = await loadIndex(window.OGE_VARIANTS.catalogUrl(opts.number));
        const selection = window.OGE_VARIANTS.pick(opts.number, index);
        opts.ids = selection.ids;
        numberWarnings = selection.warnings;
        if (
          !document.getElementById("ogeVariantTitle") &&
          (!opts.title || opts.title.endsWith("из банка заданий"))
        ) {
          opts.title = `Вариант № ${opts.number}`;
        }
      } else {
        index = await loadIndex(opts.indexUrl || "task-index.json");
      }
    } catch {
      if (version !== buildVersion) return;
      resultEl.textContent =
        "Не удалось загрузить каталог заданий (task-index.json).";
      return;
    }

    if (version !== buildVersion) return;
    const onlyHard = opts.onlyHard;
    const pool = onlyHard ? index.filter((row) => row.advanced) : index;
    const byType = groupByType(pool);
    const warnings = numberWarnings;
    const picks = [];
    if (opts.ids) {
      const byId = new Map(index.map((row) => [row.id, row]));
      const missing = opts.ids.filter((id) => !byId.has(id));
      if (missing.length) {
        resultEl.textContent = `Не удалось открыть вариант: задания № ${missing.join(", ")} больше не доступны.`;
        return;
      }
      opts.ids.forEach((id) => {
        const row = byId.get(id);
        picks.push({ type: row.examType, row });
      });
    } else
      counts.forEach(([type, n]) => {
        const available = byType.get(type) ?? [];
        if (available.length < n) {
          warnings.push(
            `Тип ${type}: запрошено ${n}, ${onlyHard ? "сложных заданий" : "в наличии"} только ${available.length} — взяты все.`,
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
      if (version !== buildVersion) return;
      resultEl.textContent = "Не удалось загрузить содержимое заданий.";
      return;
    }

    if (version !== buildVersion) return;
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

    resultEl.appendChild(buildCopyActions(resultEl, opts.number));

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
    ++buildVersion;
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

  /** После сборки выводим на экран именно кнопку копирования, а не конец варианта. */
  function scrollToResult(resultEl) {
    const copyActions = resultEl.querySelector(".oge-copy-actions");
    (copyActions || resultEl).scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function initBuilder() {
    const buildBtn = document.getElementById("buildBtn");
    const resultEl = document.getElementById("builderResult");
    if (!buildBtn || !resultEl) return false;

    const clearBtn = document.getElementById("clearCountsBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        buildVersion++;
        setAllCounts("");
        resultEl.innerHTML = "";
      });
    }

    buildBtn.addEventListener("click", () => {
      const counts = readCounts();
      if (!counts.length) {
        buildVersion++;
        resultEl.innerHTML = "";
        const hint = document.createElement("p");
        hint.className = "tip";
        hint.textContent =
          "Укажите слева от нужных типов, сколько заданий взять, — хотя бы одно число больше нуля.";
        resultEl.appendChild(hint);
        return;
      }
      openVariant(
        null,
        "",
        window.OGE_VARIANTS.create(
          counts,
          document.getElementById("onlyHard")?.checked,
        ),
      );
    });
    return true;
  }

  function initQuickVariant() {
    const btn = document.getElementById("quickVariantBtn");
    const resultEl = document.getElementById("builderResult");
    if (!btn || !resultEl) return false;

    btn.addEventListener("click", () => {
      openVariant(
        null,
        "",
        window.OGE_VARIANTS.create(
          fullVariantCounts(),
          document.getElementById("onlyHard")?.checked,
        ),
      );
    });
    return true;
  }

  /** Кнопка для страниц готовых вариантов, собранных scripts/build-oge-variants.mjs. */
  function initReadyVariantCopy() {
    const variant = document.querySelector("[data-oge-ready-variant]");
    if (!variant) return;
    const firstTask = variant.querySelector(".oge-variant-task");
    if (!firstTask) return;
    variant.insertBefore(buildCopyActions(variant), firstTask);
  }

  function findNumber(value) {
    const status = document.getElementById("ogeNumberSearchStatus");
    const input = document.getElementById("ogeNumber");
    try {
      const { code } = window.OGE_VARIANTS.parse(value);
      if (status) status.textContent = "";
      if (input) {
        input.value = code;
        input.removeAttribute("aria-invalid");
      }
      return openVariant(null, "", code);
    } catch (error) {
      if (status) status.textContent = error.message;
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
      } else {
        const result = document.getElementById("builderResult");
        if (result) result.textContent = error.message;
      }
    }
  }

  function initNumberSearch() {
    const form = document.getElementById("ogeNumberSearch");
    if (!form) return;
    const input = document.getElementById("ogeNumber");
    const status = document.getElementById("ogeNumberSearchStatus");
    const taskIds = new Set(form.dataset.taskIds.split(","));
    input.addEventListener("input", () => {
      status.textContent = "";
      input.removeAttribute("aria-invalid");
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value.trim().replace(/^№\s*/, "");
      const taskId = /^\d+$/.test(value) ? value : "";
      if (taskIds.has(taskId)) {
        window.location.assign(
          new URL(`ex/${taskId}.html`, document.baseURI).href,
        );
        return;
      }
      if (/^\d{1,5}$/.test(value)) {
        status.textContent = "Задание с таким номером не найдено.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      findNumber(value);
    });
  }

  function init() {
    updateCopyActionsOffset();
    window.addEventListener("resize", updateCopyActionsOffset);
    initBuilder();
    initQuickVariant();
    initReadyVariantCopy();
    initNumberSearch();
    openLinkedVariant();
    window.addEventListener("hashchange", openLinkedVariant);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
