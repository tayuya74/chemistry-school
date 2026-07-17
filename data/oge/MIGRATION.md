# Миграция ОГЭ: HTML → JSON

План перехода от `data/oge-source/` к `data/oge/tasks/*.json` и композиции вариантов.

## Фаза 0 — проверка карты uiKind (автоматически)

**Не нужно делать вручную.** Скрипт проходит все записи `data/oge-registry.json`, читает исходный HTML и сверяет с [`TASK-TYPES.md`](TASK-TYPES.md):

- совпадает ли `detectedUiKind` с ожидаемым для `examType`;
- для `twoChoice` — 2 ячейки, 2 значения в `correct`, 5–6 пунктов;
- для `multiChoiceFour` — 4 суждения, 4 ячейки, `correct.length` от 1 до 4;
- для `matchTriple` — число вариантов в правой колонке;
- для типов 18/19 — помечает legacy-проверки (`Math.round`, допуски) vs целевое strict.

```bash
npm run validate:oge-phase0
```

Отчёты:

- [`phase-0-report.md`](phase-0-report.md) — сводка для человека;
- [`phase-0-report.json`](phase-0-report.json) — полные данные по каждому id.

**Результат (2026-07):** карта uiKind подтверждена для всех 276 заданий. 21 задание типов 18–19 помечено с legacy-проверкой чисел — это не ошибка группировки, а задача на фазу 2.

Код: `scripts/validate-oge-phase0.mjs`, маппинг: `scripts/oge-ui-kind-map.mjs`.

## Фаза 1 — JSON без смены сайта

1. Скрипт миграции: HTML → `data/oge/tasks/{id}.json`.
2. `npm run validate:tasks` — 276 заданий, у каждого `answer`.

Сайт пока работает по-старому.

**Команды:**

```bash
npm run migrate:oge-tasks    # HTML → JSON (перегенерация всех tasks/)
npm run validate:oge-tasks   # проверка 276 файлов
```

**Результат (2026-07):** мигрировано **276/276** заданий в `data/oge/tasks/`. Отчёт: [`migrate-report.json`](migrate-report.json).

**Формат одного задания** (`data/oge/tasks/{id}.json`):

- `id`, `examType`, `uiKind`
- `meta.lead`, `meta.source`, `meta.sourceDir`
- `blocks` — абзацы условия (HTML)
- `content` — данные для интерактива (зависят от `uiKind`)
- `answer` — ключ (`null` для типов 20–23)
- `solution` — эталон для типов 20–23

Код: `scripts/oge-migrate-lib.mjs`, `scripts/migrate-oge-html-to-json.mjs`, `scripts/validate-oge-tasks.mjs`.

## Фаза 2 — рендер из JSON

1. Девять рендереров по `uiKind` — `scripts/oge-render.mjs`.
2. `npm run build:oge` → `pages/oge/ex/{id}.html` и `pages/oge/type-*.html`.
3. Legacy-сборка из HTML: `npm run build:oge:legacy`.

**Результат (2026-07):** `build:oge` читает `data/oge/tasks/*.json` и генерирует все страницы ОГЭ. Числовые задания 18/19 проверяются strict (`n === value`).

Код: `scripts/build-oge-from-json.mjs`, `scripts/oge-render.mjs`.

## Фаза 3 — варианты

1. `data/oge/variants/*.json` — списки taskId (миграция из `sourceDir`).
2. Страницы `pages/oge/variants/{slug}.html`.
3. Позже — конструктор на клиенте.

**Команды:**

```bash
npm run generate:oge-variants   # JSON вариантов из реестра
npm run build:oge               # включает сборку pages/oge/variants/
```

**Результат (2026-07):** 12 готовых вариантов (демо 2025/2026 + типовые 1–10). Список: [`pages/oge/variants/index.html`](../pages/oge/variants/index.html).

Код: `scripts/generate-oge-variants.mjs`, `scripts/build-oge-variants.mjs`, `scripts/oge-variant-meta.mjs`.

## Фаза 4 — уборка

Удалить `data/oge-source/variant-*`, упростить legacy-сборку.
