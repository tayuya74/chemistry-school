/**
 * Собирает HTML периодической системы (короткая форма) и вставляет её
 * в pages/tables.html между маркерами PERIODIC-TABLE.
 *
 *   node scripts/build-periodic-table.mjs
 *
 * Данные набраны с того же скана, что лежит в assets/periodic-mendeleev.png:
 * [порядковый номер, символ, относительная атомная масса, русское название].
 * Массы в квадратных скобках — массовые числа наиболее устойчивых изотопов.
 */
import fs from "node:fs";
import path from "node:path";
import { root } from "./oge-migrate-lib.mjs";

/* prettier-ignore */
const E = {
  1:  ["H",  "1,008",  "Водород"],
  2:  ["He", "4,00",   "Гелий"],
  3:  ["Li", "6,94",   "Литий"],
  4:  ["Be", "9,01",   "Бериллий"],
  5:  ["B",  "10,81",  "Бор"],
  6:  ["C",  "12,01",  "Углерод"],
  7:  ["N",  "14,00",  "Азот"],
  8:  ["O",  "16,00",  "Кислород"],
  9:  ["F",  "19,00",  "Фтор"],
  10: ["Ne", "20,18",  "Неон"],
  11: ["Na", "22,99",  "Натрий"],
  12: ["Mg", "24,31",  "Магний"],
  13: ["Al", "26,98",  "Алюминий"],
  14: ["Si", "28,09",  "Кремний"],
  15: ["P",  "30,97",  "Фосфор"],
  16: ["S",  "32,06",  "Сера"],
  17: ["Cl", "35,45",  "Хлор"],
  18: ["Ar", "39,95",  "Аргон"],
  19: ["K",  "39,10",  "Калий"],
  20: ["Ca", "40,08",  "Кальций"],
  21: ["Sc", "44,96",  "Скандий"],
  22: ["Ti", "47,90",  "Титан"],
  23: ["V",  "50,94",  "Ванадий"],
  24: ["Cr", "52,00",  "Хром"],
  25: ["Mn", "54,94",  "Марганец"],
  26: ["Fe", "55,85",  "Железо"],
  27: ["Co", "58,93",  "Кобальт"],
  28: ["Ni", "58,69",  "Никель"],
  29: ["Cu", "63,55",  "Медь"],
  30: ["Zn", "65,39",  "Цинк"],
  31: ["Ga", "69,72",  "Галлий"],
  32: ["Ge", "72,59",  "Германий"],
  33: ["As", "74,92",  "Мышьяк"],
  34: ["Se", "78,96",  "Селен"],
  35: ["Br", "79,90",  "Бром"],
  36: ["Kr", "83,80",  "Криптон"],
  37: ["Rb", "85,47",  "Рубидий"],
  38: ["Sr", "87,62",  "Стронций"],
  39: ["Y",  "88,91",  "Иттрий"],
  40: ["Zr", "91,22",  "Цирконий"],
  41: ["Nb", "92,91",  "Ниобий"],
  42: ["Mo", "95,94",  "Молибден"],
  43: ["Tc", "98,91",  "Технеций"],
  44: ["Ru", "101,07", "Рутений"],
  45: ["Rh", "102,91", "Родий"],
  46: ["Pd", "106,42", "Палладий"],
  47: ["Ag", "107,87", "Серебро"],
  48: ["Cd", "112,41", "Кадмий"],
  49: ["In", "114,82", "Индий"],
  50: ["Sn", "118,69", "Олово"],
  51: ["Sb", "121,75", "Сурьма"],
  52: ["Te", "127,60", "Теллур"],
  53: ["I",  "126,90", "Иод"],
  54: ["Xe", "131,29", "Ксенон"],
  55: ["Cs", "132,91", "Цезий"],
  56: ["Ba", "137,33", "Барий"],
  57: ["La", "138,91", "Лантан"],
  72: ["Hf", "178,49", "Гафний"],
  73: ["Ta", "180,95", "Тантал"],
  74: ["W",  "183,85", "Вольфрам"],
  75: ["Re", "186,21", "Рений"],
  76: ["Os", "190,2",  "Осмий"],
  77: ["Ir", "192,22", "Иридий"],
  78: ["Pt", "195,08", "Платина"],
  79: ["Au", "196,97", "Золото"],
  80: ["Hg", "200,59", "Ртуть"],
  81: ["Tl", "204,38", "Таллий"],
  82: ["Pb", "207,2",  "Свинец"],
  83: ["Bi", "208,98", "Висмут"],
  84: ["Po", "[209]",  "Полоний"],
  85: ["At", "[210]",  "Астат"],
  86: ["Rn", "[222]",  "Радон"],
  87: ["Fr", "[223]",  "Франций"],
  88: ["Ra", "226",    "Радий"],
  89: ["Ac", "[227]",  "Актиний"],
  104:["Rf", "[261]",  "Резерфордий"],
  105:["Db", "[262]",  "Дубний"],
  106:["Sg", "[266]",  "Сиборгий"],
  107:["Bh", "[264]",  "Борий"],
  108:["Hs", "[269]",  "Хассий"],
  109:["Mt", "[268]",  "Мейтнерий"],
  110:["Ds", "[271]",  "Дармштадтий"],
  111:["Rg", "[280]",  "Рентгений"],
  112:["Cn", "[285]",  "Коперниций"],
  113:["Nh", "[286]",  "Нихоний"],
  114:["Fl", "[289]",  "Флеровий"],
  115:["Mc", "[290]",  "Московий"],
  116:["Lv", "[293]",  "Ливерморий"],
  117:["Ts", "[294]",  "Теннессин"],
  118:["Og", "[294]",  "Оганесон"],
  /* лантаноиды */
  58: ["Ce", "140",    "Церий"],
  59: ["Pr", "141",    "Празеодим"],
  60: ["Nd", "144",    "Неодим"],
  61: ["Pm", "[145]",  "Прометий"],
  62: ["Sm", "150",    "Самарий"],
  63: ["Eu", "152",    "Европий"],
  64: ["Gd", "157",    "Гадолиний"],
  65: ["Tb", "159",    "Тербий"],
  66: ["Dy", "162,5",  "Диспрозий"],
  67: ["Ho", "165",    "Гольмий"],
  68: ["Er", "167",    "Эрбий"],
  69: ["Tm", "169",    "Тулий"],
  70: ["Yb", "173",    "Иттербий"],
  71: ["Lu", "175",    "Лютеций"],
  /* актиноиды */
  90: ["Th", "232",    "Торий"],
  91: ["Pa", "231",    "Протактиний"],
  92: ["U",  "238",    "Уран"],
  93: ["Np", "237",    "Нептуний"],
  94: ["Pu", "[244]",  "Плутоний"],
  95: ["Am", "[243]",  "Америций"],
  96: ["Cm", "[247]",  "Кюрий"],
  97: ["Bk", "[247]",  "Берклий"],
  98: ["Cf", "[251]",  "Калифорний"],
  99: ["Es", "[252]",  "Эйнштейний"],
  100:["Fm", "[257]",  "Фермий"],
  101:["Md", "[258]",  "Менделевий"],
  102:["No", "[259]",  "Нобелий"],
  103:["Lr", "[262]",  "Лоуренсий"],
};

