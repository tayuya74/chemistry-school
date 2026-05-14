import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Подпись внизу страниц ex/ (простой абзац, без классов). */
const OGE_SOURCE_FOOTER_TEXT =
  "Демонстрационный вариант ОГЭ по химии 2026 года (ФИПИ).";

/** Убрать из текста задания отсылки к демоверсии — для страниц type-* (и тела ex до подписи). */
function stripOgeSourceFromPublicHtml(html) {
  if (!html) return html;
  return html
    .replace(
      /Экспериментальная задача \(демоверсия ОГЭ 2026\)/g,
      "Экспериментальная задача",
    )
    .replace(/\(демоверсия ОГЭ 2026\)/g, "")
    .replace(
      /Эталон ответа \(демоверсия ОГЭ 2026\)/g,
      "Эталон ответа",
    )
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
  return (
    script.slice(0, bodyStart) + innerReplacement + script.slice(j - 1)
  );
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

for (const row of registry.examples) {
  const { id, type } = row;
  const p = pad2(type);
  const srcPath = path.join(root, "data", "oge-source", `oge-${p}.html`);
  if (!fs.existsSync(srcPath)) {
    console.error("Нет файла", srcPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(srcPath, "utf8");
  const typeHtml = rewriteLinksForType(raw);
  const articleMatch = typeHtml.match(
    /<article class="card">([\s\S]*?)<\/article>/,
  );
  if (!articleMatch) {
    throw new Error(`article: oge-${p}`);
  }
  const { prefix, taskBody } = splitAtLead(articleMatch[1]);
  const prefixClean = stripOgeSourceFromPublicHtml(prefix);
  const taskBodyClean = stripOgeSourceFromPublicHtml(taskBody);
  const insert = `      <h3 class="oge-example-title" id="oge-ex-title-${id}"><a class="oge-task-seq" href="ex/${id}.html">Задание ${type} № ${id}</a></h3>
      <div class="oge-subtask" id="oge-ex-${id}">
${taskBodyClean
  .split("\n")
  .map((line) => (line ? `        ${line}` : line))
  .join("\n")}
      </div>`;
  const typeArticleInner = `${prefixClean}\n${insert}`;
  const outType = replaceArticle(typeHtml, typeArticleInner.trimStart());
  fs.writeFileSync(path.join(ogeDir, `type-${p}.html`), outType, "utf8");

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
  const exArticle = `      <p><a href="../index.html">← К списку заданий ОГЭ</a> · <a href="../type-${p}.html">Задание ${type}</a></p>
      <nav class="oge-task-nav" aria-label="Соседние типы заданий ОГЭ">
        ${prevLink}
        ${nextLink}
      </nav>
      <h2>Задание ${type} № ${id}</h2>
      ${leadClean}

      ${exTaskClean}

      <p>Источник: ${OGE_SOURCE_FOOTER_TEXT}</p>`;
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

console.log("Готово: pages/oge/type-*.html и pages/oge/ex/*.html");
