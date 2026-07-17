import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expectedUiKind } from "./oge-ui-kind-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(__dirname, "..");

const FOOTERS = {
  default: "Демонстрационный вариант ОГЭ по химии 2025 года (ФИПИ).",
  "2026-demo": "Демонстрационный вариант ОГЭ по химии 2026 года (ФИПИ).",
  "variant-1":
    "ОГЭ. Типовые экзаменационные варианты, вариант 1 (Издательство «Национальное образование», 2025).",
  "variant-2":
    "ОГЭ. Типовые экзаменационные варианты, вариант 2 (Издательство «Национальное образование», 2025).",
  "variant-3":
    "ОГЭ. Типовые экзаменационные варианты, вариант 3 (Издательство «Национальное образование», 2025).",
  "variant-4":
    "ОГЭ. Типовые экзаменационные варианты, вариант 4 (Издательство «Национальное образование», 2025).",
  "variant-5":
    "ОГЭ. Типовые экзаменационные варианты, вариант 5 (Издательство «Национальное образование», 2025).",
  "variant-6":
    "ОГЭ. Типовые экзаменационные варианты, вариант 6 (Издательство «Национальное образование», 2025).",
  "variant-7":
    "ОГЭ. Типовые экзаменационные варианты, вариант 7 (Издательство «Национальное образование», 2025).",
  "variant-8":
    "ОГЭ. Типовые экзаменационные варианты, вариант 8 (Издательство «Национальное образование», 2025).",
  "variant-9":
    "ОГЭ. Типовые экзаменационные варианты, вариант 9 (Издательство «Национальное образование», 2025).",
  "variant-10":
    "ОГЭ. Типовые экзаменационные варианты, вариант 10 (Издательство «Национальное образование», 2025).",
};

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function resolveSourcePath(row) {
  const dir = row.sourceDir ? row.sourceDir : "default";
  return path.join(
    root,
    "data",
    "oge-source",
    dir,
    `oge-${pad2(row.type)}.html`,
  );
}

export function sourceLabel(row) {
  if (row.sourceFooter) return row.sourceFooter;
  const dir = row.sourceDir ?? "default";
  return FOOTERS[dir] ?? FOOTERS.default;
}

export function splitAtLead(articleInner) {
  const m = articleInner.match(
    /^([\s\S]*<p class="lead">[\s\S]*?<\/p>)([\s\S]*)$/,
  );
  if (!m) throw new Error("Не найден блок lead в article");
  return { prefix: m[1], taskBody: m[2].trim() };
}

export function extractLead(html) {
  const m = html.match(/<p class="lead">([\s\S]*?)<\/p>/);
  if (!m) return "";
  return stripTags(m[1]).replace(/\s+/g, " ").trim();
}

export function getArticleTaskBody(html) {
  const articleMatch = html.match(/<article class="card">([\s\S]*?)<\/article>/);
  if (!articleMatch) throw new Error("article not found");
  return splitAtLead(articleMatch[1]).taskBody;
}

