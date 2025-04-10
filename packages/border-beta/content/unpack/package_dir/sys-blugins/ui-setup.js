const body = Border.root;
const { Tab, Event, i18n } = Border;
const { ContextMenu } = w96.ui;

// UI Components

const searchBar = body.querySelector(".border>.nav-bar>.location-bar>input");
const goBtn = body.querySelector(".border>.nav-bar>.location-bar>.go");

const backBtn = body.querySelector(".border>.nav-bar>.backward");
const reloadBtn = body.querySelector(".border>.nav-bar>.reload");
const forwardBtn = body.querySelector(".border>.nav-bar>.forward");

const menuBtn = body.querySelector(".border>.nav-bar>.menu");
const tabBtn = body.querySelector(".border>.tab-bar>.tab-panel>.create-tab");

// New tab button
tabBtn.addEventListener("click", () => {
  Tab.create({
    current: true,
    uri: "border://newtab",
  });
});

// Search
let searching = false;
async function search() {
  if (searching) return;

  searching = true;
  await Tab.current.setURI(searchBar.value);
  searching = false;
}

goBtn.addEventListener("click", search);
searchBar.addEventListener("keyup", ({ key }) => {
  if (key === "Enter") search();
});

Event.on("tab.change", (tab) => (searchBar.value = tab.uri));

// Navigation
backBtn.addEventListener("click", () => {
  Tab.current.history.go(-1);
});
reloadBtn.addEventListener("click", async () => {
  if (searching) return;

  searching = true;
  await Tab.current.reload();
  searching = false;
});
forwardBtn.addEventListener("click", () => {
  Tab.current.history.go(1);
});

// Control buttons
const closeBtn = body.querySelector(".controls>.close");
const maxBtn = body.querySelector(".controls>.maximize");
const minBtn = body.querySelector(".controls>.minimize");

closeBtn.addEventListener("click", () => {
  Border.exit();
});

maxBtn.addEventListener("click", () => {
  Border.wnd.toggleMaximize();
});

minBtn.addEventListener("click", () => {
  Border.wnd.toggleMinimize();
});

// Menu
let menu = null;
menuBtn.addEventListener("click", async () => {
  if (menu?.isConnected) {
    return menu.remove();
  };

  // Add time to fix the bug
  await new Promise(r => setTimeout(r, 0));

  // Get the list of history
  let historyItems = [
    {
      type: "normal",
      label: i18n.t("{{glossary.history}}"),
      onclick: () => Tab.create({ current: true, uri: "border://history" }),
    },
    {
      type: "normal",
      label: i18n.t("{{actions.clear_history}}"),
      onclick: () => Border.history.clear(),
    },
    {
      type: "separator",
    },
  ];

  Border.history.list.toReversed().forEach((uri, index) => {
    if (index >= 10) return;

    // Make the url shorter if it's too long
    if (uri.length > 50) {
      uri = uri.slice(0, 50) + "...";
    }

    historyItems.push({
      type: "normal",
      label: `${uri}`,
      onclick: () => Tab.create({ current: true, uri }),
    });
  })

  // Create the context menu
  let ctxm = new ContextMenu([
    {
      type: "normal",
      label: i18n.t("{{actions.new_tab}}"),
      onclick: () => Tab.create({ current: true, uri: "border://newtab" }),
    },
    {
      type: "normal",
      label: i18n.t("{{actions.new_window}}"),
      onclick: () => Border.newWindow(),
    },
    {
      type: "separator",
    },
    {
      type: "normal",
      label: i18n.t("{{actions.go_back}}"),
      disabled: Tab.current.history.list.index <= 0,
      onclick: () => Tab.current.history.go(-1),
    },
    {
      type: "normal",
      label: i18n.t("{{actions.reload}}"),
      onclick: () => Tab.current.reload(),
    },
    {
      type: "normal",
      label: i18n.t("{{actions.go_forward}}"),
      disabled: (Tab.current.history.list.length - 1) <= Tab.current.history.index,
      onclick: () => Tab.current.history.go(1),
    },
    {
      type: "separator",
    },
    {
      type: "submenu",
      label: i18n.t("{{glossary.history}}"),
      items: historyItems,
    },
    {
      type: "separator",
    },
    {
      type: "submenu",
      label: i18n.t("{{help.help}}"),
      items: [
        {
          type: "normal",
          label: i18n.t("{{help.about}}"),
          onclick: () => {
            alert(`<span class="bold-noaa">${PRODUCT.NAME}</span><br>${i18n.t("{{glossary.version}}")} ${PRODUCT.VERSION}<br>`, {
              title: i18n.t(`{{help.about_browser}}`, {name: PRODUCT.NAME}),
              icon: "info"
            });
          },
        },
        {
          type: "normal",
          label: i18n.t("{{glossary.version}}"),
          onclick: () => Tab.create({ current: true, uri: "border://version" }),
        }
      ]
    },
    {
      type: "separator",
    },
    {
      type: "normal",
      label: i18n.t("{{actions.restart}}"),
      onclick: () => Border.restart(),
    },
    {
      type: "normal",
      label: i18n.t("{{actions.quit}}"),
      onclick: () => Border.exit(),
    }
  ]);

  // Get the menu button position
  const rect = menuBtn.getBoundingClientRect();
  // Render the menu
  menu = ctxm.renderMenu(rect.x + rect.width - 115, rect.y + rect.height, ctxm.items, false, "left");
});