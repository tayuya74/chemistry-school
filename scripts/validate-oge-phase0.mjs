import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expectedUiKind } from "./oge-ui-kind-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function resolveSourcePath(row) {
  const dir = row.sourceDir ? row.sourceDir : "default";
  return path.join(root, "data", "oge-source", dir, `oge-${pad2(row.type)}.html`);
}

/** Определить uiKind по разметке и скриптам HTML-шаблона. */
function detectUiKind(html, examType) {
  if (examType === 23) return "experimentOpen";
  if (examType >= 20 && examType <= 22) return "openReference";

  if (html.includes("oge-mass-table")) return "numericMassTable";
  if (
    html.includes("OGE_eachMultiChoiceScope") ||
    html.includes("OGE_multiChoiceAllOk")
  ) {
    return "multiChoiceFour";
  }
  if (
    html.includes("oge-nucleus-wrap") ||
    (html.includes("oge-xy-table") &&
      html.includes("ansX") &&
      html.includes("ansY"))
  ) {
    return "periodDiagram";
  }
  if (html.includes("match-columns") && html.includes("match-answer-table")) {
    return "matchTriple";
  }
  if (
    html.includes("OGE_eachTwoChoiceScope") ||
    html.includes("OGE_twoChoiceAllOk")
  ) {
    return "twoChoice";
  }
  if (
    html.includes("oge-answer-cells") &&
    !html.includes('class="oge-statements"')
  ) {
    return "orderedDigits";
  }
  if (html.includes("oge-answer-input") && html.includes("checkBtn")) {
    return examType === 19 ? "numericMassTable" : "numericInt";
  }
  if (html.includes("<details") && !html.includes("checkBtn")) {
    return examType === 23 ? "experimentOpen" : "openReference";
  }

  return "unknown";
}

function countStatementCheckboxes(html) {
  const block = html.match(/<ol class="oge-statements">[\s\S]*?<\/ol>/);
  if (!block) return null;
  return (block[0].match(/type="checkbox"/g) || []).length;
}

function countAnswerCells(html) {
  const block = html.match(/class="oge-answer-cells"[\s\S]*?<\/div>/);
  if (!block) return null;
  return (block[0].match(/<input/g) || []).length;
}

function countMatchRightOptions(html) {
  const m = html.match(/<div class="match-columns">[\s\S]*?<\/div>\s*<div>/);
  if (!m) return null;
  const secondCol = html.match(
    /class="match-columns">[\s\S]*?<\/div>\s*<div>[\s\S]*?<ul class="oge-match-plain">([\s\S]*?)<\/ul>/,
  );
  if (!secondCol) return null;
  return (secondCol[1].match(/<li>/g) || []).length;
}

function extractCorrectArray(html) {
  const m = html.match(/const\s+correct\s*=\s*\[([^\]]*)\]/);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
}

function classifyNumericCheck(html) {
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/g);
  if (!script) return "none";
  const body = script.join("\n");
  if (/n\s*===\s*-?\d/.test(body) || /n\s*===\s*\d/.test(body)) {
    return "strict";
  }
  if (body.includes("Math.abs")) return "tolerance";
  if (body.includes("Math.round")) return "rounded";
  return "other";
}

function analyzeTask(row) {
  const filePath = resolveSourcePath(row);
  const relPath = path.relative(root, filePath);

  if (!fs.existsSync(filePath)) {
    return {
      id: row.id,
      examType: row.type,
      sourceDir: row.sourceDir ?? "default",
      file: relPath,
      error: "file_missing",
    };
  }

  const html = fs.readFileSync(filePath, "utf8");
  const expected = expectedUiKind(row.type);
  const detected = detectUiKind(html, row.type);

  const details = {
    statementCount: countStatementCheckboxes(html),
    answerCellCount: countAnswerCells(html),
    matchRightCount: countMatchRightOptions(html),
    correct: extractCorrectArray(html),
    numericCheck: null,
  };

  if (row.type === 18 || row.type === 19) {
    details.numericCheck = classifyNumericCheck(html);
  }

  const issues = [];

  if (detected !== expected) {
    issues.push(`uiKind: ожидался ${expected}, обнаружен ${detected}`);
  }

  if (expected === "twoChoice") {
    if (details.statementCount != null && details.statementCount < 2) {
      issues.push(`twoChoice: мало пунктов (${details.statementCount})`);
    }
    if (details.answerCellCount !== 2) {
      issues.push(`twoChoice: ячеек ${details.answerCellCount}, нужно 2`);
    }
    if (details.correct && details.correct.length !== 2) {
      issues.push(
        `twoChoice: в correct ${details.correct.length} знач., нужно 2`,
      );
    }
  }

  if (expected === "multiChoiceFour") {
    if (details.statementCount !== 4) {
      issues.push(`multiChoiceFour: суждений ${details.statementCount}, нужно 4`);
    }
    if (details.answerCellCount !== 4) {
      issues.push(`multiChoiceFour: ячеек ${details.answerCellCount}, нужно 4`);
    }
    if (details.correct) {
      const n = details.correct.length;
      if (n < 1 || n > 4) {
        issues.push(`multiChoiceFour: correct.length=${n}, допустимо 1–4`);
      }
    }
  }

  if (expected === "matchTriple" && details.matchRightCount != null) {
    if (details.matchRightCount < 2) {
      issues.push(`matchTriple: мало вариантов справа (${details.matchRightCount})`);
    }
  }

  if (
    (row.type === 18 || row.type === 19) &&
    details.numericCheck &&
    details.numericCheck !== "strict"
  ) {
    issues.push(
      `numeric: проверка «${details.numericCheck}», целевое правило — strict (n === value)`,
    );
  }

  return {
    id: row.id,
    examType: row.type,
    sourceDir: row.sourceDir ?? "default",
    file: relPath,
    expectedUiKind: expected,
    detectedUiKind: detected,
    ok: issues.length === 0,
    issues,
    details,
  };
}

