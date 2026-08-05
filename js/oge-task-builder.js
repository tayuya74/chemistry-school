/** Конструктор своего варианта: случайный отбор N заданий каждого типа из pages/oge/task-index.json */
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

  function readCounts() {
    const counts = [];
    for (let type = 1; type <= TOTAL_TYPES; type++) {
      const input = document.getElementById(`builderCount${type}`);
      const n = parseInt(input.value, 10);
      if (n > 0) counts.push([type, n]);
    }
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

  function renderResult(container, groups, warnings) {
    container.innerHTML = "";

    if (warnings.length) {
      const warn = document.createElement("p");
      warn.className = "tip";
      warn.textContent = warnings.join(" ");
      container.appendChild(warn);
    }

    if (!groups.length) {
      const empty = document.createElement("p");
      empty.textContent = "Укажите хотя бы одно число больше нуля.";
      container.appendChild(empty);
      return;
    }

    groups.forEach(({ type, picked }) => {
      const heading = document.createElement("h3");
      heading.className = "oge-example-title";
      heading.textContent = `Задание ${type} (${picked.length})`;
      container.appendChild(heading);

      const list = document.createElement("ul");
      list.className = "topic-list";
      picked.forEach((row) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `ex/${row.id}.html`;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = `№ ${row.id} — ${row.lead}`;
        item.appendChild(link);
        list.appendChild(item);
      });
      container.appendChild(list);
    });
  }

  async function handleBuild(resultEl) {
    resultEl.textContent = "Собираю…";

    let index;
    try {
      const res = await fetch("task-index.json");
      index = await res.json();
    } catch {
      resultEl.textContent =
        "Не удалось загрузить каталог заданий (task-index.json).";
      return;
    }

    const byType = groupByType(index);
    const warnings = [];
    const groups = [];

    readCounts().forEach(([type, n]) => {
      const available = byType.get(type) ?? [];
      if (available.length < n) {
        warnings.push(
          `Тип ${type}: запрошено ${n}, в наличии только ${available.length} — взяты все.`,
        );
      }
      const picked = pickRandom(available, n);
      if (picked.length) groups.push({ type, picked });
    });

    renderResult(resultEl, groups, warnings);
  }

  function init() {
    const tbody = document.querySelector("#builderTable tbody");
    const buildBtn = document.getElementById("buildBtn");
    const resultEl = document.getElementById("builderResult");
    if (!tbody || !buildBtn || !resultEl) return;

    renderTypeRows(tbody);
    buildBtn.addEventListener("click", () => handleBuild(resultEl));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
