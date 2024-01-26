const { Theme } = w96.ui;

class Minecraft extends WApplication {
    /**
     * Application constructor.
     */
    constructor() {
        super();
    }

    /**
     * Main entry point.
     * @param {String[]} argv The program arguments.
     */
    async main(argv) {
        super.main(argv);

        const eagPath = argv[1] ? `/_/${argv[1].replace(":", "")}` : "";

        // Create the window
        const mainwnd = this.createWindow({
            title: "Minecraft",

            taskbar: true,
            resizable: true,

            initialHeight: 480,
            initialWidth: 640,

            icon: await Theme.getIconUrl("apps/blocks", '16x16'),

            iframeFix: false,
        }, true);

        const body = mainwnd.getBodyContainer();

        const iframe = document.createElement("iframe");
        Object.assign(iframe.style, {
            width: "100%",
            height: "100%",
            border: "none",
        });

        iframe.addEventListener("load", () => {
            const win = iframe.contentWindow;

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

            function showSaveDialog(ext) {
                return new Promise(async (r) => {
                    new w96.ui.SaveFileDialog("C:/user", [ext], async (path) => {
                        r(path);
                    }).show();
                });
            }

            win.HTMLInputElement.prototype.click = async function () {
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

            win.HTMLAnchorElement.prototype.click = async function () {
                if (this.download) {
                    let data = new Uint8Array([]);

                    if (
                        this.href.startsWith("blob:") ||
                        this.href.startsWith("data:") ||
                        this.href.startsWith("http:") ||
                        this.href.startsWith("https:")
                    ) {
                        const blob = await fetch(this.href).then(r => r.blob());
                        data = new Uint8Array(await blob.arrayBuffer());
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

            win.alert = alert;
            win.open = (url) => {
                const wnd = this.createWindow({
                    title: "Minecraft",

                    initialHeight: 300,
                    initialWidth: 400,
                });

                const wndBody = wnd.getBodyContainer();

                const ifr = document.createElement("iframe");
                wndBody.appendChild(ifr);
                
                ifr.src = url;
                while (ifr.contentDocument === null) {}

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

            // Hack to make this works
            win.focus();
            win.addEventListener("click", () => {
                win.focus();
            })
        });

        body.appendChild(iframe);

        // Show the window
        mainwnd.show();
        iframe.src = eagPath;
    }
}