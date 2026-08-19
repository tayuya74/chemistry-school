/** Метаданные готовых вариантов ОГЭ (по sourceDir в реестре). */

export const VARIANT_META = {
  "2026-demo": {
    slug: "demo-2026",
    title: "Демонстрационный вариант 2026 (ФИПИ)",
    sortOrder: 0,
    short: "Демо 2026",
    gridOrder: 1,
  },
  default: {
    slug: "demo-2025",
    title: "Демонстрационный вариант 2025 (ФИПИ)",
    sortOrder: 11,
    short: "Демо 2025",
    gridOrder: 0,
  },
  "variant-1": {
    slug: "national-edu-variant-1",
    title: "Типовой вариант 1 (Национальное образование)",
    sortOrder: 1,
    short: "Вариант 1",
    gridOrder: 2,
  },
  "variant-2": {
    slug: "national-edu-variant-2",
    title: "Типовой вариант 2 (Национальное образование)",
    sortOrder: 2,
    short: "Вариант 2",
    gridOrder: 3,
  },
  "variant-3": {
    slug: "national-edu-variant-3",
    title: "Типовой вариант 3 (Национальное образование)",
    sortOrder: 3,
    short: "Вариант 3",
    gridOrder: 4,
  },
  "variant-4": {
    slug: "national-edu-variant-4",
    title: "Типовой вариант 4 (Национальное образование)",
    sortOrder: 4,
    short: "Вариант 4",
    gridOrder: 5,
  },
  "variant-5": {
    slug: "national-edu-variant-5",
    title: "Типовой вариант 5 (Национальное образование)",
    sortOrder: 5,
    short: "Вариант 5",
    gridOrder: 6,
  },
  "variant-6": {
    slug: "national-edu-variant-6",
    title: "Типовой вариант 6 (Национальное образование)",
    sortOrder: 6,
    short: "Вариант 6",
    gridOrder: 7,
  },
  "variant-7": {
    slug: "national-edu-variant-7",
    title: "Типовой вариант 7 (Национальное образование)",
    sortOrder: 7,
    short: "Вариант 7",
    gridOrder: 8,
  },
  "variant-8": {
    slug: "national-edu-variant-8",
    title: "Типовой вариант 8 (Национальное образование)",
    sortOrder: 8,
    short: "Вариант 8",
    gridOrder: 9,
  },
  "variant-9": {
    slug: "national-edu-variant-9",
    title: "Типовой вариант 9 (Национальное образование)",
    sortOrder: 9,
    short: "Вариант 9",
    gridOrder: 10,
  },
  "variant-10": {
    slug: "national-edu-variant-10",
    title: "Типовой вариант 10 (Национальное образование)",
    sortOrder: 10,
    short: "Вариант 10",
    gridOrder: 11,
  },
};

export function metaForSourceDir(sourceDir) {
  const key = sourceDir ?? "default";
  return VARIANT_META[key] ?? null;
}
