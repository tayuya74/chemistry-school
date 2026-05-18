/** Тексты для кнопки «Проверить» в интерактивных заданиях ОГЭ */
window.OGE_CHECK = {
  ok: "верно",
  retry: "попробуй еще раз",
};

/** Строка с ключом для страниц oge/ex (кнопка «Ответ»): «ответ 2 3 …» */
window.OGE_EX_formatAnswer = function (parts) {
  return "ответ " + parts.map(String).join(" ");
};

/**
 * Два верных утверждения из списка: засчитывается только галочки, только ячейки,
 * или оба способа при согласованных номерах (как в задании 1).
 * @param {string[]} chosenValues value чекбоксов, например ["2","3"]
 * @param {string} cellA cellB — содержимое двух ячеек
 * @param {string[]} correctPair два правильных номера **по возрастанию**, строками
 * @param {number} optionCount сколько пунктов в списке (1…N для проверки ввода)
 */
window.OGE_multiChoiceAllOk = function (
  chosenValues,
  cellValues,
  correctValues,
  optionCount,
) {
  const sortedCorrect = correctValues.slice().sort();
  const chosen = chosenValues.slice().sort();
  const cells = cellValues.map((x) => String(x).trim()).filter(Boolean);
  const cellsFilled = cells.length > 0;
  const reCell = new RegExp("^[1-" + String(optionCount) + "]$");
  const correctJoin = sortedCorrect.join("");
  const cellStr = cellsFilled ? cells.slice().sort().join("") : "";
  const cellsCorrect =
    cellsFilled &&
    cells.length === sortedCorrect.length &&
    cells.every(function (x) {
      return reCell.test(x);
    }) &&
    new Set(cells).size === cells.length &&
    cellStr === correctJoin;
  const boxesCorrect =
    chosen.length === sortedCorrect.length && chosen.join("") === correctJoin;
  const chosenStr = chosen.join("");
  const bothFilled = cellsFilled && chosen.length > 0;
  const multisetsMatch =
    cellsFilled && chosen.length === cells.length && chosenStr === cellStr;
  const onlyBoxes = boxesCorrect && !cellsFilled;
  const onlyCells = cellsCorrect && chosen.length === 0;
  const bothOk = bothFilled && multisetsMatch && boxesCorrect && cellsCorrect;
  return onlyBoxes || onlyCells || bothOk;
};

window.OGE_twoChoiceAllOk = function (
  chosenValues,
  cellA,
  cellB,
  correctPair,
  optionCount,
) {
  return OGE_multiChoiceAllOk(
    chosenValues,
    [cellA, cellB],
    correctPair,
    optionCount,
  );
};

/**
 * Перед проверкой числового ответа (типы 18–19): в поле «.» заменить на «,»,
 * вернуть строку для parseFloat (с «.»).
 */
window.OGE_answerDotsToCommasInField = function (inputEl) {
  if (!inputEl) return "";
  let t = String(inputEl.value).trim();
  t = t.replace(/\./g, ",");
  inputEl.value = t;
  return t.replace(",", ".");
};

/** Для inputmode=numeric — только цифры; decimal — ещё «.» и «,»; text — без фильтра. */
(function () {
  const NAV_KEYS = new Set([
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ]);

  function clampMaxLength(el, s) {
    const max = el.maxLength;
    if (max > 0 && s.length > max) return s.slice(0, max);
    return s;
  }

  function bindIntegerInput(el) {
    el.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (NAV_KEYS.has(e.key)) return;
      if (e.key.length === 1 && !/\d/.test(e.key)) {
        e.preventDefault();
      }
    });
    el.addEventListener("input", () => {
      const next = clampMaxLength(el, el.value.replace(/\D/g, ""));
      if (next !== el.value) el.value = next;
    });
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const clip = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "");
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? start;
      const merged = clampMaxLength(
        el,
        (el.value.slice(0, start) + clip + el.value.slice(end)).replace(
          /\D/g,
          "",
        ),
      );
      el.value = merged;
    });
  }

  function sanitizeDecimalValue(s) {
    let out = "";
    let sep = false;
    for (const c of s) {
      if (c === "." || c === ",") {
        if (sep) continue;
        sep = true;
        out += c;
      } else if (/\d/.test(c)) {
        out += c;
      }
    }
    return out;
  }

  function bindDecimalInput(el) {
    el.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (NAV_KEYS.has(e.key)) return;
      if (e.key.length === 1 && !/[\d.,]/.test(e.key)) {
        e.preventDefault();
      }
    });
    el.addEventListener("input", () => {
      const next = sanitizeDecimalValue(el.value);
      if (next !== el.value) el.value = next;
    });
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const clip = sanitizeDecimalValue(
        (e.clipboardData || window.clipboardData).getData("text"),
      );
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? start;
      el.value = sanitizeDecimalValue(
        el.value.slice(0, start) + clip + el.value.slice(end),
      );
    });
  }

  function attachNumericGuards() {
    const card = document.querySelector("article.card");
    if (!card) return;
    card.querySelectorAll('input[type="text"]').forEach((input) => {
      if (input.dataset.ogeNumericGuard === "1") return;
      input.dataset.ogeNumericGuard = "1";
      const mode = input.getAttribute("inputmode");
      if (mode === "decimal") bindDecimalInput(input);
      else if (mode === "numeric") bindIntegerInput(input);
      /* inputmode="text" и прочие — без ограничения (например таблица в задании 19) */
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachNumericGuards);
  } else {
    attachNumericGuards();
  }
})();

