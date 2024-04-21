const { Theme } = w96.ui;
const { execCmd } = w96.sys;
const { sysConf } = w96;

const ASSETS_PATH = "C:/system/resource/themes/win10/assets";

// Assets
const OPEN_FOLDER_ICON = await FS.toURL(`${ASSETS_PATH}/open_folder.png`);
const DOCUMENTS_ICON = await FS.toURL(`${ASSETS_PATH}/search_menu/documents.svg`);
const WEB_ICON = await FS.toURL(`${ASSETS_PATH}/search_menu/web.svg`);

// Imports
const SUGGESTED_APPS = await include("./suggested.json");

async function getShortcutsList() {
    return await (await FS.walk("C:/system/programs"))
        .aFilter(async e => (await FS.isFile(e)) && (FSUtil.getExtension(e) === ".link"))
}

async function getTopApps(CONFIG, size = 6) {
    const topApps = Object.entries(CONFIG.topApps).sort((a, b) => b[1] - a[1]).slice(0, size);

    if (topApps.length < size) {
        const diff = (size - topApps.length);
        const shortcuts = (await getShortcutsList()).slice(0, diff);

        shortcuts.forEach(path => {
            topApps.push([path, 0]);
        });
    }

    return topApps;
}

function calculateScore(searchQuery, testedValue) {
    let score = 0;

    // Count the number of matching letters
    const matchingLetters = {};
    for (const letter of searchQuery) {
        if (testedValue.toLowerCase().includes(letter)) {
            if (!matchingLetters[letter])
                matchingLetters[letter] = 1;
            else
                matchingLetters[letter] += 1;
        }
    }

    // Score for matching letters
    for (const letter in matchingLetters) {
        score += matchingLetters[letter];
    }

    // Bonus points for correct order
    for (let i = 0; i < searchQuery.length && i < testedValue.length; i++) {
        if (searchQuery[i] === testedValue[i]) {
            score += 1;
        }
    }

    // Prioritize complete matches
    if (testedValue.toLowerCase().includes(searchQuery.toLowerCase())) {
        score += 5;
    }

    return score;
}

