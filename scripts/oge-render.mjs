/** HTML-фрагменты и скрипты заданий ОГЭ из JSON. См. data/oge/TASK-TYPES.md */

const MASS_TABLE_HTML = `
        <div
          class="oge-mass-table-wrap"
          role="region"
          aria-label="Таблица для расчёта"
        >
          <table class="oge-mass-table">
            <tbody>
              <tr>
                <td class="oge-mass-table__cell--blank"></td>
                <td class="oge-mass-table__static">W, %</td>
                <td>
                  <input
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    aria-label="Верхняя правая ячейка таблицы"
                  />
                </td>
              </tr>
              <tr>
                <td class="oge-mass-table__static">элемент</td>
                <td>
                  <input
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    aria-label="Массовая доля элемента, проценты"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    aria-label="Правая ячейка строки «элемент»"
                  />
                </td>
              </tr>
              <tr>
                <td class="oge-mass-table__static">вещество</td>
                <td class="oge-mass-table__static">100</td>
                <td>
                  <input
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    aria-label="Масса вещества"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>`;

const EXPERIMENT_TABLE_HTML = `
        <div style="overflow-x: auto; margin: 12px 0 20px">
          <table
            class="oge-xy-table"
            style="width: 100%; min-width: 480px; border-collapse: collapse"
          >
            <thead>
              <tr>
                <th rowspan="2" style="vertical-align: middle">№ опыта</th>
                <th rowspan="2" style="vertical-align: middle">
                  Реактив (формула или название)
                </th>
                <th colspan="2">Наблюдаемые признаки реакции</th>
              </tr>
              <tr>
                <th>Вещество из склянки № 1</th>
                <th>Вещество из склянки № 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>2</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: left; font-weight: 600">
                  ВЫВОД:
                </td>
              </tr>
            </tbody>
          </table>
        </div>`;

function sid(base, suffix) {
  return suffix ? `${base}${suffix}` : base;
}

function renderBlocks(blocks) {
  return (blocks ?? []).map((b) => b.html).join("\n");
}

function answerParts(task) {
  switch (task.uiKind) {
    case "twoChoice":
      return task.answer.correct;
    case "matchTriple":
      return [
        task.answer.mapping.A,
        task.answer.mapping.B,
        task.answer.mapping.V,
      ];
    case "orderedDigits":
      return task.answer.sequence;
    case "periodDiagram":
      return [task.answer.values.X, task.answer.values.Y];
    case "multiChoiceFour":
      return task.answer.correct;
    case "numericInt":
    case "numericMassTable":
      return [String(task.answer.value).replace(".", ",")];
    default:
      return [];
  }
}

