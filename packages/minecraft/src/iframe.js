$$IncludeOnce("./assets.js");

/** @type {HTMLIFrameElement} */
let game_frame = null;

const blobRegister = [];

/**
 * Registers iframe events.
 * @param {Minecraft} app The app instance.
 */
function registerFrameEvents(app) {
    game_frame.addEventListener("load", () => {
        const win = game_frame.contentWindow;

        // Change the file input to open w96 files
        function showOpenDialog() {
            return new Promise(async (r) => {
                new w96.ui.OpenFileDialog("C:/user", [""], async (path) => {
                    if (!path) return r(null);

                    const blob = await FS.toBlob(path);
                    const file = new File([blob], FSUtil.fname(path), { type: blob.type })

                    return r(file);
                }).show();
            });
        }

        win.HTMLInputElement.prototype.__click = win.HTMLInputElement.prototype.click;
        win.HTMLInputElement.prototype.click = async function () {
            if (!this.files) {
                this.__click();
                return;
            }

            const file = await showOpenDialog();
            if (!file) return;

            const event = new Event("change", {});

            // Create the file list
            const dt = new DataTransfer();
            dt.items.add(file);
            this.files = dt.files;

            Object.defineProperty(event, 'target', { writable: false, value: this });

            this.dispatchEvent(event);
        }

        // Change the download link to save files in w96
        win.HTMLAnchorElement.prototype.click = async function () {
            if (this.download) {
                let data = new Uint8Array([]);

                if (
                    this.href.startsWith("blob:") ||
                    this.href.startsWith("data:") ||
                    this.href.startsWith("http:") ||
                    this.href.startsWith("https:")
                ) {
                    let blob;
                    try {
                        // Fetch the file at the URL
                        blob = await fetch(this.href).then(r => r.blob());
                    } catch (e) {
                        DialogCreator.alert(
                            `Error while fetching the file.`,
                            { icon: "error", title: "Minecraft" }
                        );
                        return;
                    }

                    data = new Uint8Array(await blob.arrayBuffer());
                } else {
                    // Cannot download the file
                    DialogCreator.alert(
                        `Cannot save this file.`,
                        { icon: "error", title: "Minecraft" }
                    );
                    return;
                }

                const path = await showSaveDialog(FSUtil.getExtension(this.download));
                if (!path) return;

                const parent = FSUtil.getParentPath(path);

                if (!(await FS.exists(parent)))
                    await FS.mkdir(parent);

                await FS.writebin(path, data);
            } else {
                w96.urlopen(this.href);
            }
        }

        // Change the alert function to use embedded alert windows
        win.alert = alert;

        // Change the open function to open embedded w96 windows
        win.open = (url) => {
            const wnd = app.createWindow({
                title: "Minecraft",

                initialHeight: 300,
                initialWidth: 400,
            });

            const wndBody = wnd.getBodyContainer();

            const ifr = document.createElement("iframe");
            wndBody.appendChild(ifr);

            ifr.src = url;
            while (ifr.contentDocument === null) { } // Wait syncronously until the iframe is fully loaded

            Object.assign(ifr.style, {
                width: "100%",
                height: "100%",
                border: "none",
            });

            const ifrWin = ifr.contentWindow;

            // Changes
            ifrWin.close = () => wnd.close();

            wnd.show();

            return ifrWin;
        }

        // Hack to make the iframe receive events
        function focusGame() {
            win.focus();
        }

        win.addEventListener("blur", () => {
            win.addEventListener("click", focusGame);
        });

        win.addEventListener("focus", () => {
            win.removeEventListener("click", focusGame);
        })

        win.addEventListener("click", focusGame);
        focusGame();
    });
}

/**
 * Constructs a new iframe document.
 */
async function constructIframeDocument() {
    // Preproc does not like inline statements
    let frameCode = `
$$IncludeOnce("./ui/frame.html");
`;

    // Process static files
    for (let file of gameStaticFiles) {
        let assetPath;

        try {
            assetPath = FSUtil.resolvePath(`C:/local/minecraft/data`, file.path);
            const blobURL = URL.createObjectURL(await FS.toBlob(assetPath));
            frameCode = frameCode.replaceAll(`%URL_STATICFILE_${file.name}%`, blobURL);
            blobRegister.push(blobURL);
            console.log(`Asset file "${file.path}" loaded -> ${blobURL}`);
        } catch (e) {
            DialogCreator.alert(
                `Failed to load asset file ${assetPath}.`,
                { icon: "error", title: "Minecraft" }
            );
        }
    }

    return frameCode;
}

/**
 * Cleans up iframe resources.
 */
function cleanupFrameResources() {
    blobRegister.forEach((v) => URL.revokeObjectURL(v));
}

/**
 * Initializes the game iframe.
 * @param {Minecraft} app The app instance.
 */
function initIframe(app) {
    game_frame = document.createElement("iframe");
    Object.assign(game_frame.style, {
        width: "100%",
        height: "100%",
        border: "none"
    });

    registerFrameEvents(app);

    return game_frame;
}

/**
 * Starts the game.
 */
async function startFrameGame() {
    game_frame.srcdoc = await constructIframeDocument();
}