/**
 * Ряды короткой формы. Каждая строка — восемь групп; в группе VIII
 * побочной подгруппы стоят сразу три элемента (триада).
 * null — пустая клетка, "Hmark" — метка «(H)» над галогенами.
 *
 * kind задаёт, где в строке главная подгруппа, а где побочная:
 *   "small" — малый период, все элементы главной подгруппы;
 *   "a" — первый ряд большого периода: I и II главные, III–VII побочные;
 *   "b" — второй ряд: I и II побочные, III–VII главные.
 * Элементы главных подгрупп прижимаются влево, побочных — вправо,
 * как в печатной таблице.
 */
/* prettier-ignore */
const ROWS = [
  { period: "1", span: 1, kind: "small", cells: [[1], null, null, null, null, null, ["Hmark"], [2]] },
  { period: "2", span: 1, kind: "small", cells: [[3], [4], [5], [6], [7], [8], [9], [10]] },
  { period: "3", span: 1, kind: "small", cells: [[11], [12], [13], [14], [15], [16], [17], [18]] },
  { period: "4", span: 2, kind: "a",     cells: [[19], [20], [21], [22], [23], [24], [25], [26, 27, 28]] },
  { period: null,         kind: "b",     cells: [[29], [30], [31], [32], [33], [34], [35], [36]] },
  { period: "5", span: 2, kind: "a",     cells: [[37], [38], [39], [40], [41], [42], [43], [44, 45, 46]] },
  { period: null,         kind: "b",     cells: [[47], [48], [49], [50], [51], [52], [53], [54]] },
  { period: "6", span: 2, kind: "a",     cells: [[55], [56], [57, "*"], [72], [73], [74], [75], [76, 77, 78]] },
  { period: null,         kind: "b",     cells: [[79], [80], [81], [82], [83], [84], [85], [86]] },
  { period: "7", span: 2, kind: "a",     cells: [[87], [88], [89, "**"], [104], [105], [106], [107], [108, 109, 110]] },
  { period: null,         kind: "b",     cells: [[111], [112], [113], [114], [115], [116], [117], [118]] },
];

