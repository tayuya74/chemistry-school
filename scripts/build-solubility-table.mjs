import fs from "node:fs";
import path from "node:path";
import { root } from "./oge-migrate-lib.mjs";

const cations = [
  "H<sup>+</sup>",
  "Li<sup>+</sup>",
  "K<sup>+</sup>",
  "Na<sup>+</sup>",
  "NH<sub>4</sub><sup>+</sup>",
  "Ba<sup>2+</sup>",
  "Ca<sup>2+</sup>",
  "Mg<sup>2+</sup>",
  "Sr<sup>2+</sup>",
  "Al<sup>3+</sup>",
  "Cr<sup>3+</sup>",
  "Fe<sup>2+</sup>",
  "Fe<sup>3+</sup>",
  "Mn<sup>2+</sup>",
  "Zn<sup>2+</sup>",
  "Ag<sup>+</sup>",
  "Hg<sub>2</sub><sup>2+</sup>",
  "Pb<sup>2+</sup>",
  "Sn<sup>2+</sup>",
  "Cu<sup>2+</sup>",
];

const rows = [
  ["OH<sup>−</sup>", ".RRRRRMNMNNNNNNDDNNN"],
  ["F<sup>−</sup>", "RMRRRMNNNMNNNRRRDNRR"],
  ["Cl<sup>−</sup>", "RRRRRRRRRRRRRRRNRMRR"],
  ["Br<sup>−</sup>", "RRRRRRRRRRRRRRRNMMRR"],
  ["I<sup>−</sup>", "RRRRRRRRRRQRQRRNNNMQ"],
  ["S<sup>2−</sup>", "RRRRRDDDNDDNDNNNNNNN"],
  ["HS<sup>−</sup>", "RRRRRRRRRQQQQQQQQQQQ"],
  ["SO<sub>3</sub><sup>2−</sup>", "RRRRRNNMNQDNQQMNNNQQ"],
  ["HSO<sub>3</sub><sup>−</sup>", "RQRRRRRRRQQQQQQQQQQQ"],
  ["SO<sub>4</sub><sup>2−</sup>", "RRRRRNMRNRRRRRRMDNRR"],
  ["HSO<sub>4</sub><sup>−</sup>", "RRRRRQQQDQQQQQQQQNQQ"],
  ["NO<sub>3</sub><sup>−</sup>", "RRRRRRRRRRRRRRRRRRDR"],
  ["NO<sub>2</sub><sup>−</sup>", "RRRRRRRRRQQQQQQMQQQQ"],
  ["PO<sub>4</sub><sup>3−</sup>", "RNRRDNNNNNNNNNNNNNNN"],
  ["HPO<sub>4</sub><sup>2−</sup>", "RQRRRNNMNQQNQNQQQMNQ"],
  ["H<sub>2</sub>PO<sub>4</sub><sup>−</sup>", "RRRRRRRRRQQRQRRRQDQQ"],
  ["CO<sub>3</sub><sup>2−</sup>", "RRRRRNNNNQQNDNNNNNQN"],
  ["HCO<sub>3</sub><sup>−</sup>", "RRRRRRRRRQQRQQQQQRQQ"],
  ["CH<sub>3</sub>COO<sup>−</sup>", "RRRRRRRRRDRRDRRRRRDR"],
  ["SiO<sub>3</sub><sup>2−</sup>", "NNRRQNNNNQQNQNNQQNQQ"],
  ["MnO<sub>4</sub><sup>−</sup>", "RRRRRRRRRRQQQQRQQQQQ"],
  ["Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup>", "RRRRRMRQNQQQRQQNNMQR"],
  ["CrO<sub>4</sub><sup>2−</sup>", "RRRRRNRRNQQQNNNNNNNN"],
  ["ClO<sub>3</sub><sup>−</sup>", "RRRRRRRRRRRQQRRRRRQR"],
  ["ClO<sub>4</sub><sup>−</sup>", "RRRRRRRRRRRRRRRRRRQR"],
];

const values = {
  R: ["Р", "растворяется", "r"],
  M: ["М", "мало растворяется", "m"],
  N: ["Н", "практически не растворяется", "n"],
  D: ["—", "разлагается в воде", "dash"],
  Q: ["?", "нет достоверных сведений", "unknown"],
  ".": ["", "обозначение не приводится", "empty"],
};

for (const [ion, codes] of rows) {
  if (codes.length !== cations.length)
    throw new Error(
      `${ion}: ожидалось ${cations.length} значений, получено ${codes.length}`,
    );
  for (const code of codes)
    if (!values[code]) throw new Error(`${ion}: неизвестный код ${code}`);
}

const head = cations.map((ion) => `<th scope="col">${ion}</th>`).join("");
const body = rows
  .map(([ion, codes]) => {
    const cells = [...codes]
      .map((code) => {
        const [symbol, label, className] = values[code];
        return `<td class="sol-value sol-value--${className}" title="${label}" aria-label="${label}">${symbol}</td>`;
      })
      .join("");
    return `<tr><th scope="row">${ion}</th>${cells}</tr>`;
  })
  .join("");

const table = `<div class="solubility-scroll" tabindex="0" role="region" aria-label="Растворимость кислот, солей и оснований в воде"><table class="solubility-table"><caption class="visually-hidden">Таблица растворимости кислот, солей и оснований в воде</caption><thead><tr><th scope="col" aria-label="Анионы"></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
const file = path.join(root, "pages", "tables.html");
const source = fs.readFileSync(file, "utf8");
const start = "<!-- SOLUBILITY-TABLE:start -->";
const end = "<!-- SOLUBILITY-TABLE:end -->";
const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
if (!pattern.test(source))
  throw new Error("Не найдены маркеры SOLUBILITY-TABLE");
fs.writeFileSync(file, source.replace(pattern, `${start}\n${table}\n${end}`));
console.log(
  `Таблица растворимости собрана: ${rows.length * cations.length} ячеек.`,
);
