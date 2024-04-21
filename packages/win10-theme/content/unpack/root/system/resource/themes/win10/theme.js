const { Theme } = w96.ui;
const { shell, sys } = w96.evt;

const { setColorTheme } = await include("./lib/theme-color.js");
const config = await include("C:/local/win10-theme/config.json");
const startMenu = await include("./lib/start-menu.js");
const searchMenu = await include("./lib/search-menu.js");

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
    // Remove search menu
    searchMenu.close();
});

shell.on('start-closed', () => {
    startMenu.close();
});

// Add the search button
sys.on("init-complete", () => {
    setColorTheme(config.accentColor);
    w96.ui.Theme.setColorTheme = setColorTheme;

    const start_btn = document.querySelector(".start_button");
    const search_btn = document.createElement("button");

    search_btn.classList.add("search_button");
    search_btn.onclick = () => {
        searchMenu.toggle();
    };

    start_btn.insertAdjacentElement("beforebegin", search_btn);
});