/**
 * Как выглядит клетка: к какому краю прижата и что идёт первым —
 * символ или масса. Снято с печатной таблицы:
 *   первый ряд большого периода — всё влево, символ первым;
 *   второй ряд — всё вправо, масса первой;
 *   малый период — группы I–II как первый ряд, III–VII как второй;
 *   группа VIII — благородный газ всегда символом вперёд.
 */
const GROUPS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** Проверка целостности данных: все 118 номеров, символы не повторяются. */
function selfCheck() {
  const problems = [];
  for (let z = 1; z <= 118; z++) {
    if (!E[z]) problems.push(`нет элемента с номером ${z}`);
  }
  const seen = new Map();
  for (const [z, [sym]] of Object.entries(E)) {
    if (seen.has(sym))
      problems.push(`символ ${sym} повторяется: ${seen.get(sym)} и ${z}`);
    seen.set(sym, z);
  }
  const placed = new Set();
  for (const r of ROWS)
    for (const cell of r.cells)
      if (cell)
        for (const x of cell)
          if (typeof x === "number") {
            if (placed.has(x))
              problems.push(`элемент ${x} стоит в таблице дважды`);
            placed.add(x);
          }
  for (let z = 58; z <= 71; z++) placed.add(z);
  for (let z = 90; z <= 103; z++) placed.add(z);
  for (let z = 1; z <= 118; z++)
    if (!placed.has(z)) problems.push(`элемент ${z} нигде не размещён`);
  return problems;
}

