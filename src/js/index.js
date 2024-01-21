const appTile = document.querySelector(".centered");
const iframe = document.querySelector("iframe");

// Init the iframe
iframe.src = `https://windows96.net/?live=1&rootfs=${window.location.origin}/rootfs.zip`;