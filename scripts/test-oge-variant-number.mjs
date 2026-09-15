import { readFileSync, existsSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
const source = readFileSync(
  new URL("../js/oge-variant-number.js", import.meta.url),
  "utf8",
);
const catalog = JSON.parse(
  readFileSync(
    new URL("../data/oge/numbered-catalogs/1.json", import.meta.url),
    "utf8",
  ),
);
const full = Array.from({ length: 23 }, (_, i) => [i + 1, 1]);
function engine(seed = 0) {
  const ctx = {
    crypto: {
      getRandomValues: (a) => {
        a[0] = seed;
        return a;
      },
    },
  };
  runInNewContext(source, ctx);
  return ctx.OGE_VARIANTS;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
test("Старый номер и закреплённый каталог не меняются", () => {
  assert.equal(
    createHash("sha256").update(JSON.stringify(catalog)).digest("hex"),
    "f336406a4bab610c8221ea21ffc3be0a6d2abf9912132c32ef073bf9c79fb9e8",
  );
  assert.deepEqual(
    plain(engine().pick("1000000000049", catalog).ids),
    [
      1185, 1002, 1164, 1142, 1351, 1391, 1424, 1468, 1490, 1531, 1172, 1104,
      1612, 1617, 1648, 1668, 1704, 1735, 1732, 1181, 1819, 1855, 1861,
    ],
  );
  for (const row of catalog) {
    assert.ok(
      existsSync(new URL(`../data/oge/tasks/${row.id}.json`, import.meta.url)),
    );
    assert.ok(
      existsSync(new URL(`../pages/oge/ex/${row.id}.html`, import.meta.url)),
    );
  }
});
test("На другом устройстве без сохранений восстанавливаются те же задания", () => {
  for (const seed of [0, 1, 123456789, 999999999, 4294967295]) {
    const teacher = engine(seed),
      student = engine(42),
      code = teacher.create(full, false);
    assert.equal(code.length, 9);
    const ids = plain(teacher.pick(code, catalog).ids);
    assert.deepEqual(
      plain(student.pick(code, catalog.slice().reverse()).ids),
      ids,
    );
    assert.equal(ids.length, 23);
    assert.equal(new Set(ids).size, 23);
  }
});
test("Свой набор и фильтр сложности входят в номер", () => {
  const api = engine(17),
    counts = [
      [1, 2],
      [9, 3],
      [20, 1],
    ];
  for (const hard of [false, true]) {
    const code = api.create(counts, hard),
      parsed = api.parse(code);
    assert.deepEqual(plain(parsed.counts), counts);
    assert.equal(parsed.onlyHard, hard);
    const ids = api.pick(code, catalog).ids;
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      const row = catalog.find((row) => row.id === id);
      assert.ok(counts.some(([type]) => type === row.examType));
      if (hard) assert.equal(row.advanced, true);
    }
  }
});
test("Опечатки отклоняются, пробелы и знак номера допустимы", () => {
  const api = engine(),
    code = api.create(full, false);
  assert.equal(
    api.parse("№ " + code.slice(0, 4).toLowerCase() + "-" + code.slice(4)).code,
    code,
  );
  for (let i = 0; i < code.length; i++) {
    const replacement = code[i] === "2" ? "3" : "2";
    const typo = code.slice(0, i) + replacement + code.slice(i + 1);
    assert.throws(() => api.parse(typo));
  }
  for (const value of ["", "1001", "abc", code + "0"])
    assert.throws(() => api.parse(value));
});

test("Старые 13-значные номера продолжают открываться", () => {
  const api = engine();
  const parsed = api.parse("1000000000049");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.seed, 0);
  assert.equal(parsed.counts.length, 23);
});
