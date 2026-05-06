(function () {
  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function applyStored() {
    if (localStorage.getItem("theme") === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  function themeIconHtml(name) {
    return (
      '<span class="material-symbols-outlined" aria-hidden="true">' + name + "</span>"
    );
  }

  function syncToggles() {
    var dark = isDark();
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Включить светлую тему" : "Включить тёмную тему");
      btn.innerHTML = dark ? themeIconHtml("light_mode") : themeIconHtml("dark_mode");
    });
  }

  function setTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
    syncToggles();
  }

  applyStored();

  function init() {
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTheme(!isDark());
      });
    });
    syncToggles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