function summarizeByExamType(results) {
  const byType = new Map();
  for (const r of results) {
    if (r.error) continue;
    if (!byType.has(r.examType)) {
      byType.set(r.examType, {
        examType: r.examType,
        expectedUiKind: r.expectedUiKind,
        detectedUiKinds: new Set(),
        count: 0,
        issues: 0,
        statementCounts: new Set(),
        matchRightCounts: new Set(),
        correctLengths: new Set(),
        legacyNumericChecks: new Set(),
      });
    }
    const s = byType.get(r.examType);
    s.count++;
    s.detectedUiKinds.add(r.detectedUiKind);
    if (!r.ok) s.issues++;
    if (r.details.statementCount != null) {
      s.statementCounts.add(r.details.statementCount);
    }
    if (r.details.matchRightCount != null) {
      s.matchRightCounts.add(r.details.matchRightCount);
    }
    if (r.details.correct) {
      s.correctLengths.add(r.details.correct.length);
    }
    if (r.details.numericCheck) {
      s.legacyNumericChecks.add(r.details.numericCheck);
    }
  }

  return [...byType.values()]
    .sort((a, b) => a.examType - b.examType)
    .map((s) => ({
      examType: s.examType,
      expectedUiKind: s.expectedUiKind,
      detectedUiKinds: [...s.detectedUiKinds].sort(),
      examples: s.count,
      failedExamples: s.issues,
      consistent:
        s.detectedUiKinds.size === 1 &&
        [...s.detectedUiKinds][0] === s.expectedUiKind,
      statementCounts: [...s.statementCounts].sort((a, b) => a - b),
      matchRightCounts: [...s.matchRightCounts].sort((a, b) => a - b),
      correctLengths: [...s.correctLengths].sort((a, b) => a - b),
      legacyNumericChecks: [...s.legacyNumericChecks].sort(),
    }));
}

