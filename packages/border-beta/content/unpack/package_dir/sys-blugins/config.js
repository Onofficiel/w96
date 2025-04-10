const { config, wnd, root } = Border;

// Size
wnd.setSize(config.window.width, config.window.height);

// Titlebar
if (!config.window.nativeTitlebar) {
  root.querySelector(".border>.tab-bar>.controls").style.display = "flex";

  const titlebar = wnd.wndObject.querySelector(".titlebar");
  const tabBar = root.querySelector(".border>.tab-bar");
}