import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const FOOTER_2026 = "Демонстрационный вариант ОГЭ по химии 2026 года (ФИПИ).";
const FOOTER_2025 = "Демонстрационный вариант ОГЭ по химии 2025 года (ФИПИ).";
const FOOTER_VARIANT_1 =
  "ОГЭ. Типовые экзаменационные варианты, вариант 1 (Издательство «Национальное образование», 2025).";
const FOOTER_VARIANT_2 =
  "ОГЭ. Типовые экзаменационные варианты, вариант 2 (Издательство «Национальное образование», 2025).";

/** Записи без sourceDir — демо 2025 (ФИПИ), шаблоны в data/oge-source/default/ */
function resolveSourcePath(row, paddedType) {
  const dir = row.sourceDir ? row.sourceDir : "default";
  return path.join(root, "data", "oge-source", dir, `oge-${paddedType}.html`);
}

/** Подпись «Источник» на страницах ex/ */
function footerForRow(row) {
  if (row.sourceFooter) return row.sourceFooter;
  if (row.sourceDir === "2026-demo") return FOOTER_2026;
  if (row.sourceDir === "variant-1") return FOOTER_VARIANT_1;
  if (row.sourceDir === "variant-2") return FOOTER_VARIANT_2;
  return FOOTER_2025;
}

/** Порядок на странице типа: демо 2026, вариант 1, вариант 2, корень (демо 2025); внутри по id */
function rowSortPriority(row) {
  if (row.sourceDir === "2026-demo") return 0;
  if (row.sourceDir === "variant-1") return 1;
  if (row.sourceDir === "variant-2") return 2;
  return 3;
}

function sortRowsForType(rows) {
  return rows.slice().sort((a, b) => {
    const ap = rowSortPriority(a);
    const bp = rowSortPriority(b);
    if (ap !== bp) return ap - bp;
    return a.id - b.id;
  });
}

/** Уникальные id на странице типа при нескольких примерах одного номера */
function suffixHtmlIds(html, idSuffix) {
  if (!idSuffix) return html;
  return html.replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-${idSuffix}"`);
}

