/** Метаданные готовых вариантов ОГЭ (по sourceDir в реестре). */

export const VARIANT_META = {
  "2026-demo": {
    slug: "demo-2026",
    title: "Демонстрационный вариант 2026 (ФИПИ)",
    sortOrder: 0,
  },
  default: {
    slug: "demo-2025",
    title: "Демонстрационный вариант 2025 (ФИПИ)",
    sortOrder: 11,
  },
  "variant-1": {
    slug: "national-edu-variant-1",
    title: "Типовой вариант 1 (Национальное образование)",
    sortOrder: 1,
  },
  "variant-2": {
    slug: "national-edu-variant-2",
    title: "Типовой вариант 2 (Национальное образование)",
    sortOrder: 2,
  },
  "variant-3": {
    slug: "national-edu-variant-3",
    title: "Типовой вариант 3 (Национальное образование)",
    sortOrder: 3,
  },
  "variant-4": {
    slug: "national-edu-variant-4",
    title: "Типовой вариант 4 (Национальное образование)",
    sortOrder: 4,
  },
  "variant-5": {
    slug: "national-edu-variant-5",
    title: "Типовой вариант 5 (Национальное образование)",
    sortOrder: 5,
  },
  "variant-6": {
    slug: "national-edu-variant-6",
    title: "Типовой вариант 6 (Национальное образование)",
    sortOrder: 6,
  },
  "variant-7": {
    slug: "national-edu-variant-7",
    title: "Типовой вариант 7 (Национальное образование)",
    sortOrder: 7,
  },
  "variant-8": {
    slug: "national-edu-variant-8",
    title: "Типовой вариант 8 (Национальное образование)",
    sortOrder: 8,
  },
  "variant-9": {
    slug: "national-edu-variant-9",
    title: "Типовой вариант 9 (Национальное образование)",
    sortOrder: 9,
  },
  "variant-10": {
    slug: "national-edu-variant-10",
    title: "Типовой вариант 10 (Национальное образование)",
    sortOrder: 10,
  },
};

export function metaForSourceDir(sourceDir) {
  const key = sourceDir ?? "default";
  return VARIANT_META[key] ?? null;
}
