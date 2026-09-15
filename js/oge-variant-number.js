/** Версия 1: алгоритм и каталог неизменяемы — от них зависят выданные номера. */
(function (root) {
  const VERSION = "1";
  const checksum = (payload) =>
    String(
      [...payload].reduce((n, digit) => (n * 10 + Number(digit)) % 97, 0),
    ).padStart(2, "0");

  function parse(value) {
    const code = String(value)
      .trim()
      .replace(/^№\s*/, "")
      .replace(/[\s-]/g, "");
    if (
      !/^1\d{9}[0-3]\d{2,94}$/.test(code) ||
      checksum(code.slice(0, -2)) !== code.slice(-2)
    ) {
      throw new Error("Проверьте номер варианта: скопируйте его целиком.");
    }
    const mode = Number(code[10]);
    const config = code.slice(11, -2);
    const counts = [];
    if (mode < 2) {
      if (config) throw new Error("Неверный номер варианта.");
      for (let type = 1; type <= 23; type++) counts.push([type, 1]);
    } else {
      if (!config.length || config.length % 4)
        throw new Error("Неверный номер варианта.");
      for (let i = 0; i < config.length; i += 4) {
        const type = Number(config.slice(i, i + 2));
        const count = Number(config.slice(i + 2, i + 4));
        if (
          type < 1 ||
          type > 23 ||
          count < 1 ||
          (counts.length && type <= counts.at(-1)[0])
        )
          throw new Error("Неверный номер варианта.");
        counts.push([type, count]);
      }
    }
    return {
      code,
      seed: Number(code.slice(1, 10)),
      onlyHard: mode % 2 === 1,
      counts,
    };
  }

  function create(counts, onlyHard) {
    const normalized = counts
      .filter(([, n]) => n > 0)
      .map(([type, n]) => [type, Math.min(99, Math.floor(n))])
      .sort((a, b) => a[0] - b[0]);
    const full =
      normalized.length === 23 &&
      normalized.every(([type, n], i) => type === i + 1 && n === 1);
    const seed =
      root.crypto.getRandomValues(new Uint32Array(1))[0] % 1000000000;
    const payload =
      VERSION +
      String(seed).padStart(9, "0") +
      String((full ? 0 : 2) + (onlyHard ? 1 : 0)) +
      (full
        ? ""
        : normalized
            .map(
              ([type, n]) =>
                String(type).padStart(2, "0") + String(n).padStart(2, "0"),
            )
            .join(""));
    return parse(payload + checksum(payload)).code;
  }

  function pick(code, catalog) {
    const { seed, onlyHard, counts } = parse(code);
    let state = seed;
    // Mulberry32. Не менять порядок вызовов и арифметику для версии 1.
    const random = () => {
      let t = (state += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const ids = [];
    const warnings = [];
    for (const [type, n] of counts) {
      const pool = catalog
        .filter((row) => row.examType === type && (!onlyHard || row.advanced))
        .sort((a, b) => a.id - b.id);
      if (pool.length < n)
        warnings.push(
          `Тип ${type}: доступно ${pool.length} ${onlyHard ? "сложных заданий" : "заданий"} — взяты все.`,
        );
      for (let i = 0; i < n && pool.length; i++)
        ids.push(pool.splice(Math.floor(random() * pool.length), 1)[0].id);
    }
    return { ids, warnings };
  }

  root.OGE_VARIANTS = {
    create,
    parse,
    pick,
    catalogUrl: () => "../../data/oge/numbered-catalogs/1.json",
  };
})(typeof window === "undefined" ? globalThis : window);