export function getScriptInner(html) {
  const idx = html.indexOf("</article>");
  if (idx === -1) return "";
  const tail = html.slice(idx);
  const m = tail.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  return m ? m[1] : "";
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

function trimHtml(s) {
  return s.replace(/\s+/g, " ").trim();
}

const WIDGET_MARKERS = [
  '<ol class="oge-statements">',
  '<div class="match-columns">',
  '<div class="oge-nucleus-wrap">',
  '<div class="oge-mass-table-wrap"',
  '<details class="tip"',
  '<p class="oge-answer-label">',
];

export function splitIntroAndRest(taskBody) {
  let cut = taskBody.length;
  for (const marker of WIDGET_MARKERS) {
    const i = taskBody.indexOf(marker);
    if (i !== -1 && i < cut) cut = i;
  }
  const intro = taskBody.slice(0, cut).trim();
  const rest = taskBody.slice(cut).trim();
  return { intro, rest };
}

export function introToBlocks(introHtml) {
  if (!introHtml) return [];
  const blocks = [];
  const re = /<(p|ol)[^>]*>[\s\S]*?<\/\1>/gi;
  let m;
  while ((m = re.exec(introHtml)) !== null) {
    const html = m[0].trim();
    if (html.includes("oge.html") || html.includes("oge-task-nav")) continue;
    blocks.push({ html });
  }
  if (blocks.length === 0 && introHtml.trim()) {
    blocks.push({ html: introHtml.trim() });
  }
  return blocks;
}

export function extractStatements(taskBody) {
  const m = taskBody.match(/<ol class="oge-statements">([\s\S]*?)<\/ol>/);
  if (!m) return [];
  const items = [];
  const re = /<li>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span\s*>/gi;
  let mm;
  while ((mm = re.exec(m[1])) !== null) {
    items.push(mm[1].replace(/\s+/g, " ").trim());
  }
  return items;
}

export function extractPlainListItems(taskBody) {
  const m = taskBody.match(/<ol>([\s\S]*?)<\/ol\s*>/);
  if (!m) return [];
  const items = [];
  const re = /<li>([\s\S]*?)<\/li\s*>/gi;
  let mm;
  while ((mm = re.exec(m[1])) !== null) {
    items.push(mm[1].replace(/\s+/g, " ").trim());
  }
  return items;
}

export function extractMatchColumns(taskBody) {
  const start = taskBody.indexOf('<div class="match-columns">');
  const tableStart = taskBody.indexOf('<table class="match-answer-table"');
  if (start === -1 || tableStart === -1) {
    throw new Error("match-columns not found");
  }
  const block = taskBody.slice(start, tableStart);
  const cols = [
    ...block.matchAll(
      /<strong>([^<]+)<\/strong>\s*<ul class="oge-match-plain">([\s\S]*?)<\/ul>/gi,
    ),
  ];
  if (cols.length < 2) throw new Error("match columns parse failed");
  const parseList = (ul) => {
    const items = [];
    const re = /<li>([\s\S]*?)<\/li\s*>/gi;
    let mm;
    while ((mm = re.exec(ul)) !== null) {
      items.push(mm[1].replace(/\s+/g, " ").trim());
    }
    return items;
  };
  return {
    leftTitle: cols[0][1].trim(),
    rightTitle: cols[1][1].trim(),
    left: parseList(cols[0][2]),
    right: parseList(cols[1][2]),
  };
}

export function extractCellCount(taskBody) {
  const m = taskBody.match(/class="oge-answer-cells"[\s\S]*?<\/div>/);
  if (!m) return null;
  return (m[0].match(/<input/g) || []).length;
}

export function extractCorrectArray(script) {
  const m = script.match(/(?:const|let|var)\s+correct\s*=\s*\[([^\]]*)\]/);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
}

export function extractMatchMapping(script) {
  const tripleEq = [
    ...script.matchAll(/\b([xyzabcv])\s*===\s*"(\d)"/gi),
  ];
  if (tripleEq.length >= 3) {
    const vars = tripleEq.slice(0, 3);
    const map = {};
    for (const [, letter, digit] of vars) {
      const l = letter.toLowerCase();
      if (l === "a" || l === "x") map.A = digit;
      else if (l === "b" || l === "y") map.B = digit;
      else map.V = digit;
    }
    if (map.A && map.B && map.V) return map;
  }
  return null;
}

export function extractOrderedSequence(script) {
  const cellChecks = [
    ...script.matchAll(
      /getElementById\(["']([^"']+)["']\)\.value\.trim\(\)/g,
    ),
  ].map((m) => m[1]);
  if (cellChecks.length >= 2) {
    const eqs = [...script.matchAll(/\b([a-z])\s*===\s*"(\d)"/gi)];
    if (eqs.length >= cellChecks.length) {
      return eqs.slice(0, cellChecks.length).map((x) => x[2]);
    }
  }

  const eqs = [...script.matchAll(/\b[a-z]\s*===\s*"(\d)"/gi)];
  if (eqs.length >= 2) return eqs.map((x) => x[1]);
  return null;
}

