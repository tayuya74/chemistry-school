import fs from "node:fs";
import path from "node:path";
import { loadRegistry, root, sourceLabel } from "./oge-migrate-lib.mjs";
import { metaForSourceDir } from "./oge-variant-meta.mjs";

const variantsDir = path.join(root, "data", "oge", "variants");

function main() {
  const rows = loadRegistry();
  const bySource = new Map();

  for (const row of rows) {
    const key = row.sourceDir ?? "default";
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key).push(row);
  }

  fs.mkdirSync(variantsDir, { recursive: true });
  const written = [];

  for (const [sourceDir, group] of bySource) {
    const meta = metaForSourceDir(sourceDir);
    if (!meta) {
      console.warn(`Пропуск неизвестного sourceDir: ${sourceDir}`);
      continue;
    }

    const sorted = group.slice().sort((a, b) => a.type - b.type);
    if (sorted.length !== 23) {
      console.error(
        `${sourceDir}: ожидалось 23 задания, получено ${sorted.length}`,
      );
      process.exit(1);
    }
    for (let i = 0; i < 23; i++) {
      if (sorted[i].type !== i + 1) {
        console.error(`${sourceDir}: пропущен тип ${i + 1}`);
        process.exit(1);
      }
    }

    const variant = {
      slug: meta.slug,
      title: meta.title,
      source: sourceLabel({ sourceDir }),
      sourceDir,
      tasks: sorted.map((row) => ({
        slot: row.type,
        taskId: row.id,
      })),
    };

    const outPath = path.join(variantsDir, `${meta.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(variant, null, 2) + "\n", "utf8");
    written.push(meta.slug);
    console.log(`OK ${meta.slug}.json (${sorted[0].id}–${sorted[22].id})`);
  }

  console.log(`Сгенерировано вариантов: ${written.length}`);
}

main();
