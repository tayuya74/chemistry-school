/**
 * Проверка разборов заданий: сводит атомы в уравнениях и ловит реакции,
 * которых не бывает.
 *
 *   npm run check:oge-solutions
 *
 * Что проверяется:
 *   1) в каждом уравнении число атомов каждого элемента слева и справа совпадает;
 *   2) металл не пытается вытеснить из соли более активный металл.
 *
 * Запускается по требованию, как и проверка на дубли: разборы правятся редко,
 * а гонять это при каждой сборке незачем.
 */
import fs from "node:fs";
import path from "node:path";
import { loadRegistry, root } from "./oge-migrate-lib.mjs";

const tasksDir = path.join(root, "data", "oge", "tasks");

/** Электрохимический ряд напряжений: чем меньше индекс, тем активнее металл. */
const ACTIVITY =
  "Li Rb K Ba Sr Ca Na Mg Al Mn Zn Cr Fe Cd Co Ni Sn Pb H Sb Bi Cu Hg Ag Pt Au".split(
    " ",
  );

/**
 * Prettier переносит длинные формулы внутри абзаца, поэтому сначала убираем
 * переводы строк исходника и только потом ставим свои — по <br> и концам блоков.
 */
/** Метка заряда: строки с ней — ионные уравнения, по атомам их не сводят. */
const CHARGE = "¤";

function flatten(html) {
  return html
    .replace(/\s*\n\s*/g, " ")
    .replace(/<sup>[\s\S]*?<\/sup>/g, CHARGE)
    .replace(/<sub>\s*([\s\S]*?)\s*<\/sub>/g, (_, d) => d.replace(/\s+/g, ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|ol|ul)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ");
}

/** Считает атомы в формуле вида 3Ca(H2PO4)2 и добавляет их в acc. */
function countAtoms(formula, acc) {
  const m = formula.match(/^(\d+)\s*/);
  const k = m ? Number(m[1]) : 1;
  const rest = (m ? formula.slice(m[0].length) : formula).replace(/·/g, "");

  const walk = (str, factor) => {
    let i = 0;
    while (i < str.length) {
      if (str[i] === "(") {
        let depth = 1;
        let j = i + 1;
        while (j < str.length && depth > 0) {
          if (str[j] === "(") depth++;
          if (str[j] === ")") depth--;
          j++;
        }
        const num = str.slice(j).match(/^\d+/);
        walk(str.slice(i + 1, j - 1), factor * (num ? Number(num[0]) : 1));
        i = j + (num ? num[0].length : 0);
        continue;
      }
      const el = str.slice(i).match(/^([A-Z][a-z]?)(\d*)/);
      if (!el || !el[1]) {
        i++;
        continue;
      }
      acc[el[1]] = (acc[el[1]] ?? 0) + factor * (el[2] ? Number(el[2]) : 1);
      i += el[0].length;
    }
  };
  walk(rest, k);
}

/** Убирает условия над стрелкой и пояснения в скобках. */
function cleanSide(side) {
  return side
    .replace(/\([^)]*—[^)]*\)/g, "")
    .replace(/\((р-р|тв\.|конц\.|разб\.|изб\.|кр\.)\)/g, "")
    .replace(/—?\s*(t°|электролиз|кат\.|сплавление)\s*—?/gi, " ")
    .replace(/[↓↑]/g, "")
    .trim();
}

/** Строки-подписи вида «X = NaOH» уравнениями не являются. */
const isLabel = (raw) => /^\s*X\s*[=—-]/.test(raw);

function checkEquation(raw) {
  const sep = raw.includes("=") ? "=" : "→";
  const parts = raw.split(sep);
  if (parts.length !== 2) return null;

  const left = {};
  const right = {};
  for (const [side, acc] of [
    [parts[0], left],
    [parts[1], right],
  ]) {
    for (const f of cleanSide(side).split("+")) {
      const t = f.trim();
      if (!t) continue;
      if (!/^\d*[A-Z]/.test(t)) return null;
      countAtoms(t, acc);
    }
  }
  if (!Object.keys(left).length || !Object.keys(right).length) return null;

  const els = [
    ...new Set([...Object.keys(left), ...Object.keys(right)]),
  ].sort();
  const diff = els.filter((e) => (left[e] ?? 0) !== (right[e] ?? 0));
  return diff.length
    ? diff.map((e) => `${e}: слева ${left[e] ?? 0}, справа ${right[e] ?? 0}`)
    : [];
}

/** Ищет «менее активный металл вытесняет более активный». */
function checkDisplacement(text) {
  const problems = [];
  const salts =
    /([A-Z][a-z]?)(?:\(NO3\)2|\(NO3\)3|SO4|Cl2|Cl3|\(SO4\)3)\s*\+\s*\d*([A-Z][a-z]?)\s*=/g;
  for (const [, saltMetal, metal] of text.matchAll(salts)) {
    const a = ACTIVITY.indexOf(saltMetal);
    const b = ACTIVITY.indexOf(metal);
    if (a >= 0 && b >= 0 && b > a) {
      problems.push(
        `${metal} не может вытеснить ${saltMetal}: в ряду активности он правее`,
      );
    }
  }
  return problems;
}

function main() {
  let checked = 0;
  let bad = 0;

  for (const row of loadRegistry()) {
    const p = path.join(tasksDir, `${row.id}.json`);
    if (!fs.existsSync(p)) continue;
    const task = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!task.solution) continue;

    const text = flatten(task.solution.html);

    for (const line of text.split("\n")) {
      const raw = line.trim();
      if (isLabel(raw)) continue;
      /* Ионные уравнения сводятся с учётом зарядов — этот скрипт их не разбирает. */
      if (raw.includes(CHARGE)) continue;
      if (!/[=→]/.test(raw) || !/[A-Z]/.test(raw)) continue;
      const diff = checkEquation(raw);
      if (diff === null) continue;
      checked++;
      if (diff.length) {
        bad++;
        console.log(`НЕ СХОДИТСЯ  id ${row.id} [тип ${row.type}]`);
        console.log(`  ${raw}`);
        console.log(`  ${diff.join("; ")}`);
      }
    }

    for (const problem of checkDisplacement(text)) {
      bad++;
      console.log(`НЕВОЗМОЖНАЯ РЕАКЦИЯ  id ${row.id} [тип ${row.type}]`);
      console.log(`  ${problem}`);
    }
  }

  console.log(`\nПроверено уравнений: ${checked}. Проблем: ${bad}.`);
  process.exit(bad ? 1 : 0);
}

main();