export function extractPeriodAnswer(script) {
  const correctArr = extractCorrectArray(script);
  if (correctArr?.length === 2) {
    return { X: correctArr[0], Y: correctArr[1] };
  }
  const xm = script.match(/\bx\s*===\s*"(\d+)"/);
  const ym = script.match(/\by\s*===\s*"(\d+)"/);
  if (xm && ym) return { X: xm[1], Y: ym[1] };
  return null;
}

export function extractFigure(taskBody) {
  const nucleus = extractNucleusFigure(taskBody);
  if (nucleus) return nucleus;
  return extractPeriodicCellFigure(taskBody);
}

function extractNucleusFigure(taskBody) {
  const start = taskBody.indexOf('<div class="oge-nucleus-wrap">');
  if (start === -1) return null;
  const afterOpen = taskBody.indexOf(">", start) + 1;
  const svgStart = taskBody.indexOf("<svg", afterOpen);
  const svgEnd = taskBody.indexOf("</svg>", svgStart);
  if (svgStart === -1 || svgEnd === -1) return null;
  const svgHtml = taskBody.slice(svgStart, svgEnd + "</svg>".length).trim();
  const tail = taskBody.slice(svgEnd);
  const caption = tail.match(/<p class="tip"[^>]*>([\s\S]*?)<\/p\s*>/);
  return {
    kind: "svg",
    html: svgHtml,
    captionHtml: caption ? caption[1].replace(/\s+/g, " ").trim() : null,
  };
}

function extractPeriodicCellFigure(taskBody) {
  const idx = taskBody.indexOf("inline-grid");
  if (idx === -1) return null;
  const start = taskBody.lastIndexOf("<div", idx);
  if (start === -1) return null;

  let depth = 1;
  let pos = start + 4;
  while (pos < taskBody.length) {
    const nextOpen = taskBody.indexOf("<div", pos);
    const nextClose = taskBody.indexOf("</div", pos);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      pos = nextOpen + 4;
      continue;
    }
    depth -= 1;
    const closeEnd = taskBody.indexOf(">", nextClose) + 1;
    pos = closeEnd;
    if (depth === 0) {
      return {
        kind: "periodicCell",
        html: taskBody.slice(start, closeEnd).trim(),
      };
    }
  }
  return null;
}

