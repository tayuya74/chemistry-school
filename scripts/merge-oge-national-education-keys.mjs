import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const unifiedPath = path.join(
  root,
  "data",
  "oge-answer-keys-national-education.json",
);
let part1ByVariant;
let part1Note =
  "Краткие ответы вариантов 1–10 (задания 1–19). В заданиях 18 и 19 запятая — десятичный разделитель.";
if (fs.existsSync(unifiedPath)) {
  const cur = JSON.parse(fs.readFileSync(unifiedPath, "utf8"));
  part1ByVariant = cur.part1?.byVariant;
  if (cur.part1?.note) {
    part1Note = cur.part1.note;
  }
}
const legacyPath = path.join(
  root,
  "data",
  "oge-answer-keys-national-education-part1.json",
);
if (!part1ByVariant && fs.existsSync(legacyPath)) {
  const legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
  part1ByVariant = legacy.variants ?? legacy.part1?.byVariant;
  if (legacy.note) {
    part1Note = legacy.note;
  }
}
if (!part1ByVariant) {
  console.error(
    "Нет part1: нужен существующий oge-answer-keys-national-education.json (part1.byVariant) или старый ...-part1.json",
  );
  process.exit(1);
}

/** Эталоны части 2 (Национальное образование): задания 20–23, вариант 1–10 */
const part2ByVariant = {
  1: {
    20: "Электронный баланс: 1|S^−2 − 2e → S^0; 2|Fe^+3 + e → Fe^+2. CuS + 2FeCl3 = CuCl2 + 2FeCl2 + S. Восстановитель — S^−2 (CuS); окислитель — Fe^+3 (FeCl3).",
    21: "2AgNO3 + Cu = Cu(NO3)2 + 2Ag; Cu + Cl2 = CuCl2; CuCl2 + 2NaOH = Cu(OH)2↓ + 2NaCl.",
    22: "MgCO3 + 2HCl = MgCl2 + H2O + CO2↑. m(HCl) = ω·m(р‑ра)/100 = 97,33·15/100 = 14,6 г; n(HCl) = 14,6/36,5 = 0,4 моль; n(CO2) = ½n(HCl) = 0,2 моль; V(CO2) = 0,2·22,4 = 4,48 л (н. у.).",
    23: "Опыт 1 (Fe): Fe + 2HCl = …; опыт 2 (NaOH + ZnSO4): …; таблица: Fe | газ и др.; NaOH — осадок Zn(OH)2 в ст. № 2; ВЫВОД: № 1 — HCl, № 2 — ZnSO4.",
  },
  2: {
    20: "P^−3 − 8e → P^+5 |×1; N^+5 + e → N^+4 |×8. PH3 + 8HNO3 = H3PO4 + 8NO2 + 4H2O. Окислитель — HNO3 (N^+5); восстановитель — PH3.",
    21: "4Al + 3O2 = 2Al2O3; Al2O3 + 6HCl = 2AlCl3 + 3H2O; AlCl3 + 3AgNO3 = Al(NO3)3 + 3AgCl↓.",
    22: "K2CO3 + Mg(NO3)2 = MgCO3↓ + 2KNO3. n(MgCO3)=16,8/84=0,2 моль ⇒ n(K2CO3)=0,2; m(K2CO3)=27,6 г; ω=27,6/250≈0,11 (11%).",
    23: "Опыты по Fe и ZnSO4; уравнения Fe + H2SO4; ZnSO4 + 2KOH (как в эталоне). Таблица и ВЫВОД: H2SO4 | KOH.",
  },
  3: {
    20: "1|S^−2 − 2e → S^0; 2|Fe^+3 + e → Fe^+2. 2FeCl3 + 3Na2S = 2FeS + S + 6NaCl. Окислитель Fe^+3; восстановитель S^−2 (Na2S).",
    21: "2Mg + O2 = 2MgO; MgO + SO3 = MgSO4; MgSO4 + Ba(NO3)2 = BaSO4↓ + Mg(NO3)2.",
    22: "Fe(NO3)2 + 2KOH = Fe(OH)2↓ + 2KNO3. n(Fe(OH)2)=22,5/90=0,25 моль; n(KOH)=2·0,25=0,5 моль; m(KOH)=28 г; ω(KOH)=28/110≈0,2545 (25,5 %).",
    23: "Опыт 1: AgNO3 + HCl; Ag⁺ + Cl⁻ = AgCl↓. Опыт 2: 3Ca(NO3)2 + 2K3PO4 -> Ca3(PO4)2 + 6KNO3 и сокращённое ионное. Таблица: реактив HCl; затем Ca(NO3)2; вывод скл. №1 — K3PO4, №2 — AgNO3.",
  },
  4: {
    20: "3|Mn²⁺ − 2e → Mn⁴⁺; 2|Mn⁷⁺ + 3e → Mn⁴⁺. 3MnSO4 + 2KMnO4 + 2H2O = 5MnO2 + K2SO4 + 2H2SO4 (как в ключе издания). Восстановитель Mn²⁺; окислитель Mn⁷⁺ (KMnO4).",
    21: "Si + O2 = SiO2; 2NaOH + SiO2 = Na2SiO3 + H2O; Na2SiO3 + 2HCl = H2SiO3 + 2NaCl.",
    22: "K2SO3 + 2HCl = 2KCl + SO2 + H2O. m(HCl)=146·20/100=29,2 г; n=0,8 моль; n(SO2)=½n(HCl)=0,4 моль; V(SO2)=0,4·22,4=8,96 л.",
    23: "Опыт 1: H2SO4 + BaCl2; SO4²⁻ + Ba²⁺ → BaSO4. Опыт 2: 2KOH + MgCl2. Таблица: H2SO4 — изменений нет / белый осадок; KOH — белый осадок / изменений нет. ВЫВОД скл.: MgCl2 | BaCl2.",
  },
  5: {
    20: "Электронный баланс C^+2 / Cl₂^0; CO + Cl2 + 4KOH = K2CO3 + 2KCl + 2H2O. Окислитель Cl₂; восстановитель C^+2 (CO).",
    21: "2Na + 2H2O = 2NaOH + H2; NaOH + HNO3 = NaNO3 + H2O; 2NaNO3 =(t)→ 2NaNO2 + O2.",
    22: "2NaOH + CuSO4 = Cu(OH)2 + Na2SO4. n(Cu(OH)2)=73,5/98=0,75 моль ⇒ n(NaOH)=1,5; m(NaOH)=60 г ⇒ ω(NaOH)=60/300=20%.",
    23: "Опыт 1: MgO + 2HCl; опыт 2: Ca(OH)2 + 2NH4Cl. Таблица издания и ВЫВОД: NH4Cl | HCl.",
  },
  6: {
    20: "Cl^+5 + 6e → Cl^−; 3|2Br^− − 2e → Br₂. 6HBr + KClO3 = KCl + 3Br2 + 3H2O. Окислитель KClO3; восстановитель HBr.",
    21: "Cu + 4HNO3 = Cu(NO3)2 + 2NO2 + 2H2O; Cu(NO3)2 + 2NaOH = Cu(OH)2 + 2NaNO3; Cu(OH)2 + 2HCl = CuCl2 + 2H2O.",
    22: "AlCl3 + 3KOH = Al(OH)3↓ + 3KCl; по ключу издания: m(KOH)=ω·m(р‑ра)/100=16,8·0,1=1,68 г; n(KOH)=0,03 моль; n(Al(OH)3)=⅓·n(KOH)=0,01; m(Al(OH)3)=0,78 г.",
    23: "BaCl2 + MgSO4 → BaSO4; H2SO4 + Zn. Наблюдения как в сборнике. ВЫВОД скл.: H2SO4 | BaCl2.",
  },
  7: {
    20: "Cl^+5 + 6e → Cl^−; N^+2 − 3e → N^+5. 2NO + KClO3 + 2KOH = 2KNO3 + KCl + H2O. Окислитель KClO3; восстановитель NO.",
    21: "2H2S + 3O2 = 2SO2 + 2H2O; SO2 + 2NH3 + H2O = (NH4)2SO3; (NH4)2SO3 + 2NaOH = Na2SO3 + 2NH3 + 2H2O.",
    22: "Na2CO3 + H2SO4 = Na2SO4 + CO2 + H2O; m(H2SO4)=19,6·0,1=1,96 г; n=0,02 ⇒ m(Na2CO3)=0,02·106=2,12 г.",
    23: "MgCl2 + NaOH → Mg(OH)2; H2SO4 + Zn → H2. ВЫВОД скл.: H2SO4 | MgCl2.",
  },
  8: {
    20: "Cl^+5 + 6e → Cl^−; 3|S^−2 − 2e → S. 3K2S + HClO3 + 2H2O = KCl + 3S + 5KOH (как в ключе издания). Восстановитель K2S; окислитель HClO3.",
    21: "2FeCl2 + Cl2 = 2FeCl3; FeCl3 + 3NaOH = Fe(OH)3 + 3NaCl; 2Fe(OH)3 + 3H2SO4 = Fe2(SO4)3 + 6H2O.",
    22: "MgS + 2HCl = MgCl2 + H2S; m(HCl)=18,25·8/100=1,46 г; n(HCl)=0,04 ⇒ n(H2S)=½·0,04=0,02; V(H2S)=0,448 л.",
    23: "CuCl2 + KOH → Cu(OH)2; Na2CO3 + MgSO4 → MgCO3. ВЫВОД скл.: KOH | MgSO4.",
  },
  9: {
    20: "2Fe³⁺ + e → Fe²⁺; 2|2I− − 2e → I2. Fe2(SO4)3 + 6KI = I2 + 2FeI2 + 3K2SO4. Окислитель Fe³⁺; восстановитель I− (KI).",
    21: "2AgNO3 + Cu = Cu(NO3)2 + 2Ag; Cu(NO3)2 + 2NaOH = Cu(OH)2 + 2NaNO3; Cu(OH)2 =(t)→ CuO + H2O.",
    22: "CuCl2 + 2AgNO3 = 2AgCl + Cu(NO3)2; m(CuCl2)=135·2/100=2,7 г; n(CuCl2)=2,7/135=0,02; n(AgCl)=2·0,02=0,04; m(AgCl)=0,04·143,5=5,74 г.",
    23: "MgSO4 + BaCl2; CuSO4 + KOH. Таблица издания. ВЫВОД скл.: KOH | MgSO4.",
  },
  10: {
    20: "S²− − 2e → S⁰ |×1; 2|Fe³⁺ + e → Fe²⁺. 3K2S + 2FeBr3 = 2FeS + S + 6KBr. Окислитель Fe³⁺; восстановитель S²−.",
    21: "4Fe(OH)2 + 2H2O + O2 = 4Fe(OH)3; 2Fe(OH)3 =(t)→ Fe2O3 + 3H2O; Fe2O3 + 6HNO3 = 2Fe(NO3)3 + 3H2O.",
    22: "Al2(SO4)3 + 3BaCl2 = 3BaSO4 + 2AlCl3; m(соли)=171·4/100=6,84 г; n=0,02 ⇒ n(BaSO4)=3·0,02=0,06; m(BaSO4)=13,98 г.",
    23: "MgCl2 + 2NaOH → Mg(OH)2↓; Zn + 2HCl → … Таблица издания. ВЫВОД скл.: MgCl2 | HCl.",
  },
};

const merged = {
  title:
    "ОГЭ по химии: ключи к типовым вариантам (Национальное образование, 2025)",
  part1: {
    note: part1Note,
    byVariant: part1ByVariant,
  },
  part2: {
    note: "Развёрнутый ответ (задания 20–23). Тексты — элементы верного ответа по сборнику; при проверке ориентируйтесь на полную формулировку методички.",
    byVariant: part2ByVariant,
  },
};

if (!merged.part1.byVariant) {
  console.error("Нет part1.byVariant");
  process.exit(1);
}

const outMain = path.join(
  root,
  "data",
  "oge-answer-keys-national-education.json",
);
fs.writeFileSync(outMain, JSON.stringify(merged, null, 2), "utf8");
console.log("Записано:", outMain);
