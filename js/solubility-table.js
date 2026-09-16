(function () {
  const table = document.querySelector(".solubility-table");
  if (!table) return;

  const scroll = table.closest(".solubility-scroll");
  if (!scroll) return;

  const rowFrame = document.createElement("span");
  const columnFrame = document.createElement("span");
  rowFrame.className = "solubility-axis-frame solubility-axis-frame--row";
  columnFrame.className = "solubility-axis-frame solubility-axis-frame--column";
  rowFrame.hidden = true;
  columnFrame.hidden = true;
  scroll.append(rowFrame, columnFrame);

  let currentCell = null;

  function clearHighlight() {
    rowFrame.hidden = true;
    columnFrame.hidden = true;
    currentCell = null;
  }

  function placeFrame(frame, { left, top, width, height }) {
    frame.style.left = `${left}px`;
    frame.style.top = `${top}px`;
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.hidden = false;
  }

  table.addEventListener("pointerover", (event) => {
    const cell = event.target.closest("th, td");
    if (!cell || !table.contains(cell) || cell === currentCell) return;

    clearHighlight();
    currentCell = cell;
    const row = cell.parentElement;
    const tableRect = table.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();

    placeFrame(rowFrame, {
      left: table.offsetLeft,
      top: table.offsetTop + rowRect.top - tableRect.top,
      width: tableRect.width,
      height: rowRect.height,
    });
    placeFrame(columnFrame, {
      left: table.offsetLeft + cellRect.left - tableRect.left,
      top: table.offsetTop,
      width: cellRect.width,
      height: tableRect.height,
    });
  });

  table.addEventListener("pointerleave", clearHighlight);
  window.addEventListener("resize", clearHighlight);
})();