function buildMarkdownReport(report) {
  const lines = [
    "# Фаза 0: автопроверка карты uiKind",
    "",
    `Сгенерировано: \`${report.generatedAt}\``,
    "",
    "## Итог",
    "",
    `- Заданий в реестре: **${report.totalTasks}**`,
    `- Без ошибок чтения: **${report.analyzed}**`,
    `- **Карта uiKind:** ${report.uiKindConfirmed ? "✓ **подтверждена** (все 276 HTML совпадают с TASK-TYPES.md)" : "✗ есть расхождения"}`,
    `- Расхождений uiKind: **${report.uiKindMismatchCount}**`,
    `- Legacy-проверка чисел (18/19): **${report.numericLegacyCount}** заданий (исправится при миграции)`,
    `- Прочие замечания: **${report.otherIssueCount}**`,
    `- Пропущено (нет файла): **${report.missingFiles}**`,
    "",
    "## По типам экзамена (1–23)",
    "",
    "| Тип | uiKind | Примеров | OK | Шаблоны в HTML | Пунктов / справа | correct (16) | Проверка 18/19 |",
    "|----:|--------|--------:|---:|----------------|------------------|--------------|----------------|",
  ];

  for (const s of report.byExamType) {
    const okMark =
      s.failedExamples === 0 && s.consistent
        ? "✓"
        : s.consistent
          ? "~"
          : "✗";
    const stmt =
      s.statementCounts.length > 0 ? s.statementCounts.join(", ") : "—";
    const match =
      s.matchRightCounts.length > 0 ? s.matchRightCounts.join(", ") : "—";
    const corr =
      s.correctLengths.length > 0 ? s.correctLengths.join(", ") : "—";
    const num =
      s.legacyNumericChecks.length > 0
        ? s.legacyNumericChecks.join(", ")
        : "—";
    lines.push(
      `| ${s.examType} | \`${s.expectedUiKind}\` | ${s.examples} | ${okMark} | ${s.detectedUiKinds.join(", ")} | ${stmt} / ${match} | ${corr} | ${num} |`,
    );
  }

  const bad = report.tasks.filter(
    (t) =>
      t.error ||
      t.detectedUiKind !== t.expectedUiKind ||
      t.issues.some((i) => !i.startsWith("numeric:")),
  );
  const numericOnly = report.tasks.filter(
    (t) =>
      !t.error &&
      t.detectedUiKind === t.expectedUiKind &&
      t.issues.length > 0 &&
      t.issues.every((i) => i.startsWith("numeric:")),
  );

  if (bad.length > 0) {
    lines.push("", "## Задания с замечаниями (не numeric)", "");
    for (const t of bad.slice(0, 50)) {
      lines.push(
        `- **№ ${t.id}** (тип ${t.examType}, ${t.sourceDir}): ${t.error ?? t.issues.join("; ")}`,
      );
    }
    if (bad.length > 50) {
      lines.push(`- … и ещё ${bad.length - 50}`);
    }
  }

  if (numericOnly.length > 0) {
    lines.push(
      "",
      "## Legacy-проверка чисел (типы 18–19)",
      "",
      `Заданий: **${numericOnly.length}**. В HTML ещё \`Math.round\` / допуски; при миграции заменить на strict (\`n === value\`).`,
      "",
    );
    for (const t of numericOnly.slice(0, 10)) {
      lines.push(`- № ${t.id} (тип ${t.examType}): ${t.issues[0]}`);
    }
    if (numericOnly.length > 10) {
      lines.push(`- … и ещё ${numericOnly.length - 10}`);
    }
  }

  lines.push(
    "",
    "## Примечание",
    "",
    "Замечания `numeric: … rounded/tolerance` — в **текущих HTML** ещё не strict-сравнение; целевое правило для миграции — `n === value` (см. TASK-TYPES.md).",
    "",
    "Перезапуск: `npm run validate:oge-phase0`",
  );

  return lines.join("\n");
}

function main() {
  const registryPath = path.join(root, "data", "oge-registry.json");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const rows = registry.examples ?? registry;

  const results = rows.map(analyzeTask);
  const passed = results.filter((r) => r.ok && !r.error).length;
  const failed = results.filter((r) => !r.ok && !r.error).length;
  const missingFiles = results.filter((r) => r.error === "file_missing").length;

  const uiKindIssues = results.filter(
    (r) => !r.error && r.detectedUiKind !== r.expectedUiKind,
  );
  const numericLegacyIssues = results.filter(
    (r) =>
      !r.error &&
      r.issues.some((i) => i.startsWith("numeric:")) &&
      r.detectedUiKind === r.expectedUiKind,
  );
  const otherIssues = results.filter(
    (r) =>
      !r.ok &&
      !r.error &&
      r.detectedUiKind === r.expectedUiKind &&
      !r.issues.every((i) => i.startsWith("numeric:")),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    totalTasks: results.length,
    analyzed: results.length - missingFiles,
    passed,
    failed,
    missingFiles,
    uiKindConfirmed: uiKindIssues.length === 0 && missingFiles === 0,
    uiKindMismatchCount: uiKindIssues.length,
    numericLegacyCount: numericLegacyIssues.length,
    otherIssueCount: otherIssues.length,
    byExamType: summarizeByExamType(results),
    tasks: results,
  };

  const outDir = path.join(root, "data", "oge");
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, "phase-0-report.json");
  const mdPath = path.join(outDir, "phase-0-report.md");

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(mdPath, buildMarkdownReport(report) + "\n", "utf8");

  console.log(`Проверено заданий: ${report.totalTasks}`);
  console.log(
    `Карта uiKind: ${report.uiKindConfirmed ? "OK" : "ОШИБКА"} (${report.uiKindMismatchCount} расхождений)`,
  );
  console.log(
    `Legacy numeric 18/19: ${report.numericLegacyCount} (исправится при миграции)`,
  );
  console.log(`Отчёт: ${path.relative(root, mdPath)}`);

  for (const s of report.byExamType) {
    if (!s.consistent) {
      console.log(
        `  тип ${s.examType}: uiKind=${s.expectedUiKind}, detected=${s.detectedUiKinds.join("/")}`,
      );
    }
  }

  process.exit(
    report.uiKindMismatchCount + report.missingFiles + report.otherIssueCount >
      0
      ? 1
      : 0,
  );
}

main();