const TYPES = [
    {
        label: "All",
        async home(el, { close, CONFIG }) {
            el.innerHTML = `
                <div class="splitted">
                    <section class="suggested">
                        <strong>Suggested</strong>
                        <ul class="suggested-apps"></ul>
                    </section>
                    <section class="trends">
                        <strong>Top Apps</strong>
                        <ul class="top-apps"></ul>
                    </section>
                </div>
            `;

            // Suggested apps
            const suggestedList = el.querySelector(".suggested-apps");
            SUGGESTED_APPS.forEach(async app => {
                const args = app.action.split(" ");
                const cmd = args.shift();

                const appEl = document.createElement("li");
                appEl.innerHTML += `
                    <img src="${await Theme.getIconUrl(app.icon, "32x32")}" />
                    <span>${app.name}</span>
                `;

                appEl.addEventListener("click", () => {
                    execCmd(cmd, args);
                    close();
                });

                suggestedList.appendChild(appEl);
            });

            // Top apps
            const topAppsList = el.querySelector(".top-apps");
            const topApps = await getTopApps(CONFIG);

            topApps.forEach(async ([path]) => {
                const { action, icon } = JSON.parse(await FS.readstr(path));
                const fname = FSUtil.fname(path);
                const label = fname.slice(0, fname.lastIndexOf("."));

                const args = action.split(" ");
                const cmd = args.shift();

                const appEl = document.createElement("li");
                appEl.innerHTML = `
                    <img src="${await Theme.getIconUrl(icon, "32x32")}">
                    <span>${label}</span>
                `;

                appEl.addEventListener("click", () => {
                    execCmd(cmd, args);
                    close();
                });

                topAppsList.appendChild(appEl);
            });
        },
        find: async (query) => {
            let matches = [];

            for (const type of TYPES.filter(t => t !== DEFAULT_TYPE)) {
                const results = await type.find(query);
                matches = [...matches, ...results]
            }

            matches.sort((a, b) => {
                return (
                    (calculateScore(query, b.label) + TYPES.find(t => t.label === b.type).bonusIndex * 10) -
                    (calculateScore(query, a.label) + TYPES.find(t => t.label === a.type).bonusIndex * 10)
                );
            });

            return matches;
        }
    },
    {
        label: "Apps",
        tags: ["Apps", "App"],
        bonusIndex: 1,
        async find(query) {
            const shortcuts = await Promise.all(
                (await getShortcutsList())
                    .toSorted((a, b) => {
                        const fnameA = FSUtil.fname(a);
                        const fnameB = FSUtil.fname(b);

                        const labelA = fnameA.slice(0, fnameA.lastIndexOf("."));
                        const labelB = fnameB.slice(0, fnameB.lastIndexOf("."));

                        return calculateScore(query, labelB) - calculateScore(query, labelA);
                    })
                    .slice(0, 10)
                    .map(async path => {
                        const { icon } = JSON.parse(await FS.readstr(path));
                        const fname = FSUtil.fname(path);
                        const label = fname.slice(0, fname.lastIndexOf("."));

                        const icon16 = await Theme.getIconUrl(icon, "16x16");
                        const icon32 = await Theme.getIconUrl(icon, "32x32");

                        return ({
                            exec: ["file", path],

                            label,
                            sublabel: "App",

                            icon16,
                            icon32,

                            type: "Apps",
                            actions: [],
                        });
                    })
            );

            return shortcuts;
        },
        async home(el, { close, CONFIG }) {
            el.innerHTML = `
                <div class="trends">
                    <strong>Frequent</strong>
                    <ul class="frequent"></ul>
                </div>
            `;

            // Top apps
            const frequentList = el.querySelector(".frequent");
            const topApps = await getTopApps(CONFIG, 5);

            topApps.forEach(async ([path]) => {
                const { action, icon } = JSON.parse(await FS.readstr(path));
                const fname = FSUtil.fname(path);
                const label = fname.slice(0, fname.lastIndexOf("."));

                const args = action.split(" ");
                const cmd = args.shift();

                const appEl = document.createElement("li");
                appEl.innerHTML = `
                    <img src="${await Theme.getIconUrl(icon, "32x32")}">
                    <span>${label}</span>
                `;

                appEl.addEventListener("click", () => {
                    execCmd(cmd, args);
                    close();
                });

                frequentList.appendChild(appEl);
            });
        }
    },
    {
        label: "Documents",
        tags: ["Documents", "Document", "Doc", "Docs"],
        bonusIndex: 1,
        async find(query) {
            const docs = await Promise.all(
                (await FS.walk("C:/user/documents"))
                    .toSorted((a, b) => {
                        const labelA = FSUtil.fname(a);
                        const labelB = FSUtil.fname(b);

                        return calculateScore(query, labelB) - calculateScore(query, labelA);
                    })
                    .slice(0, 10)
                    .map(async path => {
                        const icon16 = await Theme.getFileIconUrl(path, "16x16");
                        const icon32 = await Theme.getFileIconUrl(path, "32x32");
                        const label = FSUtil.fname(path);

                        return ({
                            exec: ["file", path],

                            label,
                            sublabel: "Document",

                            icon16,
                            icon32,

                            type: "Documents",
                            actions: [
                                {
                                    label: "Open file location",
                                    icon: OPEN_FOLDER_ICON,

                                    exec: () => {
                                        execCmd("explorer", [FSUtil.getParentPath(path)])
                                    }
                                }
                            ],
                        });
                    })
            );

            return docs;
        },
        async home(el) {
            el.innerHTML = `
                <div class="start-search">
                    <div class="centered">
                        <img src="${DOCUMENTS_ICON}" />
                        <span class="title">Search documents</span>
                        <span class="subtitle">Start typing to search for documents</span>
                    </div>
                </div>
            `;
        }
    },
    {
        label: "Web",
        tags: ["Web", "Internet"],
        bonusIndex: 0,
        async find(query) {
            const search = sysConf.get("Software/InternetE/searchEngine")
                .replace("%SEARCH_QUERY%", encodeURIComponent(query).replaceAll("%2F", "+"));

            result = {
                exec: ["cmd", ["internete", [search]]],

                label: query,
                sublabel: "See more search results",

                icon32: await Theme.getIconUrl("apps/iexploder", "32x32"),
                icon16: await Theme.getIconUrl("apps/iexploder", "16x16"),

                type: "Web",
                actions: []
            };

            return [result];
        },
        async home(el) {
            el.innerHTML = `
                <div class="start-search">
                    <div class="centered">
                        <img src="${WEB_ICON}" />
                        <span class="title">Search the web</span>
                        <span class="subtitle">Start typing to search the web</span>
                    </div>
                </div>
            `;
        }
    }
];

const DEFAULT_TYPE = TYPES.find(t => !t.tags);

module.exports = {
    TYPES,
    DEFAULT_TYPE
}