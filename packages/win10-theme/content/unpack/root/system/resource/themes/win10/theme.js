const { Theme } = w96.ui;
const { shell, sys } = w96.evt;

const startMenu = await include("./lib/start-menu.js");

// Theme variables
Theme.uiVars.taskbarHeight = 40;
Theme.uiVars.maxWindowSizeFormulaH = "calc(100% - 40px)";

// Web Components
await include("./lib/fluent-button.js");

// Start menu events
shell.on('start-opened', (smEl) => {
  smEl.remove();

  // Open start menu
  startMenu.open();
});

shell.on('start-closed', () => {
  console.log("CLOSING SM");
  startMenu.close();
});

// Add the search button
sys.on("init-complete", () => {
  const start_btn = document.querySelector(".start_button");
  const search_btn = document.createElement("button");

  search_btn.classList.add("search_button");
  search_btn.onclick = () => w96.sys.execCmd("run");

  start_btn.insertAdjacentElement("beforebegin", search_btn);
});