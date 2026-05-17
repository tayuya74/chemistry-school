import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "data", "oge-source", "variant-1");
fs.mkdirSync(outDir, { recursive: true });

function pad2(n) {
  return String(n).padStart(2, "0");
}

function shell(type, pageTitle, lead, body, script = "") {
  const prev = type > 1 ? `oge-${pad2(type - 1)}.html` : null;
  const next = type < 23 ? `oge-${pad2(type + 1)}.html` : null;
  const navPrev = prev
    ? `          <a href="${prev}">← К предыдущему типу (задание ${type - 1})</a>`
    : "";
  const navNext = next
    ? `          <a class="oge-task-nav__next" href="${next}">К следующему типу (задание ${type + 1}) →</a>`
    : `          <a class="oge-task-nav__next" href="oge.html">К списку заданий →</a>`;

  const scriptBlock = script
    ? `
    <script>
${script}
    </script>`
    : "";

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ОГЭ, задание ${type} — ${pageTitle}</title>
    <link rel="stylesheet" href="css/style.css" />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
    />
    <script src="js/theme.js"></script>
    <script src="js/oge-check-feedback.js"></script>
  </head>
  <body>
    <header class="site-header">
      <div class="site-header__inner">
        <h1>ОГЭ</h1>
        <div class="site-header__tail">
          <nav>
            <a href="index.html">Главная</a>
            <a href="topics.html">Темы</a>
            <a href="tables.html">Таблицы</a>
            <a href="oge.html">ОГЭ</a>
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
        <p><a href="oge.html">← К списку заданий ОГЭ</a></p>
        <nav class="oge-task-nav" aria-label="Соседние задания ОГЭ">
${navPrev}
${navNext}
        </nav>
        <h2>Задание ${type}</h2>
        <p class="lead">${lead}</p>

${body}
      </article>
    </main>
${scriptBlock}
  </body>
</html>
`;
}

function checkBlock(btnId = "checkBtn", resultId = "resultOut") {
  return `        <p style="margin-top: 16px">
          <button type="button" id="${btnId}">Проверить</button>
        </p>
        <p id="${resultId}" class="result" role="status"></p>`;
}

function twoAnswerCells(ids = ["c1", "c2"], aria = "Две цифры") {
  return `        <p class="oge-answer-label">Ответ:</p>
        <div class="oge-answer-cells" role="group" aria-label="${aria}">
          <input
            id="${ids[0]}"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="off"
            aria-label="Первая ячейка ответа"
          />
          <input
            id="${ids[1]}"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="off"
            aria-label="Вторая ячейка ответа"
          />
        </div>`;
}

function checkboxStatements(items) {
  return items
    .map(
      ([num, html]) => `          <li>
            <label>
              <input type="checkbox" name="st" value="${num}" />
              <span>${html}</span>
            </label>
          </li>`,
    )
    .join("\n");
}

function twoChoiceScript(correct, optionCount = 5) {
  const pair = JSON.stringify(correct);
  return `      (function () {
        const correct = ${pair};
        OGE_eachTwoChoiceScope(correct, ${optionCount}, function (root, pair, optionCount) {
          const boxes = root.querySelectorAll(
            '.oge-statements input[type="checkbox"]',
          );
          const btn = root.querySelector("button[type='button']");
          const out = root.querySelector(".result");
          const inputs = root.querySelectorAll(
            ".oge-answer-cells input[type='text']",
          );
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
              pair,
              optionCount,
            );
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
        });
      })();`;
}

function matchSelects(optionCount) {
  const opts = Array.from({ length: optionCount }, (_, i) => i + 1)
    .map(
      (n) => `                  <option value="${n}">${n}</option>`,
    )
    .join("\n");
  return `              <td>
                <select id="sA" aria-label="Ответ для А">
                  <option value="">—</option>
${opts}
                </select>
              </td>
              <td>
                <select id="sB" aria-label="Ответ для Б">
                  <option value="">—</option>
${opts}
                </select>
              </td>
              <td>
                <select id="sV" aria-label="Ответ для В">
                  <option value="">—</option>
