/**
 * Клиентский рендер полного содержимого задания ОГЭ из data/oge/tasks/{id}.json —
 * используется конструктором варианта (oge-task-builder.js), чтобы «Сгенерировать
 * вариант» показывал сами задания на странице, а не список ссылок.
 *
 * HTML-разметка тел заданий сознательно повторяет scripts/oge-render.mjs
 * (генератор статических страниц pages/oge/ex и pages/oge/variants) — так
 * сгенерированный на лету вариант выглядит и ведёт себя как готовые.
 *
 * Как и в собранных вариантах, разбора («ход решения») здесь нет: он остаётся
 * только на странице отдельного задания pages/oge/ex/{id}.html. Вместо него у
 * задания есть кнопка «Подсказка», а показать или спрятать такие кнопки сразу
 * во всём варианте позволяет переключатель из oge-task-builder.js.
 */
(function () {
  const MASS_TABLE_HTML = `
    <div class="oge-mass-table-wrap" role="region" aria-label="Таблица для расчёта">
      <table class="oge-mass-table">
        <tbody>
          <tr>
            <td class="oge-mass-table__cell--blank"></td>
            <td class="oge-mass-table__static">W, %</td>
            <td><input type="text" inputmode="text" autocomplete="off" aria-label="Верхняя правая ячейка таблицы" /></td>
          </tr>
          <tr>
            <td class="oge-mass-table__static">элемент</td>
            <td><input type="text" inputmode="text" autocomplete="off" aria-label="Массовая доля элемента, проценты" /></td>
            <td><input type="text" inputmode="text" autocomplete="off" aria-label="Правая ячейка строки «элемент»" /></td>
          </tr>
          <tr>
            <td class="oge-mass-table__static">вещество</td>
            <td class="oge-mass-table__static">100</td>
            <td><input type="text" inputmode="text" autocomplete="off" aria-label="Масса вещества" /></td>
          </tr>
        </tbody>
      </table>
    </div>`;

  const EXPERIMENT_TABLE_HTML = `
    <div style="overflow-x: auto; margin: 12px 0 20px">
      <table class="oge-xy-table" style="width: 100%; min-width: 480px; border-collapse: collapse">
        <thead>
          <tr>
            <th rowspan="2" style="vertical-align: middle">№ опыта</th>
            <th rowspan="2" style="vertical-align: middle">Реактив (формула или название)</th>
            <th colspan="2">Наблюдаемые признаки реакции</th>
          </tr>
          <tr>
            <th>Вещество из склянки № 1</th>
            <th>Вещество из склянки № 2</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1</td><td></td><td></td><td></td></tr>
          <tr><td>2</td><td></td><td></td><td></td></tr>
          <tr><td colspan="4" style="text-align: left; font-weight: 600">ВЫВОД:</td></tr>
        </tbody>
      </table>
    </div>`;

  function sid(base, suffix) {
    return suffix ? `${base}${suffix}` : base;
  }

  /**
   * Кнопка «Подсказка». По умолчанию скрыта: над собранным вариантом есть
   * общий переключатель (js/oge-task-builder.js), который показывает такие
   * кнопки сразу у всех заданий или прячет их обратно.
   */
  function renderHintButton(task, suffix, extraStyle) {
    if (!task.hint) return "";
    const hintId = sid("hintOut", suffix);
    return `<button type="button" class="btn-secondary oge-hint-btn"${extraStyle || ""} hidden aria-expanded="false" aria-controls="${hintId}" data-oge-hint-target="${hintId}">Подсказка</button>`;
  }

  function renderHintText(task, suffix) {
    if (!task.hint) return "";
    return `\n<p id="${sid("hintOut", suffix)}" class="tip oge-hint" hidden>${task.hint}</p>`;
  }

  /**
   * Футер задания: «Проверить», «Подсказка» и строка результата — как
   * renderCheckAndHintFooter() в scripts/oge-render.mjs. Разбора («ход
   * решения») здесь нет и быть не должно: в собранном варианте ученик решает
   * задания подряд, а разбор ждёт его на странице отдельного задания.
   */
  function renderCheckAndHintFooter(task, suffix) {
    return `<p style="margin-top: 16px">
        <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>${renderHintButton(task, suffix, ' style="margin-left: 8px"')}
      </p>${renderHintText(task, suffix)}
      <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
  }

  function renderBlocks(blocks) {
    return (blocks ?? []).map((b) => b.html).join("\n");
  }

  function matchOptionCount(right) {
    return Math.max(
      ...right.map((item) => {
        const m = item.match(/^(\d+)\)/);
        return m ? parseInt(m[1], 10) : 0;
      }),
    );
  }

  function dataAttrs(task) {
    const parts = [];
    if (task.uiKind === "twoChoice") {
      parts.push(`data-oge-checkbox-max="2"`);
      parts.push(
        `data-oge-two-choice-correct="${task.answer.correct.join("|")}"`,
      );
      parts.push(`data-oge-option-count="${task.content.statements.length}"`);
    }
    if (task.uiKind === "multiChoiceFour") {
      parts.push(
        `data-oge-multi-choice-correct="${task.answer.correct.join("|")}"`,
      );
      parts.push(`data-oge-option-count="4"`);
    }
    return parts.length ? ` ${parts.join(" ")}` : "";
  }

  function renderTwoChoiceBody(task, suffix) {
    const stmts = task.content.statements
      .map(
        (text, i) =>
          `<li><label><input type="checkbox" name="st" value="${i + 1}" /><span>${text}</span></label></li>`,
      )
      .join("\n");
    return `${renderBlocks(task.blocks)}
      <ol class="oge-statements">${stmts}</ol>
      <p>Запишите номера выбранных ответов.</p>
      <p class="oge-answer-label">Ответ:</p>
      <div class="oge-answer-cells" role="group" aria-label="Номера двух выбранных утверждений (порядок цифр в ячейках любой)">
        <input id="${sid("ansDigit1", suffix)}" type="text" inputmode="numeric" maxlength="1" aria-label="Первая ячейка ответа" autocomplete="off" />
        <input id="${sid("ansDigit2", suffix)}" type="text" inputmode="numeric" maxlength="1" aria-label="Вторая ячейка ответа" autocomplete="off" />
      </div>
      ${renderCheckAndHintFooter(task, suffix)}`;
  }

  function renderMatchTripleBody(task, suffix) {
    const left = task.content.left.map((item) => `<li>${item}</li>`).join("\n");
    const right = task.content.right
      .map((item) => `<li>${item}</li>`)
      .join("\n");
    const n = matchOptionCount(task.content.right);
    const opts = Array.from({ length: n }, (_, i) => i + 1)
      .map((v) => `<option value="${v}">${v}</option>`)
      .join("\n");
    return `${renderBlocks(task.blocks)}
      <div class="match-columns">
        <div><strong>${task.content.leftTitle}</strong><ul class="oge-match-plain">${left}</ul></div>
        <div><strong>${task.content.rightTitle}</strong><ul class="oge-match-plain">${right}</ul></div>
      </div>
      <p>Запишите в таблицу выбранные цифры под соответствующими буквами.</p>
      <table class="match-answer-table">
        <thead><tr><th>А</th><th>Б</th><th>В</th></tr></thead>
        <tbody>
          <tr>
            <td><select id="${sid("sA", suffix)}" aria-label="Ответ для А"><option value="">—</option>${opts}</select></td>
            <td><select id="${sid("sB", suffix)}" aria-label="Ответ для Б"><option value="">—</option>${opts}</select></td>
            <td><select id="${sid("sV", suffix)}" aria-label="Ответ для В"><option value="">—</option>${opts}</select></td>
          </tr>
        </tbody>
      </table>
      ${renderCheckAndHintFooter(task, suffix)}`;
  }

  function renderOrderedDigitsBody(task, suffix) {
    const cells = Array.from({ length: task.content.cellCount }, (_, i) => {
      const n = i + 1;
      return `<input id="${sid(`d${n}`, suffix)}" type="text" inputmode="numeric" maxlength="1" autocomplete="off" aria-label="Позиция ${n}" />`;
    }).join("\n");
    return `${renderBlocks(task.blocks)}
      <p class="oge-answer-label">Ответ:</p>
      <div class="oge-answer-cells" role="group" aria-label="Последовательность цифр">${cells}</div>
      ${renderCheckAndHintFooter(task, suffix)}`;
  }

  function renderPeriodDiagramBody(task, suffix) {
    const fig = task.content.figure;
    let figureHtml;
    if (fig.kind === "svg") {
      figureHtml = `<div class="oge-nucleus-wrap">
        ${fig.html}
        ${fig.captionHtml ? `<p class="tip" style="margin-top: 8px">${fig.captionHtml}</p>` : ""}
      </div>`;
    } else {
      figureHtml = fig.html;
    }
    const hasPostPrompt = (task.blocks ?? []).some((b) =>
      /Запишите в (поле|таблицу)/.test(b.html),
    );
    const postPrompt = task.content.postPrompt
      ? `<p>${task.content.postPrompt}</p>`
      : hasPostPrompt
        ? ""
        : `<p>Запишите в таблицу значения <strong>${task.content.labels[0]}</strong> и <strong>${task.content.labels[1]}</strong>. (Для записи ответа используйте арабские цифры.)</p>`;
    return `${renderBlocks(task.blocks)}
      ${figureHtml}
      ${postPrompt}
      <p class="oge-answer-label">Ответ:</p>
      <table class="oge-xy-table">
        <thead><tr><th>${task.content.labels[0]}</th><th>${task.content.labels[1]}</th></tr></thead>
        <tbody>
          <tr>
            <td><input id="${sid("ansX", suffix)}" type="text" inputmode="numeric" autocomplete="off" aria-label="${task.content.labels[0]}" /></td>
            <td><input id="${sid("ansY", suffix)}" type="text" inputmode="numeric" autocomplete="off" aria-label="${task.content.labels[1]}" /></td>
          </tr>
        </tbody>
      </table>
      ${renderCheckAndHintFooter(task, suffix)}`;
  }

  function renderMultiChoiceFourBody(task, suffix) {
    const stmts = task.content.statements
      .map(
        (text, i) =>
          `<li><label><input type="checkbox" name="st" value="${i + 1}" /><span>${text}</span></label></li>`,
      )
      .join("\n");
    const cells = [1, 2, 3, 4]
      .map(
        (n) =>
          `<input id="${sid(`c${n}`, suffix)}" type="text" inputmode="numeric" maxlength="1" autocomplete="off" aria-label="${n}-я ячейка ответа" />`,
      )
      .join("\n");
    return `${renderBlocks(task.blocks)}
      <ol class="oge-statements">${stmts}</ol>
      <p>Запишите в поле ответа номер(а) верного(-ых) суждения(-й).</p>
      <p class="oge-answer-label">Ответ:</p>
      <div class="oge-answer-cells" role="group" aria-label="Номера верных суждений">${cells}</div>
      ${renderCheckAndHintFooter(task, suffix)}`;
  }

  function renderNumericBody(task, suffix, withTable) {
    const unit = task.content.unit ?? "%";
    return `${renderBlocks(task.blocks)}
      ${withTable ? MASS_TABLE_HTML : ""}
      <p class="oge-answer-label">Ответ (${unit}):</p>
      <p><input id="${sid("ansNum", suffix)}" type="text" inputmode="decimal" class="oge-answer-input" autocomplete="off" aria-label="Числовой ответ" /></p>
      ${renderCheckAndHintFooter(task, suffix)}`;
  }

  function renderOpenBody(task, suffix) {
    let html = renderBlocks(task.blocks);
    if (task.uiKind === "experimentOpen" && task.content.hasExperimentTable) {
      if (!html.includes("oge-xy-table")) html += `\n${EXPERIMENT_TABLE_HTML}`;
    }
    /* У заданий 20–23 проверять нечего, поэтому от футера остаётся подсказка. */
    if (task.hint) {
      html += `\n<p style="margin-top: 16px">${renderHintButton(task, suffix)}</p>${renderHintText(task, suffix)}`;
    }
    return html;
  }

  function renderTaskBody(task, suffix) {
    switch (task.uiKind) {
      case "twoChoice":
        return renderTwoChoiceBody(task, suffix);
      case "matchTriple":
        return renderMatchTripleBody(task, suffix);
      case "orderedDigits":
        return renderOrderedDigitsBody(task, suffix);
      case "periodDiagram":
        return renderPeriodDiagramBody(task, suffix);
      case "multiChoiceFour":
        return renderMultiChoiceFourBody(task, suffix);
      case "numericInt":
        return renderNumericBody(task, suffix, false);
      case "numericMassTable":
        return renderNumericBody(task, suffix, true);
      case "openReference":
      case "experimentOpen":
        return renderOpenBody(task, suffix);
      default:
        return `<p class="tip">Неизвестный тип задания (${task.uiKind}).</p>`;
    }
  }

  /** HTML одного задания. suffix и wrapId нужны, чтобы id полей не пересекались между заданиями на одной странице. */
  function buildSubtaskHtml(task, suffix, wrapId) {
    const body = renderTaskBody(task, suffix);
    if (task.uiKind === "openReference" || task.uiKind === "experimentOpen") {
      return body;
    }
    const attrs = dataAttrs(task);
    const idAttr = wrapId ? ` id="${wrapId}"` : "";
    return `<div class="oge-subtask"${idAttr}${attrs}>\n${body}\n</div>`;
  }

  /** Привязывает «Проверить» к реальной проверке ответа — эквивалент typeCheckScript из scripts/oge-render.mjs. */
  function attachCheckHandlers(root, task, suffix) {
    if (!task.answer) return;
    const btn = root.querySelector("button[type='button']");
    const out = root.querySelector(".result");
    if (!btn || !out) return;

    switch (task.uiKind) {
      case "twoChoice": {
        const correct = task.answer.correct;
        const optionCount = task.content.statements.length;
        const boxes = root.querySelectorAll(
          '.oge-statements input[type="checkbox"]',
        );
        const inputs = root.querySelectorAll(
          ".oge-answer-cells input[type='text']",
        );
        if (inputs.length < 2) return;
        btn.addEventListener("click", function () {
          const chosen = [];
          boxes.forEach((cb) => {
            if (cb.checked) chosen.push(cb.value);
          });
          const ok = OGE_twoChoiceAllOk(
            chosen,
            inputs[0].value.trim(),
            inputs[1].value.trim(),
            correct,
            optionCount,
          );
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
        break;
      }

      case "matchTriple": {
        const { A, B, V } = task.answer.mapping;
        btn.addEventListener("click", function () {
          const a = root.querySelector(`#${sid("sA", suffix)}`).value;
          const b = root.querySelector(`#${sid("sB", suffix)}`).value;
          const v = root.querySelector(`#${sid("sV", suffix)}`).value;
          if (!a || !b || !v) {
            out.textContent = OGE_CHECK.retry;
            return;
          }
          const ok = a === A && b === B && v === V;
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
        break;
      }

      case "orderedDigits": {
        const seq = task.answer.sequence;
        btn.addEventListener("click", function () {
          const ok = seq.every((val, i) => {
            const input = root.querySelector(`#${sid(`d${i + 1}`, suffix)}`);
            return input && input.value.trim() === val;
          });
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
        break;
      }

      case "periodDiagram": {
        const { X, Y } = task.answer.values;
        btn.addEventListener("click", function () {
          const x = root.querySelector(`#${sid("ansX", suffix)}`).value.trim();
          const y = root.querySelector(`#${sid("ansY", suffix)}`).value.trim();
          const ok = x === X && y === Y;
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
        break;
      }

      case "multiChoiceFour": {
        const correct = task.answer.correct;
        const boxes = root.querySelectorAll(
          '.oge-statements input[type="checkbox"]',
        );
        const inputs = root.querySelectorAll(
          ".oge-answer-cells input[type='text']",
        );
        if (inputs.length < 4) return;
        btn.addEventListener("click", function () {
          const chosen = [];
          boxes.forEach((cb) => {
            if (cb.checked) chosen.push(cb.value);
          });
          const ok = OGE_multiChoiceAllOk(
            chosen,
            Array.from(inputs, (input) => input.value.trim()),
            correct,
            4,
          );
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
        break;
      }

      case "numericInt":
      case "numericMassTable": {
        const input = root.querySelector(`#${sid("ansNum", suffix)}`);
        if (!input) return;
        btn.addEventListener("click", function () {
          const raw = OGE_answerDotsToCommasInField(input);
          const n = parseFloat(raw);
          if (isNaN(n)) {
            out.textContent = OGE_CHECK.retry;
            return;
          }
          out.textContent =
            n === task.answer.value ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
        break;
      }
    }
  }

  window.OGE_RENDER = { buildSubtaskHtml, attachCheckHandlers };
})();