function dataAttrs(task) {
  const parts = [];
  if (task.uiKind === "twoChoice") {
    parts.push(`data-oge-checkbox-max="2"`);
    parts.push(
      `data-oge-two-choice-correct="${task.answer.correct.join("|")}"`,
    );
    parts.push(
      `data-oge-option-count="${task.content.statements.length}"`,
    );
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
      (text, i) => `          <li>
            <label>
              <input type="checkbox" name="st" value="${i + 1}" />
              <span>${text}</span>
            </label>
          </li>`,
    )
    .join("\n");

  return `${renderBlocks(task.blocks)}

        <ol class="oge-statements">
${stmts}
        </ol>

        <p>Запишите номера выбранных ответов.</p>

        <p class="oge-answer-label">Ответ:</p>
        <div
          class="oge-answer-cells"
          role="group"
          aria-label="Номера двух выбранных утверждений (порядок цифр в ячейках любой)"
        >
          <input
            id="${sid("ansDigit1", suffix)}"
            type="text"
            inputmode="numeric"
            maxlength="1"
            aria-label="Первая ячейка ответа"
            autocomplete="off"
          />
          <input
            id="${sid("ansDigit2", suffix)}"
            type="text"
            inputmode="numeric"
            maxlength="1"
            aria-label="Вторая ячейка ответа"
            autocomplete="off"
          />
        </div>

        <p style="margin-top: 16px">
          <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>
        </p>
        <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
}

function matchOptionCount(right) {
  return Math.max(
    ...right.map((item) => {
      const m = item.match(/^(\d+)\)/);
      return m ? parseInt(m[1], 10) : 0;
    }),
  );
}

function renderMatchTripleBody(task, suffix) {
  const left = task.content.left
    .map((item) => `              <li>${item}</li>`)
    .join("\n");
  const right = task.content.right
    .map((item) => `              <li>${item}</li>`)
    .join("\n");
  const n = matchOptionCount(task.content.right);
  const opts = Array.from({ length: n }, (_, i) => i + 1)
    .map((v) => `                  <option value="${v}">${v}</option>`)
    .join("\n");

  return `${renderBlocks(task.blocks)}

        <div class="match-columns">
          <div>
            <strong>${task.content.leftTitle}</strong>
            <ul class="oge-match-plain">
${left}
            </ul>
          </div>
          <div>
            <strong>${task.content.rightTitle}</strong>
            <ul class="oge-match-plain">
${right}
            </ul>
          </div>
        </div>

        <p>Запишите в таблицу выбранные цифры под соответствующими буквами.</p>
        <table class="match-answer-table">
          <thead>
            <tr>
              <th>А</th>
              <th>Б</th>
              <th>В</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <select id="${sid("sA", suffix)}" aria-label="Ответ для А">
                  <option value="">—</option>
${opts}
                </select>
              </td>
              <td>
                <select id="${sid("sB", suffix)}" aria-label="Ответ для Б">
                  <option value="">—</option>
${opts}
                </select>
              </td>
              <td>
                <select id="${sid("sV", suffix)}" aria-label="Ответ для В">
                  <option value="">—</option>
${opts}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 16px">
          <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>
        </p>
        <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
}

function renderOrderedDigitsBody(task, suffix) {
  const cells = Array.from({ length: task.content.cellCount }, (_, i) => {
    const n = i + 1;
    return `          <input
            id="${sid(`d${n}`, suffix)}"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="off"
            aria-label="Позиция ${n}"
          />`;
  }).join("\n");

  return `${renderBlocks(task.blocks)}

        <p class="oge-answer-label">Ответ:</p>
        <div
          class="oge-answer-cells"
          role="group"
          aria-label="Последовательность цифр"
        >
${cells}
        </div>

        <p style="margin-top: 16px">
          <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>
        </p>
        <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
}

function renderPeriodDiagramBody(task, suffix) {
  const fig = task.content.figure;
  let figureHtml;
  if (fig.kind === "svg") {
    figureHtml = `        <div class="oge-nucleus-wrap">
          ${fig.html}
          ${
            fig.captionHtml
              ? `<p class="tip" style="margin-top: 8px">${fig.captionHtml}</p>`
              : ""
          }
        </div>`;
  } else {
    figureHtml = `        ${fig.html}`;
  }

  const hasPostPrompt = (task.blocks ?? []).some((b) =>
    /Запишите в (поле|таблицу)/.test(b.html),
  );
  const postPrompt = hasPostPrompt
    ? ""
    : `        <p>
          Запишите в таблицу значения <strong>${task.content.labels[0]}</strong> и
          <strong>${task.content.labels[1]}</strong>.
          (Для записи ответа используйте арабские цифры.)
        </p>`;

  return `${renderBlocks(task.blocks)}

${figureHtml}
${postPrompt}

        <p class="oge-answer-label">Ответ:</p>
        <table class="oge-xy-table">
          <thead>
            <tr>
              <th>${task.content.labels[0]}</th>
              <th>${task.content.labels[1]}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  id="${sid("ansX", suffix)}"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="${task.content.labels[0]}"
                />
              </td>
              <td>
                <input
                  id="${sid("ansY", suffix)}"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="${task.content.labels[1]}"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 16px">
          <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>
        </p>
        <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
}

