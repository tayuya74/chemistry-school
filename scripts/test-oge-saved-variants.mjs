import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(
  new URL("../js/oge-task-builder.js", import.meta.url),
  "utf8",
).replace(
  "  function init() {",
  "  window.testApi = { validIds, readSavedVariants, variantUrl, buildSaveControls, buildFull };\n  function init() {",
);

function setup(initial = "[]") {
  let stored = initial;
  let blocked = false;
  class Element {
    children = [];
    events = {};
    textContent = "";
    append(...items) {
      this.children.push(...items);
    }
    appendChild(item) {
      this.append(item);
    }
    addEventListener(name, fn) {
      this.events[name] = fn;
    }
    setAttribute() {}
    querySelector() {
      return null;
    }
    remove() {}
  }
  const window = {
    location: {
      href: "https://example.com/chemistry-school/pages/oge/index.html",
    },
    OGE_RENDER: { buildSubtaskHtml: () => "" },
  };
  const document = {
    readyState: "loading",
    addEventListener() {},
    createElement: () => new Element(),
    getElementById: () => null,
  };
  const storage = {
    getItem: () => stored,
    setItem(key, value) {
      if (blocked) throw new Error("Quota exceeded");
      stored = value;
    },
  };
  const loadedIds = [];
  const index = [
    { id: 1001, examType: 1 },
    { id: 1002, examType: 2 },
  ];
  const fetch = async (url) => {
    const match = url.match(/(\d+)\.json$/);
    if (!match) return { ok: true, json: async () => index };
    const id = Number(match[1]);
    loadedIds.push(id);
    return { ok: true, json: async () => ({ id, meta: { lead: "Условие" } }) };
  };
  runInNewContext(source, {
    window,
    document,
    localStorage: storage,
    URL,
    URLSearchParams,
    navigator: {},
    fetch,
    Date,
    Math,
    Map,
    Set,
  });
  return {
    api: window.testApi,
    Element,
    loadedIds,
    stored: () => stored,
    block: () => {
      blocked = true;
    },
  };
}

test("Сохранение переживает новый сеанс и не создаёт дубль при повторном нажатии", () => {
  const env = setup();
  const form = env.api.buildSaveControls([1002, 1001], "9А — домашняя работа");
  form.events.submit({ preventDefault() {} });
  form.events.submit({ preventDefault() {} });
  const saved = setup(env.stored()).api.readSavedVariants();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].title, "9А — домашняя работа");
  assert.equal(saved[0].ids.join(","), "1002,1001");
});

test("Ссылка содержит точный порядок и корректно кодирует название", () => {
  const env = setup();
  const title = "9А & 9Б # домашняя работа";
  const url = new URL(env.api.variantUrl([1002, 1001], title));
  const hash = new URLSearchParams(url.hash.slice(1));
  assert.equal(hash.get("variant"), "1002,1001");
  assert.equal(hash.get("title"), title);
});

test("Ошибка хранилища не выдаётся за успешное сохранение", () => {
  const env = setup();
  env.block();
  const form = env.api.buildSaveControls([1001], "Тест");
  form.events.submit({ preventDefault() {} });
  assert.match(form.children.at(-1).textContent, /Не удалось сохранить/);
  assert.equal(env.stored(), "[]");
});

test("Повреждённые сохранения не перезаписываются", () => {
  const env = setup("{broken");
  const form = env.api.buildSaveControls([1001], "Тест");
  form.events.submit({ preventDefault() {} });
  assert.equal(env.stored(), "{broken");
  assert.throws(() => env.api.readSavedVariants());
  for (const ids of [[], [1001, 1001], [0], [-1], ["1001"], [1.5]]) {
    assert.equal(env.api.validIds(ids), false);
  }
});

test("Восстановление загружает сохранённый порядок без случайного отбора", async () => {
  const env = setup();
  await env.api.buildFull(new env.Element(), [], { ids: [1002, 1001] });
  assert.deepEqual(env.loadedIds, [1002, 1001]);
});

test("Пропавшее задание не заменяется случайным", async () => {
  const env = setup();
  const result = new env.Element();
  await env.api.buildFull(result, [], { ids: [1001, 9999] });
  assert.match(result.textContent, /9999.*больше не доступны/);
  assert.deepEqual(env.loadedIds, []);
});
