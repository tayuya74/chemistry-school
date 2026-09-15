(function () {
  const form = document.getElementById("ogeTaskSearch");
  if (!form) return;
  const input = document.getElementById("ogeTaskNumber");
  const status = document.getElementById("ogeTaskSearchStatus");
  const ids = new Set(form.dataset.taskIds.split(","));

  input.addEventListener("input", function () {
    status.textContent = "";
    input.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = input.value.trim().replace(/^№\s*/, "");
    const id = /^\d+$/.test(value) ? String(Number(value)) : "";
    if (!ids.has(id)) {
      status.textContent = id
        ? "Задание с таким номером не найдено. Проверьте номер примера."
        : "Введите номер задания, например 1001.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    window.location.assign(new URL(`ex/${id}.html`, document.baseURI).href);
  });
})();
