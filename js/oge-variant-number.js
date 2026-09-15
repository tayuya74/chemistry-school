/** Версии 1 и 2 неизменяемы: от них зависят уже выданные номера вариантов. */
(function (root) {
  const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const legacyChecksum = (payload) =>
    String(
      [...payload].reduce((n, digit) => (n * 10 + Number(digit)) % 97, 0),
    ).padStart(2, "0");
  const shortChecksum = (payload) =>
    ALPHABET[
      [...payload].reduce(
        (sum, character, index) =>
          (sum + (index + 1) * ALPHABET.indexOf(character)) % ALPHABET.length,
        0,
      )
    ];

  function encode(number, length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result = ALPHABET[number % ALPHABET.length] + result;
      number = Math.floor(number / ALPHABET.length);
    }
    return result;
  }

  function decode(part) {
    return [...part].reduce(
      (number, character) =>
        number * ALPHABET.length + ALPHABET.indexOf(character),
      0,
    );
  }

  function parseLegacy(code) {
    if (
      !/^1\d{9}[0-3]\d{2,94}$/.test(code) ||
      legacyChecksum(code.slice(0, -2)) !== code.slice(-2)
    )
      throw new Error("Проверьте номер варианта: скопируйте его целиком.");
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
      version: 1,
      seed: Number(code.slice(1, 10)),
      onlyHard: mode % 2 === 1,
      counts,
    };
  }

  function parse(value) {
    const code = String(value)
      .trim()
      .replace(/^№\s*/, "")
      .replace(/[\s-]/g, "")
      .toUpperCase();
    if (/^1\d/.test(code)) return parseLegacy(code);
    if (
      !/^2[2-9A-HJKMNP-Z]{8}(?:[2-9A-HJKMNP-Z]{3})*$/.test(code) ||
      shortChecksum(code.slice(0, -1)) !== code.at(-1)
    )
      throw new Error("Проверьте номер варианта: скопируйте его целиком.");
    const seed = decode(code.slice(1, 7));
    const mode = decode(code[7]);
    const config = code.slice(8, -1);
    const counts = [];
    if (mode < 2) {
      if (config) throw new Error("Неверный номер варианта.");
      for (let type = 1; type <= 23; type++) counts.push([type, 1]);
    } else {
      if (!config.length || config.length % 3)
        throw new Error("Неверный номер варианта.");
      for (let i = 0; i < config.length; i += 3) {
        const type = decode(config[i]);
        const count = decode(config.slice(i + 1, i + 3));
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
    return { code, version: 2, seed, onlyHard: mode % 2 === 1, counts };
  }

  function create(counts, onlyHard) {
    const normalized = counts
      .filter(([, n]) => n > 0)
      .map(([type, n]) => [type, Math.min(999, Math.floor(n))])
      .sort((a, b) => a[0] - b[0]);
    const full =
      normalized.length === 23 &&
      normalized.every(([type, n], i) => type === i + 1 && n === 1);
    const seed =
      root.crypto.getRandomValues(new Uint32Array(1))[0] % ALPHABET.length ** 6;
    const mode = (full ? 0 : 2) + (onlyHard ? 1 : 0);
    const payload =
      "2" +
      encode(seed, 6) +
      encode(mode, 1) +
      (full
        ? ""
        : normalized
            .map(([type, n]) => encode(type, 1) + encode(n, 2))
            .join(""));
    return parse(payload + shortChecksum(payload)).code;
  }

  function pick(code, catalog) {
    const { seed, onlyHard, counts } = parse(code);
    let state = seed;
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
