const { Theme } = w96.ui;
const { hexToRgb, Color, Solver } = await include("./deps/color.js");

function setColorTheme(r, g, b) {
    const value = !(g || b) ? hexToRgb(r) : [r, g, b];

    // Set Main Color
    const mColor = new Color(...value);
    const mSolver = new Solver(mColor);
    const mResult = mSolver.solve();

    // Set Secondary Color
    const sColor = new Color(...value);
    sColor.saturate(0.4);
    sColor.brightness(1.8);

    const sSolver = new Solver(sColor);
    const sResult = sSolver.solve();

    // Config CSS vars
    /** @type {HTMLElement} */
    const root = document.querySelector(":root");

    root.style.setProperty("--w10-main", mColor.toString());
    root.style.setProperty("--w10-main-filter", mResult.filter.slice(mResult.filter.indexOf(":") + 2, -1));

    root.style.setProperty("--w10-secondary", sColor.toString());
    root.style.setProperty("--w10-secondary-filter", sResult.filter.slice(sResult.filter.indexOf(":") + 2, -1));

    // Set UiVars
    Theme.uiVars.accentMain = mColor;
    Theme.uiVars.accentSecondary = sColor;

    console.log("%cMain %cSecondary", `color: ${mColor.toString()}`, `color: ${sColor.toString()}`);
}

module.exports = {
    setColorTheme,
}