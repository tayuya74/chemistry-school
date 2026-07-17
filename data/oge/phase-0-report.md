# Фаза 0: автопроверка карты uiKind

Сгенерировано: `2026-07-17T21:15:44.671Z`

## Итог

- Заданий в реестре: **276**
- Без ошибок чтения: **276**
- **Карта uiKind:** ✓ **подтверждена** (все 276 HTML совпадают с TASK-TYPES.md)
- Расхождений uiKind: **0**
- Legacy-проверка чисел (18/19): **21** заданий (исправится при миграции)
- Прочие замечания: **0**
- Пропущено (нет файла): **0**

## По типам экзамена (1–23)

| Тип | uiKind | Примеров | OK | Шаблоны в HTML | Пунктов / справа | correct (16) | Проверка 18/19 |
|----:|--------|--------:|---:|----------------|------------------|--------------|----------------|
| 1 | `twoChoice` | 12 | ✓ | twoChoice | 5 / — | 2 | — |
| 2 | `periodDiagram` | 12 | ✓ | periodDiagram | — / — | 2 | — |
| 3 | `orderedDigits` | 12 | ✓ | orderedDigits | — / — | — | — |
| 4 | `matchTriple` | 12 | ✓ | matchTriple | — / 4 | — | — |
| 5 | `twoChoice` | 12 | ✓ | twoChoice | 5 / — | 2 | — |
| 6 | `twoChoice` | 12 | ✓ | twoChoice | 5 / — | 2 | — |
| 7 | `orderedDigits` | 12 | ✓ | orderedDigits | — / — | — | — |
| 8 | `twoChoice` | 12 | ✓ | twoChoice | 5 / — | 2 | — |
| 9 | `matchTriple` | 12 | ✓ | matchTriple | — / 5 | — | — |
| 10 | `matchTriple` | 12 | ✓ | matchTriple | — / 4 | — | — |
| 11 | `twoChoice` | 12 | ✓ | twoChoice | 5 / — | 2 | — |
| 12 | `matchTriple` | 12 | ✓ | matchTriple | — / 4 | — | — |
| 13 | `twoChoice` | 12 | ✓ | twoChoice | 5 / — | 2 | — |
| 14 | `twoChoice` | 12 | ✓ | twoChoice | 6 / — | 2 | — |
| 15 | `matchTriple` | 12 | ✓ | matchTriple | — / 2 | — | — |
| 16 | `multiChoiceFour` | 12 | ✓ | multiChoiceFour | 4 / — | 2, 3 | — |
| 17 | `matchTriple` | 12 | ✓ | matchTriple | — / 4 | — | — |
| 18 | `numericInt` | 12 | ~ | numericInt | — / — | — | rounded, strict, tolerance |
| 19 | `numericMassTable` | 12 | ~ | numericMassTable | — / — | — | rounded, strict, tolerance |
| 20 | `openReference` | 12 | ✓ | openReference | — / — | — | — |
| 21 | `openReference` | 12 | ✓ | openReference | — / — | — | — |
| 22 | `openReference` | 12 | ✓ | openReference | — / — | — | — |
| 23 | `experimentOpen` | 12 | ✓ | experimentOpen | — / — | — | — |

## Legacy-проверка чисел (типы 18–19)

Заданий: **21**. В HTML ещё `Math.round` / допуски; при миграции заменить на strict (`n === value`).

- № 1041 (тип 18): numeric: проверка «tolerance», целевое правило — strict (n === value)
- № 1042 (тип 19): numeric: проверка «tolerance», целевое правило — strict (n === value)
- № 1065 (тип 19): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1087 (тип 18): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1088 (тип 19): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1110 (тип 18): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1111 (тип 19): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1133 (тип 18): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1134 (тип 19): numeric: проверка «rounded», целевое правило — strict (n === value)
- № 1156 (тип 18): numeric: проверка «rounded», целевое правило — strict (n === value)
- … и ещё 11

## Примечание

Замечания `numeric: … rounded/tolerance` — в **текущих HTML** ещё не strict-сравнение; целевое правило для миграции — `n === value` (см. TASK-TYPES.md).

Перезапуск: `npm run validate:oge-phase0`
