$$IncludeOnce("./iframe.js");

const { Theme, DialogCreator } = w96.ui;

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

        // Create the window
        const mainwnd = this.createWindow({
            title: "Minecraft 1.8.8",

            taskbar: true,
            resizable: true,

            initialHeight: 480,
            initialWidth: 640,

            icon: await Theme.getIconUrl("apps/blocks", '16x16')
        }, true);

        const body = mainwnd.getBodyContainer();

        // Initialize the game
        const iframe = initIframe(this);
        body.appendChild(iframe);

        // Start the game
        mainwnd.show();
        await startFrameGame();
    }

    /**
     * On shutdown.
     */
    async ontermination() {
        await super.ontermination();
        cleanupFrameResources();
    }
}