function renderMultiChoiceFourBody(task, suffix) {
  const stmts = task.content.statements
    .map(
      (text, i) => `          <li>
            <label>
              <input type="checkbox" name="st" value="${i + 1}" />
              <span>${text}</span>
            </label>
          </li>`,
    )
    .join("\n");
  const cells = [1, 2, 3, 4]
    .map(
      (n) => `          <input
            id="${sid(`c${n}`, suffix)}"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="off"
            aria-label="${n}-я ячейка ответа"
          />`,
    )
    .join("\n");

  return `${renderBlocks(task.blocks)}

        <ol class="oge-statements">
${stmts}
        </ol>
        <p>Запишите в поле ответа номер(а) верного(-ых) суждения(-й).</p>
        <p class="oge-answer-label">Ответ:</p>
        <div
          class="oge-answer-cells"
          role="group"
          aria-label="Номера верных суждений"
        >
${cells}
        </div>
        <p style="margin-top: 16px">
          <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>
        </p>
        <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
}

function renderNumericBody(task, suffix, withTable) {
  const unit = task.content.unit ?? "%";
  const inputmode = unit === "г" ? "decimal" : "numeric";
  return `${renderBlocks(task.blocks)}
${withTable ? MASS_TABLE_HTML : ""}
        <p class="oge-answer-label">Ответ (${unit}):</p>
        <p>
          <input
            id="${sid("ansNum", suffix)}"
            type="text"
            inputmode="${inputmode}"
            class="oge-answer-input"
            autocomplete="off"
            aria-label="Числовой ответ"
          />
        </p>
        <p style="margin-top: 16px">
          <button type="button" id="${sid("checkBtn", suffix)}">Проверить</button>
        </p>
        <p id="${sid("resultOut", suffix)}" class="result" role="status"></p>`;
}

function renderOpenBody(task) {
  let html = renderBlocks(task.blocks);
  if (task.uiKind === "experimentOpen" && task.content.hasExperimentTable) {
    if (!html.includes("oge-xy-table")) {
      html += `\n${EXPERIMENT_TABLE_HTML}`;
    }
  }
  if (task.solution) {
    html += `
        <details class="tip" style="margin-top: 24px">
          <summary style="cursor: pointer; font-weight: 600">
            ${task.solution.title}
          </summary>
          ${task.solution.html}
        </details>`;
  }
  return html;
}

function renderTaskBody(task, suffix = "") {
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
      return renderOpenBody(task);
    default:
      throw new Error(`render: unknown uiKind ${task.uiKind}`);
  }
}

function exRevealScript(task) {
  const parts = answerParts(task);
  if (!parts.length) return "";
  return `    <script>
      (function () {
        const btn = document.querySelector(".oge-subtask button[type='button']");
        const out = document.querySelector(".oge-subtask .result");
        if (!btn || !out) return;
        btn.textContent = "Ответ";
        btn.addEventListener("click", function () {
          out.textContent = OGE_EX_formatAnswer(${JSON.stringify(parts)});
        });
      })();
    </script>`;
}

function typeCheckScript(task, suffix, wrapId = null) {
  const rootSel = wrapId
    ? `document.getElementById("${wrapId}")`
    : suffix
      ? `document.getElementById("oge-ex-${task.id}")`
      : `document.querySelector(".oge-subtask")`;

  switch (task.uiKind) {
    case "twoChoice":
      return `    <script>
      (function () {
        const correct = ${JSON.stringify(task.answer.correct)};
        const optionCount = ${task.content.statements.length};
        const root = ${rootSel};
        if (!root) return;
        const boxes = root.querySelectorAll('.oge-statements input[type="checkbox"]');
        const btn = root.querySelector("button[type='button']");
        const out = root.querySelector(".result");
        const inputs = root.querySelectorAll(".oge-answer-cells input[type='text']");
        if (!btn || !out || inputs.length < 2) return;
        btn.addEventListener("click", function () {
          const chosen = [];
          boxes.forEach(function (cb) {
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
      })();
    </script>`;

    case "matchTriple": {
      const { A, B, V } = task.answer.mapping;
      return `    <script>
      (function () {
        const root = ${rootSel};
        if (!root) return;
        const btn = root.querySelector("button[type='button']");
        const out = root.querySelector(".result");
        if (!btn || !out) return;
        btn.addEventListener("click", function () {
          const a = root.querySelector("#${sid("sA", suffix)}").value;
          const b = root.querySelector("#${sid("sB", suffix)}").value;
          const v = root.querySelector("#${sid("sV", suffix)}").value;
          if (!a || !b || !v) {
            out.textContent = OGE_CHECK.retry;
            return;
          }
          const ok = a === "${A}" && b === "${B}" && v === "${V}";
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
      })();
    </script>`;
    }

    case "orderedDigits": {
      const seq = task.answer.sequence;
      const checks = seq
        .map((val, i) => {
          const id = sid(`d${i + 1}`, suffix);
          const varName = String.fromCharCode(97 + i);
          return `const ${varName} = root.querySelector("#${id}").value.trim();\n          `;
        })
        .join("");
      const okExpr = seq
        .map((val, i) => `${String.fromCharCode(97 + i)} === "${val}"`)
        .join(" && ");
      return `    <script>
      (function () {
        const root = ${rootSel};
        if (!root) return;
        const btn = root.querySelector("button[type='button']");
        const out = root.querySelector(".result");
        if (!btn || !out) return;
        btn.addEventListener("click", function () {
          ${checks}
          const ok = ${okExpr};
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
      })();
    </script>`;
    }

    case "periodDiagram": {
      const { X, Y } = task.answer.values;
      return `    <script>
      (function () {
        const root = ${rootSel};
        if (!root) return;
        const btn = root.querySelector("button[type='button']");
        const out = root.querySelector(".result");
        if (!btn || !out) return;
        btn.addEventListener("click", function () {
          const x = root.querySelector("#${sid("ansX", suffix)}").value.trim();
          const y = root.querySelector("#${sid("ansY", suffix)}").value.trim();
          const ok = x === "${X}" && y === "${Y}";
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
      })();
    </script>`;
    }

    case "multiChoiceFour":
      return `    <script>
      (function () {
        const correct = ${JSON.stringify(task.answer.correct)};
        const root = ${rootSel};
        if (!root) return;
        const boxes = root.querySelectorAll('.oge-statements input[type="checkbox"]');
        const btn = root.querySelector("button[type='button']");
        const out = root.querySelector(".result");
        const inputs = root.querySelectorAll(".oge-answer-cells input[type='text']");
        if (!btn || !out || inputs.length < 4) return;
        btn.addEventListener("click", function () {
          const chosen = [];
          boxes.forEach(function (cb) {
            if (cb.checked) chosen.push(cb.value);
          });
          const ok = OGE_multiChoiceAllOk(
            chosen,
            Array.from(inputs, function (input) {
              return input.value.trim();
            }),
            correct,
            4,
          );
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
      })();
    </script>`;

    case "numericInt":
    case "numericMassTable":
      return `    <script>
      (function () {
        const root = ${rootSel};
        if (!root) return;
        const btn = root.querySelector("button[type='button']");
        const out = root.querySelector(".result");
        const input = root.querySelector("#${sid("ansNum", suffix)}");
        if (!btn || !out || !input) return;
        btn.addEventListener("click", function () {
          const raw = OGE_answerDotsToCommasInField(input);
          const n = parseFloat(raw);
          if (isNaN(n)) {
            out.textContent = OGE_CHECK.retry;
            return;
          }
          const ok = n === ${task.answer.value};
          out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
        });
      })();
    </script>`;

    default:
      return "";
  }
}

export function renderSubtask(task, { mode, suffix = "", wrapId = null } = {}) {
  const body = renderTaskBody(task, suffix);
  const attrs = dataAttrs(task);
  const idAttr = wrapId ? ` id="${wrapId}"` : "";
  const wrapped =
    task.uiKind === "openReference" || task.uiKind === "experimentOpen"
      ? body
      : `<div class="oge-subtask"${idAttr}${attrs}>\n${body}\n      </div>`;

  let script = "";
  if (mode === "ex" && task.answer) {
    script = exRevealScript(task);
  } else if (mode === "type" && task.answer) {
    script = typeCheckScript(task, suffix, wrapId);
  }

  return { html: wrapped, script, hasCheck: Boolean(task.answer) };
}

export { answerParts, dataAttrs };