/**
 * Задания с чекбоксами и парой ячеек (OGE_twoChoiceAllOk): привязка по каждому
 * `.oge-subtask` или одному `article.card`, чтобы на странице типа несколько
 * примеров не делили один обработчик и лимит галочек.
 */
window.OGE_eachTwoChoiceScope = function (
  fallbackCorrect,
  fallbackOptionCount,
  bindClick,
) {
  const roots = [];
  document.querySelectorAll(".oge-subtask").forEach(function (el) {
    if (el.querySelector('.oge-statements input[type="checkbox"]')) {
      roots.push(el);
    }
  });
  if (!roots.length) {
    const art = document.querySelector("article.card");
    if (art && art.querySelector('.oge-statements input[type="checkbox"]')) {
      roots.push(art);
    }
  }
  roots.forEach(function (root) {
    const ds = root.dataset.ogeTwoChoiceCorrect;
    const pair = ds ? ds.split("|") : fallbackCorrect.slice();
    const sortedPair = pair.slice().sort(function (a, b) {
      return Number(a) - Number(b);
    });
    const oc =
      root.dataset.ogeOptionCount !== undefined &&
      root.dataset.ogeOptionCount !== ""
        ? parseInt(root.dataset.ogeOptionCount, 10)
        : fallbackOptionCount;
    bindClick(root, sortedPair, oc);
  });
};

window.OGE_eachMultiChoiceScope = function (
  fallbackCorrect,
  fallbackOptionCount,
  bindClick,
) {
  const roots = [];
  document.querySelectorAll(".oge-subtask").forEach(function (el) {
    if (el.querySelector('.oge-statements input[type="checkbox"]')) {
      roots.push(el);
    }
  });
  if (!roots.length) {
    const art = document.querySelector("article.card");
    if (art && art.querySelector('.oge-statements input[type="checkbox"]')) {
      roots.push(art);
    }
  }
  roots.forEach(function (root) {
    if (root.dataset.ogeMultiChoiceBound === "1") return;
    root.dataset.ogeMultiChoiceBound = "1";
    const ds = root.dataset.ogeMultiChoiceCorrect;
    const answer = ds ? ds.split("|") : fallbackCorrect.slice();
    const sortedAnswer = answer.slice().sort(function (a, b) {
      return Number(a) - Number(b);
    });
    const oc =
      root.dataset.ogeOptionCount !== undefined &&
      root.dataset.ogeOptionCount !== ""
        ? parseInt(root.dataset.ogeOptionCount, 10)
        : fallbackOptionCount;
    bindClick(root, sortedAnswer, oc);
  });
};

function bindOgeCheckboxLimitsBySubtask() {
  const roots = [];
  document.querySelectorAll(".oge-subtask").forEach(function (el) {
    if (el.querySelector('.oge-statements input[type="checkbox"]')) {
      roots.push(el);
    }
  });
  if (!roots.length) {
    const art = document.querySelector("article.card");
    if (art && art.querySelector('.oge-statements input[type="checkbox"]')) {
      roots.push(art);
    }
  }
  roots.forEach(function (root) {
    if (!root.hasAttribute("data-oge-checkbox-max")) return;
    const boxes = root.querySelectorAll(
      '.oge-statements input[type="checkbox"]',
    );
    if (!boxes.length) return;
    let max = 2;
    const attr = root.getAttribute("data-oge-checkbox-max");
    if (attr !== null && attr !== "") {
      const parsed = parseInt(attr, 10);
      if (!isNaN(parsed) && parsed > 0) max = parsed;
    }
    function sync() {
      let n = 0;
      boxes.forEach(function (cb) {
        if (cb.checked) n += 1;
      });
      const cap = n >= max;
      boxes.forEach(function (cb) {
        cb.disabled = cap && !cb.checked;
      });
    }
    boxes.forEach(function (cb) {
      cb.addEventListener("change", sync);
    });
    sync();
  });
}

function initOgeSubtaskCheckboxLimits() {
  bindOgeCheckboxLimitsBySubtask();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOgeSubtaskCheckboxLimits);
} else {
  initOgeSubtaskCheckboxLimits();
}