function cellLayout(kind, groupIndex) {
  const isViii = groupIndex === 7;
  if (kind === "a") return { side: "left", massFirst: false };
  if (kind === "b") return { side: "right", massFirst: !isViii };
  if (groupIndex < 2) return { side: "left", massFirst: false };
  return { side: "right", massFirst: !isViii };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function cellBox(z, mark, massFirst) {
  if (z === "Hmark") {
    return `<div class="pt-el pt-el--ghost"><span class="pt-sym">(H)</span></div>`;
  }
  const [sym, mass, name] = E[z];
  const star = mark ? `<span class="pt-star">${mark}</span>` : "";
  /* Символ и масса стоят на одной строке, как в печатной таблице;
     номер сверху и название снизу — по центру клетки. */
  return (
    `<div class="pt-el" title="${esc(name)}, Ar = ${esc(mass)}">` +
    `<span class="pt-num">${z}</span>` +
    `<span class="pt-line">` +
    (massFirst
      ? `<span class="pt-mass">${esc(mass)}</span>` +
        `<span class="pt-sym">${esc(sym)}${star}</span>`
      : `<span class="pt-sym">${esc(sym)}${star}</span>` +
        `<span class="pt-mass">${esc(mass)}</span>`) +
    `</span>` +
    `<span class="pt-name">${esc(name)}</span>` +
    `</div>`
  );
}

function renderCell(cell, groupIndex, kind) {
  if (!cell) return `<td class="pt-cell pt-cell--empty"></td>`;
  const mark = typeof cell[1] === "string" ? cell[1] : null;
  const items = cell.filter((x) => typeof x === "number" || x === "Hmark");
  const { side, massFirst } = cellLayout(kind, groupIndex);
  const boxes = items.map((z) => cellBox(z, mark, massFirst));

  /* В группе VIII клетка всегда делится на три: триада занимает все три,
     а благородный газ — только правую, как на печатной таблице. */
  if (groupIndex === 7) {
    while (boxes.length < 3)
      boxes.unshift(`<div class="pt-el pt-el--blank"></div>`);
    return `<td class="pt-cell pt-cell--triad">${boxes.join("")}</td>`;
  }

  return `<td class="pt-cell pt-cell--${side}">${boxes.join("")}</td>`;
}

function renderMain() {
  /* Группе VIII нужно втрое больше места: там стоят триады Fe—Co—Ni и т. п. */
  const cols =
    `<colgroup><col class="pt-col-period" />` +
    GROUPS.map(
      (g) => `<col class="${g === "VIII" ? "pt-col-viii" : "pt-col"}" />`,
    ).join("") +
    `</colgroup>`;

  const head =
    `<tr><th class="pt-corner" rowspan="2" scope="col">Периоды</th>` +
    `<th class="pt-groups" colspan="8" scope="colgroup">Группы</th></tr>` +
    `<tr>${GROUPS.map((g) => `<th class="pt-group" scope="col">${g}</th>`).join("")}</tr>`;

  const body = ROWS.map((r) => {
    const label =
      r.period === null
        ? ""
        : `<th class="pt-period" scope="row"${r.span > 1 ? ` rowspan="${r.span}"` : ""}>${r.period}</th>`;
    return `<tr>${label}${r.cells.map((c, i) => renderCell(c, i, r.kind)).join("")}</tr>`;
  }).join("");

  return `<table class="pt-table"><caption class="visually-hidden">Периодическая система химических элементов Д. И. Менделеева, короткая форма</caption>${cols}<thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderSeries(title, from, to) {
  const cells = [];
  for (let z = from; z <= to; z++)
    cells.push(`<td class="pt-cell">${cellBox(z)}</td>`);
  return (
    `<table class="pt-table pt-table--series">` +
    `<caption class="pt-series-title">${title}</caption>` +
    `<tbody><tr>${cells.join("")}</tr></tbody></table>`
  );
}

const problems = selfCheck();
if (problems.length) {
  console.error("Данные не сходятся:");
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}

const html =
  `<div class="pt-scroll" tabindex="0" role="region" aria-label="Периодическая система химических элементов">` +
  renderMain() +
  renderSeries("* Лантаноиды", 58, 71) +
  renderSeries("** Актиноиды", 90, 103) +
  `</div>`;

const target = path.join(root, "pages", "tables.html");
const src = fs.readFileSync(target, "utf8");
const START = "<!-- PERIODIC-TABLE:start -->";
const END = "<!-- PERIODIC-TABLE:end -->";
const i = src.indexOf(START);
const j = src.indexOf(END);
if (i < 0 || j < 0) {
  console.error("В pages/tables.html нет маркеров PERIODIC-TABLE:start/end");
  process.exit(1);
}
fs.writeFileSync(
  target,
  src.slice(0, i + START.length) + "\n" + html + "\n" + src.slice(j),
  "utf8",
);

const total = Object.keys(E).length;
console.log(`Периодическая система собрана: ${total} элементов.`);
