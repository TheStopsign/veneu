const setDark = function (root) {
  root.style.setProperty("--veneu-background", "var(--veneu-dark)");
  root.style.setProperty("--veneu-background-backdrop", "var(--veneu-dark-backdrop)");
  root.style.setProperty("--veneu-background-highlight", "var(--veneu-dark-highlight)");
  root.style.setProperty("--veneu-background-lowlight", "var(--veneu-dark-lowlight)");
  root.style.setProperty("--veneu-firefox-glass", "var(--veneu-dark-firefox-glass)");

  root.style.setProperty("--veneu-text-primary", "var(--veneu-light)");
  root.style.setProperty("--veneu-text-alternate", "var(--veneu-light)");
};
const setLight = function (root) {
  root.style.setProperty("--veneu-background", "var(--veneu-light)");
  root.style.setProperty("--veneu-background-backdrop", "var(--veneu-light-backdrop)");
  root.style.setProperty("--veneu-background-highlight", "var(--veneu-light-highlight)");
  root.style.setProperty("--veneu-background-lowlight", "var(--veneu-light-lowlight)");
  root.style.setProperty("--veneu-firefox-glass", "var(--veneu-light-firefox-glass)");

  root.style.setProperty("--veneu-text-primary", "var(--veneu-blue)");
  root.style.setProperty("--veneu-text-alternate", "var(--veneu-light)");
};

module.exports = {
  setPalette(root, mode) {
    if (mode === "null" && window.matchMedia) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDark(root);
      } else {
        setLight(root);
      }
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        const newColorScheme = e.matches ? "dark" : "light";
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setDark(root);
        } else {
          setLight(root);
        }
      });
    } else if (mode === "false") {
      setDark(root);
    } else {
      setLight(root);
    }
  },
};