${opts}
                </select>
              </td>`;
}

function matchScript(a, b, v) {
  return `      (function () {
        document
          .getElementById("checkBtn")
          .addEventListener("click", function () {
            const x = document.getElementById("sA").value;
            const y = document.getElementById("sB").value;
            const z = document.getElementById("sV").value;
            const out = document.getElementById("resultOut");
            if (!x || !y || !z) {
              out.textContent = OGE_CHECK.retry;
              return;
            }
            const ok = x === "${a}" && y === "${b}" && z === "${v}";
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`;
}

function matchBody(prompt, leftTitle, leftItems, rightTitle, rightItems, optionCount) {
  const left = leftItems
    .map((html, i) => `              <li>${String.fromCharCode(1040 + i)}) ${html}</li>`)
    .join("\n");
  const right = rightItems
    .map((html, i) => `              <li>${i + 1}) ${html}</li>`)
    .join("\n");
  return `        <p>
          ${prompt}
        </p>

        <div class="match-columns">
          <div>
            <strong>${leftTitle}</strong>
            <ul class="oge-match-plain">
${left}
            </ul>
          </div>
          <div>
            <strong>${rightTitle}</strong>
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
${matchSelects(optionCount)}
            </tr>
          </tbody>
        </table>

${checkBlock()}`;
}

function atomSvg2Shell8() {
  return `        <p>
          На рисунке изображена модель строения атома некоторого химического
          элемента.
        </p>

        <div class="oge-nucleus-wrap">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 260"
            width="300"
            height="244"
            aria-label="Схема атома: ядро +Z, два электрона на внутреннем слое и восемь на внешнем"
          >
            <circle
              cx="160"
              cy="130"
              r="118"
              fill="var(--color-tip-bg)"
              stroke="var(--color-border)"
              stroke-width="2"
            />
            <circle
              cx="160"
              cy="130"
              r="72"
              fill="none"
              stroke="var(--color-border)"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />
            <circle
              cx="160"
              cy="130"
              r="34"
              fill="none"
              stroke="var(--color-border)"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />
            <circle
              cx="160"
              cy="130"
              r="16"
              fill="#fecaca"
              stroke="#dc2626"
              stroke-width="2"
            />
            <text
              x="160"
              y="136"
              text-anchor="middle"
              font-size="13"
              font-weight="700"
              fill="#991b1b"
            >
              +Z
            </text>
            <g fill="#2563eb" aria-hidden="true">
              <circle cx="160" cy="104" r="5" />
              <circle cx="149" cy="112" r="5" />
              <circle cx="134" cy="130" r="5" />
              <circle cx="149" cy="148" r="5" />
              <circle cx="160" cy="156" r="5" />
              <circle cx="171" cy="148" r="5" />
              <circle cx="186" cy="130" r="5" />
              <circle cx="171" cy="112" r="5" />
              <circle cx="118" cy="130" r="5" />
              <circle cx="202" cy="130" r="5" />
            </g>
          </svg>
        </div>

        <p>
          Запишите в поле ответа номер периода (<strong>X</strong>), в котором
          данный химический элемент расположен в Периодической системе Д. И.
          Менделеева, и число протонов (<strong>Y</strong>) в ядре его атома.
          (Для записи ответа используйте арабские цифры.)
        </p>

        <p class="oge-answer-label">Ответ:</p>
        <table class="oge-xy-table">
          <thead>
            <tr>
              <th>X</th>
              <th>Y</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  id="ansX"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="Номер периода X"
                />
              </td>
              <td>
                <input
                  id="ansY"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="Число протонов Y"
                />
              </td>
            </tr>
          </tbody>
        </table>

${checkBlock("checkTask2", "resultTask2")}`;
}

const LEADS = {
  1: "Химические элементы и вещества",
  2: "Строение атома, строение электронных оболочек",
  3: "Периодический закон и Периодическая система элементов",
  4: "Валентность и степень окисления химических элементов",
  5: "Типы химической связи",
  6: "Закономерности изменения свойств элементов",
  7: "Классификация сложных веществ",
  8: "Химические свойства простых и сложных веществ",
  9: "Химические свойства простых и сложных веществ",
  10: "Химические свойства простых и сложных веществ",
  11: "Классификация химических реакций",
  12: "Признаки протекания химических реакций",
  13: "Электролитическая диссоциация",
  14: "Реакции ионного обмена",
  15: "Окислительно-восстановительные реакции",
  16: "Безопасность в лаборатории. Разделение смесей. Химическое загрязнение",
  17: "Качественные реакции неорганических соединений. Индикаторы",
  18: "Вычисление массовой доли химического элемента в веществе",
  19: "Вычисления массы элемента по его массовой доле в веществе",
  20: "Окислительно-восстановительные реакции",
  21: "Химические свойства простых и сложных веществ",
  22: "Расчётная задача. Массовая доля, количество вещества, объём и масса",
  23: "Экспериментальная задача",
};

const pages = [
  {
    type: 1,
    title: "Химические элементы и вещества",
    body: `        <p>
          Выберите два утверждения, в которых говорится о кальции как о
          <strong>химическом элементе</strong>.
        </p>

        <ol class="oge-statements">
${checkboxStatements([
  ["1", "Кальций относится к щёлочноземельным металлам."],
  ["2", "В природе встречаются шесть стабильных изотопов кальция."],
  [
    "3",
    "Кальций используют для десульфуризации нефтепродуктов.",
  ],
  [
    "4",
    "В промышленности кальций получают электролитическими методами.",
  ],
  [
    "5",
    "В соединениях кальций проявляет степень окисления +2.",
  ],
])}
        </ol>

        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["1", "2"], 5),
  },
  {
    type: 2,
    title: "Строение атома, строение электронных оболочек",
    body: atomSvg2Shell8(),
    script: `      (function () {
        document
          .getElementById("checkTask2")
          .addEventListener("click", function () {
            const x = String(document.getElementById("ansX").value).trim();
            const y = String(document.getElementById("ansY").value).trim();
            const out = document.getElementById("resultTask2");
            const ok = x === "2" && y === "10";
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`,
  },
  {
    type: 3,
    title: "Периодический закон и Периодическая система",
    body: `        <p>Расположите химические элементы</p>
        <ol>
          <li>бор</li>
          <li>кислород</li>
          <li>азот</li>
        </ol>
        <p>
          в порядке
          <strong>уменьшения их электроотрицательности</strong>.
          Запишите указанные номера элементов в соответствующем порядке.
        </p>

        <p class="oge-answer-label">Ответ:</p>
        <div
          style="display: inline-flex; align-items: center; gap: 8px; margin-top: 8px"
          role="group"
          aria-label="Порядок номеров 1—3"
        >
          <div class="oge-answer-cells">
            <input
              id="d1"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="off"
              aria-label="Первая позиция"
            />
          </div>
          <span aria-hidden="true">→</span>
          <div class="oge-answer-cells">
            <input
              id="d2"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="off"
              aria-label="Вторая позиция"
            />
          </div>
          <span aria-hidden="true">→</span>
          <div class="oge-answer-cells">
            <input
              id="d3"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="off"
              aria-label="Третья позиция"
            />
          </div>
        </div>

${checkBlock()}`,
    script: `      (function () {
        document
          .getElementById("checkBtn")
          .addEventListener("click", function () {
            const a = document.getElementById("d1").value.trim();
            const b = document.getElementById("d2").value.trim();
            const c = document.getElementById("d3").value.trim();
            const out = document.getElementById("resultOut");
            const ok = a === "2" && b === "3" && c === "1";
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`,
  },
  {
    type: 4,
    body: matchBody(
      "Установите соответствие между формулой вещества и степенью окисления азота в данном веществе: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
      "Формула вещества",
      [
        "(NH<sub>4</sub>)<sub>2</sub>CO<sub>3</sub>",
        "Ca(NO<sub>3</sub>)<sub>2</sub>",
        "NO<sub>2</sub>",
      ],
      "Степень окисления азота",
      ["−3", "+3", "+4", "+5"],
      4,
    ),
    script: matchScript("1", "4", "3"),
  },
  {
    type: 5,
    body: `        <p>
          Из предложенного перечня выберите
          <strong>два вещества с ионной связью</strong>.
        </p>
        <ol class="oge-statements">
${checkboxStatements([
  ["1", "BaO"],
  ["2", "Cr"],
  ["3", "H<sub>2</sub>O"],
  ["4", "MgCl<sub>2</sub>"],
  ["5", "NH<sub>3</sub>"],
])}
        </ol>
        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["1", "4"], 5),
  },
  {
    type: 6,
    body: `        <p>
          Выберите два верных продолжения для следующего утверждения.
          Сходство натрия, магния и алюминия проявляется в том, что…
        </p>
        <ol class="oge-statements">
${checkboxStatements([
  [
    "1",
    "в соединениях они проявляют постоянную степень окисления",
  ],
  ["2", "их атомы имеют одинаковые радиусы"],
  [
    "3",
    "в ядрах их атомов одинаковое число нейтронов",
  ],
  [
    "4",
    "значение электроотрицательности их атомов меньше, чем у фосфора",
  ],
  [
    "5",
    "образуемые ими высшие оксиды относятся к основным оксидам",
  ],
])}
        </ol>
        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["1", "4"], 5),
  },
  {
    type: 7,
    body: `        <p>
          Из предложенного перечня веществ выберите
          <strong>кислоту и основной оксид</strong>.
        </p>
        <ol>
          <li>HNO<sub>2</sub></li>
          <li>Mg(OH)<sub>2</sub></li>
          <li>ZnO</li>
          <li>KHSO<sub>4</sub></li>
          <li>CaO</li>
        </ol>
        <p>
          Запишите в поле ответа сначала номер кислоты, а затем номер основного
          оксида.
        </p>
${twoAnswerCells(["c1", "c2"], "Сначала кислота, затем основной оксид")}
${checkBlock()}`,
    script: `      (function () {
        document
          .getElementById("checkBtn")
          .addEventListener("click", function () {
            const a = document.getElementById("c1").value.trim();
            const b = document.getElementById("c2").value.trim();
            const out = document.getElementById("resultOut");
            const ok = a === "1" && b === "5";
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`,
  },
  {
    type: 8,
    body: `        <p>
          Какие два из перечисленных веществ
          <strong>не вступают</strong> в реакцию с оксидом натрия?
        </p>
        <ol class="oge-statements">
${checkboxStatements([
  ["1", "FeO"],
  ["2", "H<sub>2</sub>O"],
  ["3", "HCl"],
  ["4", "CO<sub>2</sub>"],
  ["5", "Al"],
])}
        </ol>
        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["1", "5"], 5),
  },
  {
    type: 9,
    body: matchBody(
      "Установите соответствие между реагирующими веществами и продуктом(-ями) их взаимодействия: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
      "Реагирующие вещества",
      [
        "NH<sub>3</sub> + H<sub>2</sub>SO<sub>4</sub> →",
        "NH<sub>3</sub> + SO<sub>2</sub> + H<sub>2</sub>O →",
        "NH<sub>4</sub>Cl + NaOH →",
      ],
      "Продукт(-ы) взаимодействия",
      [
        "NaCl + NH<sub>3</sub> · H<sub>2</sub>O",
        "NaCl + N<sub>2</sub> + H<sub>2</sub>O",
        "(NH<sub>4</sub>)<sub>2</sub>SO<sub>4</sub>",
        "(NH<sub>4</sub>)<sub>2</sub>SO<sub>3</sub>",
        "(NH<sub>4</sub>)<sub>2</sub>S",
      ],
      5,
    ),
    script: matchScript("3", "4", "1"),
  },
  {
    type: 10,
    body: matchBody(
      "Установите соответствие между веществом и реагентами, с каждым из которых оно может вступать в реакцию: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
      "Вещество",
      ["N<sub>2</sub>", "Cr<sub>2</sub>O<sub>3</sub>", "P<sub>2</sub>O<sub>5</sub>"],
      "Реагенты",
      [
        "NaOH, HCl",
        "H<sub>2</sub>O, CaO",
        "H<sub>2</sub>, O<sub>2</sub>",
        "K, Ca(OH)<sub>2</sub>",
      ],
      4,
    ),
    script: matchScript("3", "1", "2"),
  },
  {
    type: 11,
    body: `        <p>
          Из предложенного перечня выберите
          <strong>два вещества</strong>, с которыми оксид железа(II) вступает в
          реакцию <strong>замещения</strong>.
        </p>
        <ol class="oge-statements">
${checkboxStatements([
  ["1", "кислород"],
  ["2", "оксид углерода(II)"],
  ["3", "водород"],
  ["4", "серная кислота"],
  ["5", "углерод"],
])}
        </ol>
        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["2", "3"], 5),
  },
  {
    type: 12,
    body: matchBody(
      "Установите соответствие между реагирующими веществами и признаком протекающей между ними реакции: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
      "Реагирующие вещества",
      [
        "Zn и NaOH (р-р)",
        "Cu(OH)<sub>2</sub> и HNO<sub>3</sub> (конц.)",
        "Ag и H<sub>2</sub>SO<sub>4</sub> (конц.)",
      ],
      "Признак реакции",
      [
        "выделение бурого газа",
        "выделение бесцветного газа с резким запахом",
        "выделение бесцветного газа без запаха",
        "образование окрашенного раствора",
      ],
      4,
    ),
    script: matchScript("3", "4", "2"),
  },
  {
    type: 13,
    body: `        <p>
          Из предложенного перечня выберите <strong>два электролита</strong>.
        </p>
        <ol class="oge-statements">
${checkboxStatements([
  ["1", "хлорид бария"],
  ["2", "этанол"],
  ["3", "глюкоза"],
  ["4", "нитрат железа(III)"],
  ["5", "оксид кальция"],
])}
        </ol>
        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["1", "4"], 5),
  },
  {
    type: 14,
    body: `        <p>
          Выберите <strong>два исходных вещества</strong>, взаимодействию водных
          растворов которых соответствует сокращённое ионное уравнение реакции
        </p>
        <p style="text-align: center; font-size: 1.15rem; margin: 16px 0">
          2OH<sup>−</sup> + Cu<sup>2+</sup> = Cu(OH)<sub>2</sub>
        </p>
        <ol class="oge-statements">
${checkboxStatements([
  ["1", "Pb(OH)<sub>2</sub>"],
  ["2", "Ba(OH)<sub>2</sub>"],
  ["3", "LiOH"],
  ["4", "CuSO<sub>4</sub>"],
  ["5", "CuO"],
  ["6", "Cu"],
])}
        </ol>
        <p>Запишите номера выбранных ответов.</p>
${twoAnswerCells()}
${checkBlock()}`,
    script: twoChoiceScript(["3", "4"], 6),
  },
  {
    type: 15,
    body: matchBody(
      "Установите соответствие между схемой процесса, происходящего в окислительно-восстановительной реакции, и названием этого процесса: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
      "Схема процесса",
      [
        "Ag<sup>+1</sup> → Ag<sup>0</sup>",
        "N<sup>+2</sup> → N<sup>+4</sup>",
        "O<sub>2</sub><sup>0</sup> → 2O<sup>−2</sup>",
      ],
      "Название процесса",
      ["окисление", "восстановление"],
      2,
    ),
    script: matchScript("2", "1", "2"),
  },
  {
    type: 16,
    body: `        <p>
          Из перечисленных суждений о правилах работы с веществами в лаборатории
          и быту выберите <strong>верное(-ые) суждение(-я)</strong>.
        </p>
        <ol>
          <li>
            Для переноса порошкообразных реагентов из склянки в пробирку
            необходимо использовать химическую воронку.
          </li>
          <li>
            Средства бытовой химии можно хранить в любом свободном контейнере с
            плотно закрытой крышкой.
          </li>
          <li>
            Запрещается проводить опыты с реактивами, находящимися в склянке без
            подписи.
          </li>
          <li>
            Сероводород, аммиак, хлороводород относятся к группе ядовитых газов.
          </li>
        </ol>
        <p>
          Запишите в поле ответа номер(а) верного(-ых) суждения(-й).
        </p>
${twoAnswerCells()}
${checkBlock()}`,
    script: `      (function () {
        document
          .getElementById("checkBtn")
          .addEventListener("click", function () {
            const a = document.getElementById("c1").value.trim();
            const b = document.getElementById("c2").value.trim();
            const out = document.getElementById("resultOut");
            const cells = [a, b].filter(Boolean).sort().join("");
            const ok =
              (cells === "34" || cells === "43") &&
              a !== b &&
              a !== "" &&
              b !== "";
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`,
  },
  {
    type: 17,
    body: matchBody(
      "Установите соответствие между двумя веществами, взятыми в виде водных растворов, и реактивом, с помощью которого можно различить эти вещества: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
      "Вещества",
      [
        "H<sub>2</sub>SO<sub>4</sub> и HCl",
        "NaBr и NaOH",
        "Al<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub> и MgSO<sub>4</sub>",
      ],
      "Реактив",
      [
        "фенолфталеин",
        "Ba(OH)<sub>2</sub>",
        "CO<sub>2</sub>",
        "KOH",
      ],
      4,
    ),
    script: matchScript("2", "1", "4"),
  },
  {
    type: 18,
    body: `        <p class="tip" style="margin-bottom: 16px">
          При проведении расчётов для всех элементов, кроме хлора, используйте
          целые значения относительных атомных масс (Ar(Cl) = 35,5).
        </p>

        <p>
          Ранитидин — органическое вещество с формулой
          C<sub>13</sub>H<sub>22</sub>N<sub>4</sub>O<sub>3</sub>S, используется
          в медицине в качестве противоязвенного средства.
        </p>

        <p>
          <strong>Вычислите в процентах массовую долю азота в ранитидине.</strong>
          Запишите число с точностью до десятых.
        </p>

        <p class="oge-answer-label">Ответ (%):</p>
        <p>
          <input
            id="ansNum"
            type="text"
            inputmode="decimal"
            class="oge-answer-input"
            autocomplete="off"
            aria-label="Массовая доля в процентах"
          />
        </p>
${checkBlock()}`,
    script: `      (function () {
        document
          .getElementById("checkBtn")
          .addEventListener("click", function () {
            const raw = OGE_answerDotsToCommasInField(
              document.getElementById("ansNum"),
            );
            const n = parseFloat(raw);
            const out = document.getElementById("resultOut");
            if (isNaN(n)) {
              out.textContent = OGE_CHECK.retry;
              return;
            }
            const ok = Math.abs(n - 17.8) < 0.06;
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`,
  },
  {
    type: 19,
    body: `        <p class="tip" style="margin-bottom: 16px">
          При проведении расчётов для всех элементов, кроме хлора, используйте
          целые значения относительных атомных масс (Ar(Cl) = 35,5).
        </p>

        <p class="tip" style="margin-bottom: 16px">
          При выполнении задания 19 используйте величину, которая определена в
          задании 18 с указанной в нём степенью точности.
        </p>

        <p>
          Ранитидин — органическое вещество с формулой
          C<sub>13</sub>H<sub>22</sub>N<sub>4</sub>O<sub>3</sub>S, используется
          в медицине в качестве противоязвенного средства.
        </p>

        <p>
          При язвенной болезни желудка и двенадцатиперстной кишки рекомендуется
          принимать на ночь <strong>300 мг</strong> ранитидина.
          <strong
            >Вычислите, сколько миллиграммов (мг) азота ежедневно получает
            человек с этим препаратом.</strong
          >
          Запишите число с точностью до десятых.
        </p>

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
                    id="oge19tbl-r1c3"
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
                    id="oge19tbl-r2c2"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    aria-label="Массовая доля элемента, проценты"
                  />
                </td>
                <td>
                  <input
                    id="oge19tbl-r2c3"
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
                    id="oge19tbl-r3c3"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    aria-label="Масса вещества"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="oge-answer-label">Ответ (мг):</p>
        <p>
          <input
            id="ansNum"
            type="text"
            inputmode="decimal"
            class="oge-answer-input oge-answer-input--wide"
            autocomplete="off"
            aria-label="Масса азота в миллиграммах"
          />
        </p>
${checkBlock()}`,
    script: `      (function () {
        document
          .getElementById("checkBtn")
          .addEventListener("click", function () {
            const raw = OGE_answerDotsToCommasInField(
              document.getElementById("ansNum"),
            );
            const n = parseFloat(raw);
            const out = document.getElementById("resultOut");
            if (isNaN(n)) {
              out.textContent = OGE_CHECK.retry;
              return;
            }
            const ok = Math.abs(n - 53.4) < 0.06;
            out.textContent = ok ? OGE_CHECK.ok : OGE_CHECK.retry;
          });
      })();`,
  },
  {
    type: 20,
    body: `        <p>
          Используя метод электронного баланса, расставьте коэффициенты в
          предложенной схеме реакции
        </p>
        <p style="text-align: center; font-size: 1.1rem; margin: 16px 0">
          CuS + FeCl<sub>3</sub> → CuCl<sub>2</sub> + FeCl<sub>2</sub> + S
        </p>
        <p>Укажите окислитель и восстановитель.</p>

        <details class="tip" style="margin-top: 24px">
          <summary style="cursor: pointer; font-weight: 600">
            Эталон ответа (вариант 1, 2025)
          </summary>
          <p style="margin-top: 12px">Электронный баланс:</p>
          <p style="font-family: monospace; white-space: pre-line">
            S<sup>−2</sup> − 2ē → S<sup>0</sup> |×1
            Fe<sup>+3</sup> + 1ē → Fe<sup>+2</sup> |×2
          </p>
          <p>
            <strong>Восстановитель:</strong> сера в степени окисления −2 (или
            CuS).<br />
            <strong>Окислитель:</strong> железо в степени окисления +3 (или
            FeCl<sub>3</sub>).
          </p>
          <p>Уравнение реакции:</p>
          <p style="text-align: center">
            <strong>1</strong>CuS + <strong>2</strong>FeCl<sub>3</sub> =
            <strong>1</strong>CuCl<sub>2</sub> + <strong>2</strong>FeCl<sub>2</sub>
            + <strong>1</strong>S
          </p>
        </details>`,
    script: "",
  },
  {
    type: 21,
    body: `        <p>Дана схема превращений:</p>
        <p style="text-align: center; font-size: 1.1rem; margin: 16px 0">
          Cu(NO<sub>3</sub>)<sub>2</sub>
          <span style="margin: 0 6px">→</span>
          Cu
          <span style="margin: 0 6px">→</span>
          X
          <span style="margin: 0 6px">→</span>
          Cu(OH)<sub>2</sub>
        </p>
        <p>
          Напишите <strong>молекулярные уравнения реакций</strong>, с помощью
          которых можно осуществить указанные превращения.
        </p>

        <details class="tip" style="margin-top: 24px">
          <summary style="cursor: pointer; font-weight: 600">
            Эталон ответа (вариант 1, 2025)
          </summary>
          <ol style="margin-top: 12px; line-height: 1.7">
            <li>
              Cu(NO<sub>3</sub>)<sub>2</sub> + Fe = Fe(NO<sub>3</sub>)<sub>2</sub>
              + Cu
            </li>
            <li>
              Cu + 2AgNO<sub>3</sub> = 2Ag + Cu(NO<sub>3</sub>)<sub>2</sub>
              &nbsp;(X — AgNO<sub>3</sub>)
            </li>
            <li>
              Cu(NO<sub>3</sub>)<sub>2</sub> + 2NaOH = Cu(OH)<sub>2</sub>↓ +
              2NaNO<sub>3</sub>
            </li>
          </ol>
        </details>`,
    script: "",
  },
  {
    type: 22,
    body: `        <p class="tip" style="margin-bottom: 16px">
          При проведении расчётов для всех элементов, кроме хлора, используйте
          целые значения Ar; Ar(Cl) = 35,5.
        </p>

        <p>
          Рассчитайте объём (н. у.) углекислого газа, который выделится при
          действии <strong>избытка</strong> карбоната магния на
          <strong>97,33 г</strong> <strong>15 %</strong> раствора соляной
          кислоты.
        </p>
        <p>
          В ответе запишите уравнение реакции, о которой идёт речь в условии
          задачи, и приведите все необходимые вычисления (указывайте единицы
          измерения искомых физических величин).
        </p>

        <details class="tip" style="margin-top: 24px">
          <summary style="cursor: pointer; font-weight: 600">
            Эталон ответа (вариант 1, 2025)
          </summary>
          <p style="margin-top: 12px"><strong>Уравнение:</strong></p>
          <p style="text-align: center">
            MgCO<sub>3</sub> + 2HCl = MgCl<sub>2</sub> + H<sub>2</sub>O +
            CO<sub>2</sub>↑
          </p>
          <p><strong>Вычисления:</strong></p>
          <ul style="line-height: 1.7">
            <li>
              m(HCl) = m(р-ра) · ω / 100 % = 97,33 · 15 / 100 = 14,6 г
            </li>
            <li>n(HCl) = m / M = 14,6 / 36,5 = 0,4 моль</li>
            <li>по уравнению n(CO<sub>2</sub>) = ½ n(HCl) = 0,2 моль</li>
            <li>
              V(CO<sub>2</sub>) = n · V<sub>m</sub> = 0,2 · 22,4 =
              <strong>4,48 л</strong> (н. у.)
            </li>
          </ul>
        </details>`,
    script: "",
  },
  {
    type: 23,
    body: `        <p class="tip" style="margin-bottom: 16px">
          Для ответа на задание 23 используйте БЛАНК ОТВЕТОВ № 2. Запишите
          сначала номер задания (23), а затем развёрнутый ответ к нему. Ответ
          записывайте чётко и разборчиво. Для оформления ответа используйте
          предложенную в задании табличную форму, которую следует перенести в
          БЛАНК ОТВЕТОВ № 2.
        </p>

        <p>
          Для проведения эксперимента выданы склянки № 1 и № 2 с
          <strong>соляной кислотой</strong> и
          <strong>раствором сульфата цинка</strong>, а также три реактива:
          <strong>железо</strong>, растворы
          <strong>гидроксида натрия</strong> и
          <strong>хлорида магния</strong>.
        </p>

        <ol style="line-height: 1.65">
          <li>
            только из указанных в перечне трёх реактивов выберите два, которые
            необходимы для определения каждого вещества, находящегося в склянках
            № 1 и № 2;
          </li>
          <li>
            составьте молекулярное, полное и сокращённое ионные уравнения
            реакции, которую планируете провести для определения вещества из
            склянки № 1;
          </li>
          <li>
            составьте молекулярное, полное и сокращённое ионные уравнения
            реакции, которую планируете провести для определения вещества из
            склянки № 2;
          </li>
          <li>
            для оформления хода эксперимента используйте предложенную ниже
            таблицу;
          </li>
          <li>приступайте к выполнению эксперимента.</li>
        </ol>

        <p><strong>Таблица для оформления проведения эксперимента</strong></p>
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
        </div>

        <details class="tip" style="margin-top: 20px">
          <summary style="cursor: pointer; font-weight: 600">
            Ориентир по эталону (для самопроверки)
          </summary>
          <p style="margin-top: 12px">
            Реактивы: Fe (с HCl — выделение H<sub>2</sub>, с ZnSO<sub>4</sub> —
            без изменений) и NaOH (с HCl — нейтрализация, с ZnSO<sub>4</sub> —
            белый осадок Zn(OH)<sub>2</sub>). Вывод: в склянке № 1 — HCl, в
            склянке № 2 — ZnSO<sub>4</sub>.
          </p>
        </details>`,
    script: "",
  },
];

for (const page of pages) {
  const type = page.type;
  const title = page.title || LEADS[type];
  const lead = LEADS[type];
  const html = shell(type, title, lead, page.body, page.script);
  const file = path.join(outDir, `oge-${pad2(type)}.html`);
  fs.writeFileSync(file, html, "utf8");
  console.log(`Wrote ${file}`);
}

console.log(`\nDone: ${pages.length} files in ${outDir}`);
