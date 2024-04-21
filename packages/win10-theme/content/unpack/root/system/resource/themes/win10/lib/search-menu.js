const { execFile, execCmd } = w96.sys;

const ASSETS_PATH = "C:/system/resource/themes/win10/assets";
const CONFIG_PATH = "C:/system/config/search-menu.json";

let MENU_OPENED = false;
let MENU = null;
let SEARCH_BUTTON = null;

// Assets
const SEARCH_ICON = await FS.toURL(`${ASSETS_PATH}/search_button.png`);
const OPEN_ICON = await FS.toURL(`${ASSETS_PATH}/open.png`);

// Config
const { TYPES, DEFAULT_TYPE } = await include("./config/search-modes.js");
const CONFIG = await include(CONFIG_PATH);

// Tabs
let ACTIVE_TYPE = DEFAULT_TYPE;

function getQueryProps(value) {
    const splitted = value.split(":");

    let type = TYPES.find(t => !t.tags);
    let query = value;

    if (splitted.length > 1) {
        const newType = TYPES.find(t => {
            if (!t.tags) return;

            return t.tags
                .map(v => v.toLowerCase())
                .includes(splitted[0].toLowerCase())
        });

        if (newType) {
            type = newType;
            query = splitted.slice(1).join(":").trim();
        }
    }

    return ({
        type,
        query
    });
}

