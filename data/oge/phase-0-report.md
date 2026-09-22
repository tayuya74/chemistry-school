# Фаза 0: автопроверка карты uiKind

Сгенерировано: `2026-09-22T06:00:13.455Z`

## Итог

- Заданий в реестре: **944**
- Без ошибок чтения: **276**
- **Карта uiKind:** ✓ **подтверждена** (все 276 HTML совпадают с TASK-TYPES.md)
- Расхождений uiKind: **0**
- Legacy-проверка чисел (18/19): **0** заданий (исправится при миграции)
- Прочие замечания: **0**
- Пропущено (нет файла): **0**
- Создано сразу в JSON (без HTML-исходника, вне проверки фазы 0): **668**

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
| 18 | `numericInt` | 12 | ✓ | numericInt | — / — | — | strict |
| 19 | `numericMassTable` | 12 | ✓ | numericMassTable | — / — | — | strict |
| 20 | `openReference` | 12 | ✓ | openReference | — / — | — | — |
| 21 | `openReference` | 12 | ✓ | openReference | — / — | — | — |
| 22 | `openReference` | 12 | ✓ | openReference | — / — | — | — |
| 23 | `experimentOpen` | 12 | ✓ | experimentOpen | — / — | — | — |

## Примечание

Замечания `numeric: … rounded/tolerance` — в **текущих HTML** ещё не strict-сравнение; целевое правило для миграции — `n === value` (см. TASK-TYPES.md).

Перезапуск: `npm run validate:oge-phase0`