export function extractNumericAnswerValue(script) {
  let m = script.match(/\bn\s*===\s*(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);

  m = script.match(/Math\.round\(n\)\s*===\s*(\d+)/);
  if (m) return parseFloat(m[1]);

  m = script.match(/Math\.round\(n\s*\*\s*10\)\s*===\s*(\d+)/);
  if (m) return Number(m[1]) / 10;

  m = script.match(/Math\.round\(n\s*\*\s*100\)\s*===\s*(\d+)/);
  if (m) return Number(m[1]) / 100;

  m = script.match(/Math\.abs\(\s*n\s*-\s*(\d+(?:\.\d+)?)\s*\)/);
  if (m) return parseFloat(m[1]);

  return null;
}

export function extractSolution(taskBody) {
  const m = taskBody.match(
    /<details class="tip"[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/,
  );
  if (!m) return null;
  return {
    title: stripTags(m[1]).replace(/\s+/g, " ").trim(),
    html: m[2].trim(),
  };
}

export function stripInteractiveTail(taskBody) {
  const markers = [
    '<p style="margin-top: 16px">',
    '<p class="oge-answer-label">',
    '<table class="match-answer-table"',
    '<div class="oge-mass-table-wrap"',
    '<details class="tip"',
  ];
  let cut = taskBody.length;
  for (const marker of markers) {
    const i = taskBody.indexOf(marker);
    if (i !== -1 && i < cut) cut = i;
  }
  return taskBody.slice(0, cut).trim();
}

export function migrateRowToTask(row) {
  const filePath = resolveSourcePath(row);
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing source: ${filePath}`);
  }
  const html = fs.readFileSync(filePath, "utf8");
  const taskBody = getArticleTaskBody(html);
  const script = getScriptInner(html);
  const uiKind = expectedUiKind(row.type);
  const { intro } = splitIntroAndRest(taskBody);

  const task = {
    id: row.id,
    examType: row.type,
    uiKind,
    meta: {
      lead: extractLead(html),
      source: sourceLabel(row),
      sourceDir: row.sourceDir ?? "default",
    },
    blocks: introToBlocks(intro),
    content: {},
    answer: null,
    solution: null,
  };

  switch (uiKind) {
    case "twoChoice": {
      const statements = extractStatements(taskBody);
      const correct = extractCorrectArray(script);
      if (!correct || correct.length !== 2) {
        throw new Error("twoChoice: correct");
      }
      task.content = {
        statements,
        maxChoices: 2,
        cellCount: 2,
      };
      task.answer = {
        correct: correct.slice().sort((a, b) => Number(a) - Number(b)),
      };
      break;
    }
    case "matchTriple": {
      const match = extractMatchColumns(taskBody);
      const mapping = extractMatchMapping(script);
      if (!mapping) throw new Error("matchTriple: mapping");
      task.content = match;
      task.answer = { mapping };
      break;
    }
    case "orderedDigits": {
      const items = extractPlainListItems(taskBody);
      const cellCount = extractCellCount(taskBody);
      const sequence = extractOrderedSequence(script);
      if (!items.length || !cellCount || !sequence) {
        throw new Error("orderedDigits: parse");
      }
      task.content = { items, cellCount };
      task.answer = { sequence };
      break;
    }
    case "periodDiagram": {
      const figure = extractFigure(taskBody);
      const values = extractPeriodAnswer(script);
      if (!figure?.html || !values) throw new Error("periodDiagram: parse");
      let introHtml = intro;
      for (const marker of ['<div class="oge-nucleus-wrap">', "inline-grid"]) {
        const i = intro.indexOf(marker);
        if (i !== -1) {
          introHtml = intro.slice(0, i);
          break;
        }
      }
      task.blocks = introToBlocks(introHtml);
      task.content = {
        figure,
        labels: ["X", "Y"],
      };
      task.answer = { values };
      break;
    }
    case "multiChoiceFour": {
      const statements = extractStatements(taskBody);
      const correct = extractCorrectArray(script);
      if (statements.length !== 4 || !correct?.length) {
        throw new Error("multiChoiceFour: parse");
      }
      task.content = {
        statements,
        cellCount: 4,
      };
      task.answer = {
        correct: correct.slice().sort((a, b) => Number(a) - Number(b)),
      };
      break;
    }
    case "numericInt": {
      const value = extractNumericAnswerValue(script);
      if (value === null) throw new Error("numericInt: value");
      task.content = { unit: "%", showMassTable: false };
      task.answer = { value };
      break;
    }
    case "numericMassTable": {
      const value = extractNumericAnswerValue(script);
      if (value === null) throw new Error("numericMassTable: value");
      task.content = { unit: "г", showMassTable: true };
      task.answer = { value };
      break;
    }
    case "openReference":
    case "experimentOpen": {
      task.blocks = introToBlocks(stripInteractiveTail(taskBody));
      task.content =
        uiKind === "experimentOpen"
          ? { hasExperimentTable: taskBody.includes("oge-xy-table") }
          : {};
      task.solution = extractSolution(taskBody);
      if (!task.solution) throw new Error(`${uiKind}: solution`);
      break;
    }
    default:
      throw new Error(`unknown uiKind: ${uiKind}`);
  }

  return task;
}

export function loadRegistry() {
  const registry = JSON.parse(
    fs.readFileSync(path.join(root, "data", "oge-registry.json"), "utf8"),
  );
  return registry.examples ?? registry;
}
