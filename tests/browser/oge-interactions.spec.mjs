import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const projectRoot = process.cwd();
const registryFile = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "data/oge-registry.json"), "utf8"),
);
const registry = registryFile.examples ?? registryFile;

function taskForType(examType) {
  const row = registry.find((entry) => entry.type === examType);
  return JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "data/oge/tasks", `${row.id}.json`),
      "utf8",
    ),
  );
}

async function reset(root) {
  for (const input of await root.locator('input[type="text"]').all()) {
    await input.fill("");
  }
  for (const checkbox of await root.locator('input[type="checkbox"]').all()) {
    if (await checkbox.isChecked()) await checkbox.uncheck();
  }
  for (const select of await root.locator("select").all()) {
    await select.selectOption("");
  }
}

function differentDigit(value, max = 9) {
  const current = Number(value);
  return String(current === max ? 1 : current + 1);
}

async function fillAnswer(root, task, mode) {
  const incomplete = mode === "incomplete";
  const wrong = mode === "wrong";

  switch (task.uiKind) {
    case "twoChoice": {
      const values = [...task.answer.correct];
      if (wrong)
        values[0] = differentDigit(values[0], task.content.statements.length);
      const inputs = root.locator(".oge-answer-cells input");
      await inputs.nth(0).fill(values[0]);
      if (!incomplete) await inputs.nth(1).fill(values[1]);
      break;
    }
    case "matchTriple": {
      const values = [
        task.answer.mapping.A,
        task.answer.mapping.B,
        task.answer.mapping.V,
      ];
      if (wrong)
        values[0] = differentDigit(values[0], task.content.right.length);
      const selects = root.locator("select");
      await selects.nth(0).selectOption(values[0]);
      if (!incomplete) {
        await selects.nth(1).selectOption(values[1]);
        await selects.nth(2).selectOption(values[2]);
      }
      break;
    }
    case "orderedDigits": {
      const values = [...task.answer.sequence];
      if (wrong) values[0] = differentDigit(values[0]);
      const inputs = root.locator(".oge-answer-cells input");
      await inputs.nth(0).fill(values[0]);
      if (!incomplete) {
        for (let index = 1; index < values.length; index++) {
          await inputs.nth(index).fill(values[index]);
        }
      }
      break;
    }
    case "periodDiagram": {
      const values = [task.answer.values.X, task.answer.values.Y];
      if (wrong) values[0] = differentDigit(values[0]);
      const inputs = root.locator(".oge-xy-table input");
      await inputs.nth(0).fill(values[0]);
      if (!incomplete) await inputs.nth(1).fill(values[1]);
      break;
    }
    case "multiChoiceFour": {
      const values = [...task.answer.correct];
      if (wrong) values[0] = differentDigit(values[0], 4);
      const inputs = root.locator(".oge-answer-cells input");
      await inputs.nth(0).fill(values[0]);
      if (!incomplete) {
        for (let index = 1; index < values.length; index++) {
          await inputs.nth(index).fill(values[index]);
        }
      }
      break;
    }
    case "numericInt":
    case "numericMassTable": {
      const value = wrong ? task.answer.value + 1 : task.answer.value;
      const text = String(value).replace(".", ",");
      await root
        .locator(".oge-answer-input")
        .fill(incomplete ? text.slice(0, 1) : text);
      break;
    }
  }
}

for (let examType = 1; examType <= 19; examType++) {
  const taskData = taskForType(examType);
  test(`тип ${examType}: пустой, неполный, неверный и правильный ввод`, async ({
    page,
  }) => {
    await page.goto(
      `/pages/oge/type-${String(examType).padStart(2, "0")}.html`,
    );
    const section = page.locator(`#oge-ex-title-${taskData.id}`).locator("..");
    const root = section.locator(".oge-subtask");
    const check = root.getByRole("button", { name: "Проверить", exact: true });
    const result = root.getByRole("status");

    await check.click();
    await expect(result).toHaveText("попробуй еще раз");

    for (const mode of ["incomplete", "wrong", "correct"]) {
      await reset(root);
      await fillAnswer(root, taskData, mode);
      await check.click();
      await expect(result).toHaveText(
        mode === "correct" ? "верно" : "попробуй еще раз",
      );
    }

    if (["twoChoice", "multiChoiceFour"].includes(taskData.uiKind)) {
      await reset(root);
      for (const value of taskData.answer.correct) {
        await root.locator(`input[type="checkbox"][value="${value}"]`).check();
      }
      await check.click();
      await expect(result).toHaveText("верно");
    }
  });
}

for (let examType = 20; examType <= 23; examType++) {
  const taskData = taskForType(examType);
  test(`тип ${examType}: подсказка доступна, готовое решение скрыто`, async ({
    page,
  }) => {
    await page.goto(
      `/pages/oge/type-${String(examType).padStart(2, "0")}.html`,
    );
    const section = page.locator(`#oge-ex-title-${taskData.id}`).locator("..");
    const hintButton = section.getByRole("button", {
      name: "Подсказка",
      exact: true,
    });
    const hint = section.locator(".oge-hint");

    await expect(section.locator("details")).toHaveCount(0);
    await expect(hint).toBeHidden();
    await hintButton.click();
    await expect(hint).toBeVisible();
  });
}
