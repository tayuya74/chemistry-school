/**
 * Рисует схему строения атома для заданий типа 2: ядро и электроны по слоям.
 *
 *   atomSvg([2, 7])  →  фтор: 2 электрона на первом слое, 7 на втором
 *
 * Электроны раскладываются по окружности равномерно, начиная сверху, чтобы
 * их было удобно пересчитывать глазом. Цвета берутся из темы сайта, поэтому
 * схема одинаково читается и в светлом, и в тёмном оформлении.
 */

const CX = 160;
const CY = 130;
const NUCLEUS_R = 16;
/** Радиусы слоёв: первый, второй, третий, четвёртый */
const SHELL_R = [34, 72, 110, 148];

const NAMES = ["первом", "втором", "третьем", "четвёртом"];

function electrons(count, radius) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    /* начинаем сверху и идём по часовой стрелке */
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    const x = CX + radius * Math.cos(angle);
    const y = CY + radius * Math.sin(angle);
    dots.push(
      `              <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" />`,
    );
  }
  return dots.join("\n");
}

/** Человекочитаемая подпись — она же попадает в aria-label. */
export function atomLabel(shells) {
  const parts = shells.map(
    (n, i) => `${n} на ${NAMES[i] ?? `${i + 1}-м`} слое`,
  );
  return `Схема атома: ядро +Z, ${parts.join(", ")}`;
}

export function atomSvg(shells) {
  if (!shells.length || shells.length > SHELL_R.length) {
    throw new Error(`atomSvg: слоёв должно быть от 1 до ${SHELL_R.length}`);
  }
  const outer = SHELL_R[shells.length - 1] + 12;

  const rings = shells
    .map(
      (_, i) => `            <circle
              cx="${CX}"
              cy="${CY}"
              r="${SHELL_R[i]}"
              fill="none"
              stroke="var(--color-border)"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />`,
    )
    .join("\n");

  const dots = shells
    .map((n, i) => electrons(n, SHELL_R[i]))
    .filter(Boolean)
    .join("\n");

  return `<svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 260"
            width="300"
            height="244"
            aria-label="${atomLabel(shells)}"
          >
            <circle
              cx="${CX}"
              cy="${CY}"
              r="${outer}"
              fill="var(--color-tip-bg)"
              stroke="var(--color-border)"
              stroke-width="2"
            />
${rings}
            <circle
              cx="${CX}"
              cy="${CY}"
              r="${NUCLEUS_R}"
              fill="#fecaca"
              stroke="#dc2626"
              stroke-width="2"
            />
            <text
              x="${CX}"
              y="${CY + 6}"
              text-anchor="middle"
              font-size="13"
              font-weight="700"
              fill="#991b1b"
            >
              +Z
            </text>
            <g fill="#2563eb" aria-hidden="true">
${dots}
            </g>
          </svg>`;
}
