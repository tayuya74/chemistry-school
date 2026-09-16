(function () {
  const table = document.querySelector(".solubility-table");
  if (!table) return;

  let currentCell = null;

  function clearHighlight() {
    table
      .querySelectorAll(".is-active-axis, .is-active-cell")
      .forEach((cell) =>
        cell.classList.remove("is-active-axis", "is-active-cell"),
      );
    currentCell = null;
  }

  table.addEventListener("pointerover", (event) => {
    const cell = event.target.closest("th, td");
    if (!cell || !table.contains(cell) || cell === currentCell) return;

    clearHighlight();
    currentCell = cell;
    const columnIndex = cell.cellIndex;

    [...cell.parentElement.cells].forEach((rowCell) =>
      rowCell.classList.add("is-active-axis"),
    );
    [...table.rows].forEach((row) =>
      row.cells[columnIndex]?.classList.add("is-active-axis"),
    );
    cell.classList.add("is-active-cell");
  });

  table.addEventListener("pointerleave", clearHighlight);
})();
