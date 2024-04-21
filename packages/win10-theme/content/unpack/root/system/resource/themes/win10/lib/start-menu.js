const { execCmd, execFile } = w96.sys;
const { Theme } = w96.ui;

const searchMenu = await include("./search-menu.js");

const ASSETS_PATH = "C:/system/resource/themes/win10/assets/start_menu";
const SB_WIDTH = 48;

let OPENED = false;

function setLinks(sideBar) {
    const documents = sideBar.querySelector(".documents");
    const explorer = sideBar.querySelector(".explorer");
    const settings = sideBar.querySelector(".settings");
    const shutdown = sideBar.querySelector(".shutdown");

    function handleClick(cmd, args) {
        w96.evt.shell.emit("start-close");
        execCmd(cmd, args);
    }

    documents.onclick = () => handleClick("explorer", ["C:/user/documents"]);
    explorer.onclick = () => handleClick("explorer", []);
    settings.onclick = () => handleClick("ctrl", []);
    shutdown.onclick = () => handleClick("reboot", []);
}

function handleSidebar(sideBar) {
    setLinks(sideBar);

    // Activation
    let timeoutId;

    sideBar.onmouseenter = () => {
        timeoutId = setTimeout(() => sideBar.classList.add("active"), 1000);
    }

    sideBar.onmouseleave = () => {
        clearTimeout(timeoutId);
        sideBar.classList.remove("active");
    }

    sideBar.querySelector(".hamburger").onclick = () => {
        clearTimeout(timeoutId);
        sideBar.classList.toggle("active");
    };
}

async function getShortcutsList() {
    return await (await FS.walk("C:/system/programs"))
        .aFilter(async e => (await FS.isFile(e)) && (FSUtil.getExtension(e) === ".link"))
}

async function createAppList(appList) {
    const shortcuts = (await getShortcutsList())
        .toSorted((a, b) => FSUtil.fname(a).localeCompare(FSUtil.fname(b)));

    for (const path of shortcuts) {
        const shortcut = JSON.parse(await FS.readstr(path));
        const fname = FSUtil.fname(path);

        // const item = document.createElement("fluent-button");
        // item.classList.add("app-item");
        // item.innerHTML = ;

        // item.onclick = () => {
        //   w96.evt.shell.emit("start-close");
        //   execFile(path);
        // };

        const el = document.createElement("div");
        el.innerHTML = `
      <fluent-button
        class="app-item"
        img="${await Theme.getIconUrl(shortcut.icon || "mime/executable", "32x32")}"
        img-size="32px"
        height="40px"
      >
        ${fname.slice(0, fname.lastIndexOf("."))}
      </fluent-button>
    `;

        const btn = el.querySelector(".app-item");
        btn.onclick = () => {
            w96.evt.shell.emit("start-close");
            execFile(path);
        };

        appList.appendChild(btn);
    }
}

async function createMenu() {
    const menuContainer = document.createElement("div");
    menuContainer.classList.add("tensm-container", "oc-event-exempt");

    // Add innerHTML
    menuContainer.innerHTML = `
    <div class="sm-applist"></div>
    <div class="sm-sidebar">
      <ul class="top">
        <fluent-button class="hamburger" height="${SB_WIDTH}px" img="${await FS.toURL(`${ASSETS_PATH}/hamburger.png`)}">
          <strong>START</strong>
        <fluent-button>
      </ul>

      <ul class="actions">
        <fluent-button class="documents" height="${SB_WIDTH}px" img="${await FS.toURL(`${ASSETS_PATH}/documents.png`)}">Documents</fluent-button>
        <fluent-button class="explorer" height="${SB_WIDTH}px" img="${await FS.toURL(`${ASSETS_PATH}/explorer.png`)}">Explorer</fluent-button>
        <fluent-button class="settings" height="${SB_WIDTH}px" img="${await FS.toURL(`${ASSETS_PATH}/settings.png`)}">Settings</fluent-button>
        <fluent-button class="shutdown" height="${SB_WIDTH}px" img="${await FS.toURL(`${ASSETS_PATH}/shutdown.png`)}">Power</fluent-button>
      </ul>
    </div>
  `;

    const $ = (el) => menuContainer.querySelector(el);

    const sideBar = $(".sm-sidebar");
    const appList = $(".sm-applist");

    // Sidebar
    handleSidebar(sideBar);

    // App List
    createAppList(appList);

    return menuContainer;
}

async function open() {
    if (document.querySelector(".tensm-container")) return;
    const menu = await createMenu();

    document.querySelector("#maingfx").appendChild(menu);

    OPENED = true;
}

async function close() {
    document.querySelector(".start_button").classList.remove("sb-active");

    const menu = document.querySelector(".tensm-container");
    if (!menu) return;

    const anim = menu.animate(
        { opacity: "0", translate: "0 10px" },
        { duration: 50, easing: "ease-in" }
    );

    anim.onfinish = () => menu.remove();

    OPENED = false;
}

// Event Listeners
document.addEventListener("keydown", ({ key }) => {
    if (!OPENED || (key.length > 1)) return;

    searchMenu.open();
    close();
});

module.exports = {
    close,
    open
}