function suffixScriptDomIds(script, idSuffix) {
  if (!idSuffix || !script) return script;
  return script.replace(
    /getElementById\(\s*(['"])([^'"]+)\1\s*\)/g,
    (_, q, id) => `getElementById(${q}${id}-${idSuffix}${q})`,
  );
}

function stripScriptsAfterMain(html) {
  return html.replace(
    /<\/main>\s*(?:<script>[\s\S]*?<\/script>\s*)+/g,
    "</main>\n",
  );
}

/** Убрать из текста задания отсылки к демоверсии — для страниц type-* (и тела ex до подписи). */
function stripOgeSourceFromPublicHtml(html) {
  if (!html) return html;
  return html
    .replace(
      /Экспериментальная задача \(демоверсия ОГЭ 2026\)/g,
      "Экспериментальная задача",
    )
    .replace(
      /Экспериментальная задача \(демоверсия ОГЭ 2025\)/g,
      "Экспериментальная задача",
    )
    .replace(/\(демоверсия ОГЭ 2026\)/g, "")
    .replace(/Эталон ответа \(демоверсия ОГЭ 2026\)/g, "Эталон ответа")
    .replace(/\(демоверсия ОГЭ 2025\)/g, "")
    .replace(/Эталон ответа \(демоверсия ОГЭ 2025\)/g, "Эталон ответа")
    .replace(/\(\s*по демоверсии:\s*/gi, "(")
    .replace(/В официальном ключе демоверсии/gi, "В официальном ключе")
    .replace(
      /(Ниже — текст задания из)\s*демонстрационного варианта/gi,
      "$1 варианта",
    );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function rewriteLinksForType(html) {
  return html
    .replace(/href="css\//g, 'href="../../css/')
    .replace(/src="js\//g, 'src="../../js/')
    .replace(/href="index\.html"/g, 'href="../../index.html"')
    .replace(/href="topics\.html"/g, 'href="../topics/index.html"')
    .replace(/href="tables\.html"/g, 'href="../tables.html"')
    .replace(/href="oge\.html"/g, 'href="index.html"')
    .replace(/href="oge-(\d{2})\.html"/g, (_, d) => `href="type-${d}.html"`);
}

function rewriteLinksForEx(html) {
  return html
    .replace(/href="css\//g, 'href="../../../css/')
    .replace(/src="js\//g, 'src="../../../js/')
    .replace(/href="index\.html"/g, 'href="../../../index.html"')
    .replace(/href="topics\.html"/g, 'href="../../topics/index.html"')
    .replace(/href="tables\.html"/g, 'href="../../tables.html"')
    .replace(/href="oge\.html"/g, 'href="../index.html"')
    .replace(/href="oge-(\d{2})\.html"/g, (_, d) => `href="../type-${d}.html"`);
}

function splitAtLead(articleInner) {
  const m = articleInner.match(
    /^([\s\S]*<p class="lead">[\s\S]*?<\/p>)([\s\S]*)$/,
  );
  if (!m) {
    throw new Error("Не найден блок lead в article");
  }
  return { prefix: m[1].replace(/\s+$/, "\n"), taskBody: m[2].trim() };
}

function extractLeadParagraph(prefix) {
  const m = prefix.match(/<p class="lead">[\s\S]*?<\/p>/);
  if (!m) {
    throw new Error("lead");
  }
  return m[0];
}

function extractScriptsAfterArticle(html) {
  const idx = html.indexOf("</article>");
  if (idx === -1) {
    return "";
  }
  const tail = html.slice(idx + "</article>".length);
  const scripts = [];
  const re = /<script>[\s\S]*?<\/script>/gi;
  let mm;
  while ((mm = re.exec(tail)) !== null) {
    scripts.push(mm[0]);
  }
  return scripts.join("\n  ");
}

function replaceArticle(html, newArticleInner) {
  return html.replace(
    /<article class="card">[\s\S]*?<\/article>/,
    `<article class="card">\n${newArticleInner}\n    </article>`,
  );
}

/** Первый блок результата (кнопка «Проверить» / статус) */
function extractResultElementId(html) {
  const m = html.match(/<p id="([^"]+)" class="result"/);
  return m ? m[1] : "resultOut";
}

/** Извлечь правильные фрагменты ответа из inline-скрипта задания ОГЭ (как в условии: цифры подряд). */
function extractAnswerPartsFromOgeScript(scr) {
  let m = scr.match(/(?:const|let|var)\s+correct\s*=\s*\[([^\]]*)\]/);
  if (m) {
    const parts = [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
    if (parts.length) return parts;
  }
  m = scr.match(/Math\.round\(n\)\s*===\s*(\d+)/);
  if (m) return [m[1]];
  m = scr.match(/\bn\s*===\s*(\d+)\s*;/);
  if (m) return [m[1]];
  m = scr.match(/Math\.round\(n\s*\*\s*10\)\s*===\s*(\d+)/);
  if (m) {
    const val = Number(m[1]) / 10;
    return [String(val).replace(".", ",")];
  }
  m = scr.match(/\b(?:s|sorted)\s*===\s*"(\d{2})"/);
  if (m) return m[1].split("");
  m = scr.match(/(?:const|let|var)\s+ok\s*=\s*([^;]+);/);
  if (m) {
    const expr = m[1].trim();
    const eqs = [...expr.matchAll(/(\w+)\s*===\s*"([^"]*)"/g)];
    if (
      eqs.length === 1 &&
      eqs[0][2].length === 2 &&
      /^\d{2}$/.test(eqs[0][2])
    ) {
      return eqs[0][2].split("");
    }
    if (eqs.length >= 2) return eqs.map((x) => x[2]);
  }
  return null;
}

function getFirstInlineScriptInnerAfterArticle(html) {
  const idx = html.indexOf("</article>");
  if (idx === -1) {
    return "";
  }
  const tail = html.slice(idx);
  const m = tail.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  return m ? m[1] : "";
}

/** Для списков с чекбоксами и лимитом выбора (число совпадает с длиной ключа correct). */
function extractCheckboxLimitFromRaw(raw) {
  const scr = getFirstInlineScriptInnerAfterArticle(raw);
  const m = scr.match(/(?:const|let|var)\s+correct\s*=\s*\[([^\]]*)\]/);
  if (!m) return null;
  const parts = [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
  if (parts.length < 2) return null;
  const articleMatch = raw.match(/<article class="card">([\s\S]*?)<\/article>/);
  if (!articleMatch) return null;
  let taskBody;
  try {
    taskBody = splitAtLead(articleMatch[1]).taskBody;
  } catch {
    return null;
  }
  if (
    !taskBody.includes("oge-statements") ||
    !taskBody.includes('type="checkbox"')
  ) {
    return null;
  }
  return parts.length;
}

/** Задания с двумя верными и OGE_twoChoiceAllOk — для делегированной проверки на странице типа. */
function extractTwoChoiceMetaFromRaw(raw) {
  const scr = getFirstInlineScriptInnerAfterArticle(raw);
  if (!scr.includes("OGE_twoChoiceAllOk")) return null;
  const mCorrect = scr.match(/(?:const|let|var)\s+correct\s*=\s*\[([^\]]*)\]/);
  if (!mCorrect) return null;
  const parts = [...mCorrect[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
  if (parts.length !== 2) return null;
  let optionCount = null;
  const mOpt = scr.match(/OGE_twoChoiceAllOk\s*\([\s\S]*?,\s*(\d+)\s*\)\s*;/);
  if (mOpt) optionCount = Number(mOpt[1]);
  const mScope = scr.match(
    /OGE_eachTwoChoiceScope\s*\(\s*correct\s*,\s*(\d+)\s*,/,
  );
  if (mScope) optionCount = Number(mScope[1]);
  if (optionCount === null) return null;
  const articleMatch = raw.match(/<article class="card">([\s\S]*?)<\/article>/);
  if (!articleMatch) return null;
  try {
    const taskBody = splitAtLead(articleMatch[1]).taskBody;
    if (
      !taskBody.includes("oge-statements") ||
      !taskBody.includes('type="checkbox"')
    ) {
      return null;
    }
  } catch {
    return null;
  }
  const sorted = parts.slice().sort((a, b) => Number(a) - Number(b));
  return { correct: sorted, optionCount };
}

/** Задание 16: только чекбоксы, сверка через sorted === exp. */
function extractSortedCheckboxCorrectFromRaw(raw) {
  const scr = getFirstInlineScriptInnerAfterArticle(raw);
  if (scr.includes("OGE_twoChoiceAllOk")) return null;
  if (!scr.includes("sorted === exp")) return null;
  const mCorrect = scr.match(/(?:const|let|var)\s+correct\s*=\s*\[([^\]]*)\]/);
  if (!mCorrect) return null;
  const parts = [...mCorrect[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
  if (parts.length < 2) return null;
  const articleMatch = raw.match(/<article class="card">([\s\S]*?)<\/article>/);
  if (!articleMatch) return null;
  try {
    const taskBody = splitAtLead(articleMatch[1]).taskBody;
    if (
      !taskBody.includes("oge-statements") ||
      !taskBody.includes('type="checkbox"')
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return parts.slice().sort((a, b) => Number(a) - Number(b));
}

function attrsForOgeInteractivity(raw) {
  const parts = [];
  const chkMax = extractCheckboxLimitFromRaw(raw);
  if (chkMax !== null && chkMax !== undefined) {
    parts.push(`data-oge-checkbox-max="${chkMax}"`);
  }
  const tc = extractTwoChoiceMetaFromRaw(raw);
  if (tc !== null) {
    parts.push(`data-oge-two-choice-correct="${tc.correct.join("|")}"`);
    parts.push(`data-oge-option-count="${tc.optionCount}"`);
  }
  const sc = extractSortedCheckboxCorrectFromRaw(raw);
  if (sc !== null && sc.length) {
    parts.push(`data-oge-sorted-correct="${sc.join("|")}"`);
  }
  return parts.length ? ` ${parts.join(" ")}` : "";
}

/** Заменить тело первого обработчика addEventListener("click", function () { … }) */
function replaceFirstClickHandlerBody(script, innerReplacement) {
  const needle = 'addEventListener("click", function () {';
  const i = script.indexOf(needle);
  if (i === -1) {
    return script;
  }
  const bodyStart = i + needle.length;
  let depth = 1;
  let j = bodyStart;
  while (j < script.length && depth > 0) {
    const ch = script[j];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    j += 1;
  }
  if (depth !== 0) {
    return script;
  }
  return script.slice(0, bodyStart) + innerReplacement + script.slice(j - 1);
}

function buildExPageInlineScript(raw) {
  const scrInner = getFirstInlineScriptInnerAfterArticle(raw);
  if (!scrInner || !scrInner.includes('addEventListener("click"')) {
    return null;
  }
  const parts = extractAnswerPartsFromOgeScript(scrInner);
  if (!parts) {
    console.warn(
      "Не удалось извлечь ответ для ex-страницы, скрипт без изменений",
    );
    return null;
  }
  const resultId = extractResultElementId(raw);
  const inner = `\n          const out = document.getElementById(${JSON.stringify(resultId)});\n          if (out) out.textContent = OGE_EX_formatAnswer(${JSON.stringify(parts)});\n        `;
  const patched = replaceFirstClickHandlerBody(scrInner, inner);
  return `<script>\n      ${patched.trim()}\n    </script>`;
}

const registry = JSON.parse(
  fs.readFileSync(path.join(root, "data", "oge-registry.json"), "utf8"),
);

const ogeDir = path.join(root, "pages", "oge");
const exDir = path.join(ogeDir, "ex");
fs.mkdirSync(exDir, { recursive: true });

const byType = new Map();
for (const row of registry.examples) {
  const { type } = row;
  if (!byType.has(type)) byType.set(type, []);
  byType.get(type).push(row);
}

for (let type = 1; type <= 23; type++) {
  const rowsRaw = byType.get(type);
  if (!rowsRaw || !rowsRaw.length) continue;
  const rows = sortRowsForType(rowsRaw);
  const p = pad2(type);

  const firstPath = resolveSourcePath(rows[0], p);
  if (!fs.existsSync(firstPath)) {
    console.error("Нет файла", firstPath);
    process.exit(1);
  }
  const firstRaw = fs.readFileSync(firstPath, "utf8");
  const typeHtmlBase = rewriteLinksForType(firstRaw);
  const articleMatchBase = typeHtmlBase.match(
    /<article class="card">([\s\S]*?)<\/article>/,
  );
  if (!articleMatchBase) {
    throw new Error(`article: ${firstPath}`);
  }
  const { prefix } = splitAtLead(articleMatchBase[1]);
  const prefixClean = stripOgeSourceFromPublicHtml(prefix);

  let inserts = "";
  let typePageScripts = "";
  for (const row of rows) {
    const srcPath = resolveSourcePath(row, p);
    if (!fs.existsSync(srcPath)) {
      console.error("Нет файла", srcPath);
      process.exit(1);
    }
    const raw = fs.readFileSync(srcPath, "utf8");
    const typeHtml = rewriteLinksForType(raw);
    const articleMatch = typeHtml.match(
      /<article class="card">([\s\S]*?)<\/article>/,
    );
    const { taskBody } = splitAtLead(articleMatch[1]);
    const taskBodyClean = stripOgeSourceFromPublicHtml(taskBody);
    const interactivityAttrs = attrsForOgeInteractivity(raw);
    const { id } = row;
    const taskBodyForType = suffixHtmlIds(taskBodyClean, id);
    inserts += `${inserts ? "\n" : ""}      <h3 class="oge-example-title" id="oge-ex-title-${id}"><a class="oge-task-seq" href="ex/${id}.html">Задание ${type} № ${id}</a></h3>
      <div class="oge-subtask" id="oge-ex-${id}"${interactivityAttrs}>
${taskBodyForType
  .split("\n")
  .map((line) => (line ? `        ${line}` : line))
  .join("\n")}
      </div>`;
    const rowScr = extractScriptsAfterArticle(raw);
    if (rowScr) {
      typePageScripts += suffixScriptDomIds(rowScr, id) + "\n  ";
    }
  }

  const typeArticleInner = `${prefixClean}\n${inserts.trimEnd()}`;
  let outType = replaceArticle(typeHtmlBase, typeArticleInner.trimStart());
  outType = stripScriptsAfterMain(outType);
  if (typePageScripts.trim()) {
    outType = outType.replace(
      "</body>",
      `  ${typePageScripts.trim()}\n</body>`,
    );
  }
  fs.writeFileSync(path.join(ogeDir, `type-${p}.html`), outType, "utf8");

  for (const row of rows) {
    const { id } = row;
    const srcPath = resolveSourcePath(row, p);
    const raw = fs.readFileSync(srcPath, "utf8");
    const footerText = footerForRow(row);

    const exHtml0 = rewriteLinksForEx(raw);
    let exHtml = exHtml0.replace(/<title>([^<]*)<\/title>/, (__, t) => {
      const ins = t.replace(/^(ОГЭ, задание \d+)/, `$1 № ${id}`);
      return `<title>${ins}</title>`;
    });
    const exArticleMatch = exHtml.match(
      /<article class="card">([\s\S]*?)<\/article>/,
    );
    const inner = exArticleMatch[1];
    const { prefix: exPrefix, taskBody: exTask } = splitAtLead(inner);
    const lead = extractLeadParagraph(exPrefix);
    const leadClean = stripOgeSourceFromPublicHtml(lead);
    const exTaskClean = stripOgeSourceFromPublicHtml(exTask);
    const prevP = type > 1 ? pad2(type - 1) : null;
    const nextP = type < 23 ? pad2(type + 1) : null;
    const prevLink = prevP
      ? `<a href="../type-${prevP}.html">← Задание ${type - 1}</a>`
      : `<a href="../index.html">← К списку</a>`;
    const nextLink = nextP
      ? `<a class="oge-task-nav__next" href="../type-${nextP}.html">Задание ${type + 1} →</a>`
      : `<a class="oge-task-nav__next" href="../index.html">К списку заданий →</a>`;
    const exInteractivityAttrs = attrsForOgeInteractivity(raw);
    const exTaskWrapped =
      exInteractivityAttrs.trim() !== ""
        ? `<div class="oge-subtask"${exInteractivityAttrs}>\n${exTaskClean}\n      </div>`
        : exTaskClean;
    const exArticle = `      <p><a href="../index.html">← К списку заданий ОГЭ</a> · <a href="../type-${p}.html">Задание ${type}</a></p>
      <nav class="oge-task-nav" aria-label="Соседние типы заданий ОГЭ">
        ${prevLink}
        ${nextLink}
      </nav>
      <h2>Задание ${type} № ${id}</h2>
      ${leadClean}

      ${exTaskWrapped}

      <p>Источник: ${footerText}</p>`;
    exHtml = replaceArticle(exHtml, exArticle.trimStart());
    exHtml = exHtml.replace(
      /<\/main>\s*(?:<script>[\s\S]*?<\/script>\s*)+/g,
      "</main>\n",
    );
    const exReveal = buildExPageInlineScript(raw);
    const exScr = exReveal ?? extractScriptsAfterArticle(raw);
    if (exReveal) {
      exHtml = exHtml.replace(/>Проверить</g, ">Ответ<");
    }
    if (exScr) {
      exHtml = exHtml.replace("</body>", `  ${exScr}\n</body>`);
    }
    fs.writeFileSync(path.join(exDir, `${id}.html`), exHtml, "utf8");
    console.log("OK", `type-${p}.html`, `ex/${id}.html`);
  }
}

console.log("Готово: pages/oge/type-*.html и pages/oge/ex/*.html");
