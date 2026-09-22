import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const root = process.cwd();

function htmlFiles(dir, prefix) {
  return fs
    .readdirSync(path.join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => `${prefix}/${entry.name}`);
}

const pages = [
  "/index.html",
  "/pages/tables.html",
  ...htmlFiles("pages/oge", "/pages/oge"),
  ...htmlFiles("pages/oge/variants", "/pages/oge/variants"),
  ...htmlFiles("pages/topics", "/pages/topics"),
  ...htmlFiles("pages/tests", "/pages/tests"),
];

for (const theme of ["light", "dark"]) {
  test(`375 px: нет горизонтального сдвига, тема ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme);

    for (const url of pages) {
      await page.goto(url);
      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        theme: document.documentElement.getAttribute("data-theme"),
      }));
      expect(layout.scrollWidth, `${url} (${theme})`).toBeLessThanOrEqual(
        layout.clientWidth,
      );
      expect(layout.theme, `${url} (${theme})`).toBe(
        theme === "dark" ? "dark" : null,
      );
    }
  });
}
