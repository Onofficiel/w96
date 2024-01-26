const appTile = document.querySelector(".centered");
const iframe = document.querySelector("iframe");

const status = appTile.querySelector(".status");
const info = appTile.querySelector(".info");
const logs = appTile.querySelector(".logs");

const rootfsUrl = `https://windows96.net/?live=1&faster=1&rootfs=https://onofficiel.github.io/w96/rootfs.zip`;

iframe.addEventListener("load", () => {
    appTile.style.visibility = "visible";

    iframe.classList.add("loading");

    status.innerText = "Loading...";
    info.querySelector(".icon").src = "./src/img/onoff-typo.svg";
    info.querySelector(".name").innerText = "We're loading everything for you";
    info.querySelector(".description").innerText = "This won't be long";
    logs.innerText = "Booting up...";
});

// Wait for any message post
window.addEventListener("message", async (event) => {
    // Check if the message is from the iframe
    if (event.source !== iframe.contentWindow)
        return;

    const { data } = event;
    const [type, content] = data;

    // Type checking
    if (type === "onoff-complete") {
        status.innerText = "Complete!";
        info.querySelector(".icon").src = "./src/img/onoff-typo.svg";
        info.querySelector(".name").innerText = "The environment is ready";
        logs.innerText = ":)";

        // Wait for 1s
        await new Promise(resolve => setTimeout(resolve, 1000));

        appTile
            .animate({ opacity: 0, translate: "0 10px" }, { duration: 200, easing: "ease" })
            .addEventListener("finish", () => {
                appTile.style.visibility = "hidden";
                iframe.classList.remove("loading");
            });
    }
    else if (type === "onoff-install-package") {
        const { pkg } = content;

        info.innerHTML = `
            <img
                src="${pkg.iconFiles["32x32"]}"
                alt="Package Icon"
                class="icon"
            />
            <div class="side-info">
                <strong class="name">${pkg.friendlyName}</strong>
                <div class="description">${pkg.description}</div>
            </div>
        `;
    }
    else if (type === "onoff-install-info") {
        const { msg } = content;
        logs.innerText = msg.message;
    }
});

// Init the iframe
iframe.src = rootfsUrl;