async function createMenu() {
    const menu = document.createElement("div");
    menu.classList.add("tenfm-container");
    menu.innerHTML = `
        <div class="navbar">
            <ul></ul>
            <button class="close"></button>
        </div>
        <div class="content"></div>
        <div class="search-bar">
            <img src="${SEARCH_ICON}" />
            <input type="text" placeholder="Type here to search" />
        </div>
    `;

    let ACTIVE_MATCH = null;

    const tabList = menu.querySelector(".navbar>ul");
    const closeBtn = menu.querySelector(".close");
    const searchBar = menu.querySelector(".search-bar>input");
    const content = menu.querySelector(".content");

    async function openActiveMatch() {
        if (ACTIVE_MATCH.type === "App") {
            const path = CONFIG.topApps[ACTIVE_MATCH.exec[1]];

            if (path) {
                path += 1;
            } else {
                path = 1;
            }

            await FS.writestr(CONFIG_PATH, JSON.stringify(CONFIG, undefined, 4));
        }

        const [oType, oPath] = ACTIVE_MATCH.exec;

        if (oType === "file") {
            execFile(oPath);
        } else if (oType === "cmd") {
            execCmd(...oPath);
        }
        close();
    }

    async function setActiveMatch(match) {
        ACTIVE_MATCH = match;

        const details = content.querySelector(".details");
        const matchEls = content.querySelectorAll(".match");

        matchEls.forEach(el => {
            const path = match.exec[0] === "file" ? match.exec[1] : `${match.exec[1][0]} ${match.exec[1][1].join(" ")}`;

            if (el.dataset.path === path) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        });

        const container = document.createElement("div");
        container.classList.add("container");

        container.innerHTML = `
            <div class="info">
                <img src="${match.icon32}" />

                <span class="label">${match.label}</span>
                <span class="sublabel">${match.sublabel}</span>
            </div>

            <div class="actions">

            </div>
        `;

        // Action buttons
        const actionsEl = container.querySelector(".actions");
        const actions = [
            {
                label: "Open",
                icon: OPEN_ICON,

                exec: () => {
                    const [oType, oPath] = match.exec;

                    if (oType === "file") {
                        execFile(oPath);
                    } else if (oType === "cmd") {
                        execCmd(...oPath);
                    }
                }
            },
            ...match.actions
        ];

        actions.forEach(async action => {
            const btn = document.createElement("button");
            btn.innerHTML = `
                <img src="${action.icon}" />
                <span>${action.label}</span>
            `;

            btn.addEventListener("click", () => {
                action.exec();
                close();
            });

            actionsEl.appendChild(btn);
        });

        details.innerHTML = "";
        details.appendChild(container);
    }

    async function renderContent(query, type = DEFAULT_TYPE) {
        content.innerHTML = "";
        if (!query) {
            ACTIVE_MATCH = null;
            type.home?.(content, { close, CONFIG, CONFIG_PATH });
            return;
        }

        const matches = await type.find(query);
        const bestMatch = matches.shift();

        content.innerHTML = `
            <div class="splitted">
                <section class="results">
                    <div class="category">Best match${ACTIVE_TYPE === DEFAULT_TYPE ? "" : ` for ${ACTIVE_TYPE.label.toLowerCase()}`}</div>
                    <div class="best match active" data-path="${bestMatch.exec[0] === "file" ? bestMatch.exec[1] : `${bestMatch.exec[1][0]} ${bestMatch.exec[1][1].join(" ")}`}">
                        <div class="content">
                            <img src="${bestMatch.icon32}" />
                            <div class="info">
                                <strong>${bestMatch.label}</strong>
                                <span>${bestMatch.sublabel}</span>
                            </div>
                        </div>

                        <button class="select"></button>
                    </div>
                </section>
                <section class="details">

                </section>
            </div>
        `;

        // Make the select button work
        const selectBtn = content.querySelector(".best.match>.select");
        selectBtn.addEventListener("click", e => {
            e.stopPropagation();
            setActiveMatch(bestMatch);
        });

        setActiveMatch(bestMatch);

        // Add other results
        const otherMatches = new Map();
        matches.forEach(match => {
            const { type } = match;
            if (otherMatches.has(type)) {
                otherMatches
                    .get(type)
                    .push(match);
            } else {
                otherMatches.set(type, [match]);
            }
        });

        const resultContainer = content.querySelector(".results");
        for (const [typeName, values] of otherMatches) {
            const type = TYPES.find(t => t.label === typeName);

            // Create the type separator element
            const typeEl = document.createElement("div");
            typeEl.classList.add("category");

            typeEl.innerText = typeName;

            if (ACTIVE_TYPE !== type) {
                typeEl.classList.add("clickable");

                typeEl.addEventListener("click", e => {
                    e.stopPropagation();

                    updateActiveTab(type);
                    renderContent(query, type);
                });

            }
            resultContainer.appendChild(typeEl);

            // Add the matches of the same type
            values.forEach(m => {
                const matchEl = document.createElement("div");
                matchEl.classList.add("other", "match");
                matchEl.dataset.path = m.exec[0] === "file" ? m.exec[1] : `${m.exec[1][0]} ${m.exec[1][1].join(" ")}`;

                matchEl.innerHTML = `
                    <div class="content">
                        <img src="${m.icon16}" />
                        <span class="label">${m.label}</span>
                    </div>

                    <button class="select"></button>
                `;

                matchEl.addEventListener("click", () => {
                    if (m.exec[0] === "file") {
                        execFile(m.exec[1]);
                    } else if (m.exec[0] === "cmd") {
                        execCmd(...m.exec[1]);
                    }

                    close();
                });

                matchEl.querySelector(".select").addEventListener("click", e => {
                    e.stopPropagation();
                    setActiveMatch(m);
                });

                resultContainer.appendChild(matchEl);
            });
        }

        const bestMatchEl = content.querySelector(".best.match");
        bestMatchEl.addEventListener("click", () => {
            const [oType, oPath] = bestMatch.exec;

            if (oType === "file") {
                execFile(oPath);
            } else if (oType === "cmd") {
                execCmd(...oPath);
            }

            close();
        });
    }

    function updateActiveTab(type) {
        if (ACTIVE_TYPE === type) return;

        const { query } = getQueryProps(searchBar.value);
        searchBar.value = (type === DEFAULT_TYPE
            ? query
            : `${type.tags[0]}: ${query}`);

        const tabEls = tabList.querySelectorAll("li");
        tabEls.forEach(t => {
            if (t.innerText === type.label)
                t.classList.add("active");
            else
                t.classList.remove("active");
        });

        ACTIVE_TYPE = type;
    }

    // Tab List
    closeBtn.addEventListener("click", close);

    TYPES.forEach((type, i) => {
        const el = document.createElement("li");
        if (i == 0) el.classList.add("active");
        el.innerText = type.label;

        el.addEventListener("click", () => {
            const tabEls = tabList.querySelectorAll("li");
            tabEls.forEach(t => t.classList.remove("active"));

            el.classList.add("active");

            const { query } = getQueryProps(searchBar.value);
            searchBar.value = type.tags ? `${type.tags?.[0]}: ${query}` : query;

            renderContent(query, type);
        });

        tabList.appendChild(el);
    });

    searchBar.addEventListener("input", ({ target }) => {
        const { value } = target;
        const { type, query } = getQueryProps(value);

        updateActiveTab(type);
        renderContent(query, type);
    });

    // Handle enter on search
    searchBar.addEventListener("keydown", ({ key }) => {
        if ((key !== "Enter") || (ACTIVE_MATCH === null))
            return;

        openActiveMatch();
    });

    renderContent("", DEFAULT_TYPE);
    return menu;
}

async function open() {
    if (document.querySelector(".tenfm-container")) return;
    SEARCH_BUTTON ||= document.querySelector(".search_button");

    MENU = await createMenu();

    SEARCH_BUTTON.classList.add("fm-active");

    document.querySelector("#maingfx").appendChild(MENU);
    MENU.querySelector(".search-bar>input").focus();

    MENU_OPENED = true;
}

function close() {
    document.querySelector(".search_button").classList.remove("fm-active");

    const menu = document.querySelector(".tenfm-container");
    if (!menu) return;

    const anim = menu.animate(
        { opacity: "0", translate: "0 10px" },
        { duration: 50, easing: "ease-in" }
    );

    anim.onfinish = () => menu.remove();

    MENU_OPENED = false;
}

async function toggle() {
    if (MENU_OPENED) {
        close();
    } else {
        await open();
    }
}

// Detect when you click outside of the menu: close it
document.addEventListener("click", e => {
    if (!MENU || !MENU_OPENED) return;
    if (MENU.contains(e.target) || SEARCH_BUTTON.contains(e.target)) return;

    close();
})


module.exports = {
    close,
    open,
    toggle,
}