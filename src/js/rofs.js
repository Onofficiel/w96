(() => {
  if (!location.hash) return;
  if (!location.hash.startsWith("#/")) return;
  let path = location.hash.slice(1);
  if (!path) return (location.href = location.origin + location.pathname);

  if (!location.search)
    location.href = `${location.origin + location.pathname}?v3/${
      location.hash
    }`;
  let rel = location.search.slice(1);
  if (rel.endsWith("/")) rel = rel.slice(0, rel.lastIndexOf("/"));

  console.log(rel);

  if (path.endsWith("/") && path !== "/") path = path.slice(0, path.length - 1);

  // Define vars
  const card = document.querySelector(".centered");
  card.style.top = "80px";
  card.style.top = "80px";
  card.innerHTML = `
    <h2>${path}</h2>
    <hr />
    <br />
  `;

  const ext = {
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".gif": "image",
    ".svg": "image",

    ".txt": "file",
    ".zip": "archive",

    ".py": "python",
    ".bjs": "border",
  };

  fetch(location.pathname + rel + "/rofs.json")
    .catch((e) => {
      card.innerText += "Can't map the files... Sorry :/";
    })
    .then((r) => r.json())
    .then((rofs) => {
      const rPath = rofs[path];
      if (!rPath)
        return (card.innerHTML += "<i>404, File not found... ಥ_ಥ</i>");

      if (rPath.type === 0) {
        fetch(location.pathname + rel + path)
          .then((r) => r.text())
          .then((file) => {
            const fileExt = ext[path.slice(path.lastIndexOf("."))];

            if (fileExt === "image") {
              card.innerHTML += `<img
                style="
                  image-rendering: pixelated;
                  background: url(src/img/no-bg.png) round;"
                src="${location.pathname + rel}/${path}"
              />`;
            } else if (fileExt === "archive") {
              card.innerHTML += `<i>Cannot open archives</i>`;
            } else {
              card.innerHTML += `<pre>${file}</pre>`;
            }
          });
      } else {
        if (!path.endsWith("/")) path += "/";

        const backTile = document.createElement("div");
        backTile.innerHTML = `
        <img height="20" style="padding-right: 5px" src="${location.pathname}src/icons/folder.svg" />
        <span>.. (Go Back)</span>
      `;

        Object.assign(backTile.style, {
          display: "flex",
          margin: "5px 0",
          cursor: "pointer",
        });

        backTile.addEventListener("click", () => {
          const p = path.slice(
            0,
            path.slice(0, path.length - 1).lastIndexOf("/")
          );

          console.log(p);
          location.href = `${location.origin + location.pathname}?${rel}/#${
            p ? p : "/"
          }`;
          location.reload();
        });

        card.appendChild(backTile);

        Object.entries(rofs).forEach((_path) => {
          const relPath = _path[0].slice(path.length);

          if (_path[0].startsWith(path) && !relPath.includes("/") && relPath) {
            const tile = document.createElement("div");
            tile.innerHTML = `
            <img height="20" style="padding-right: 5px" src="${`${
              location.pathname
            }src/icons/${
              _path[1].type === 1
                ? "folder"
                : ext[relPath.slice(relPath.lastIndexOf("."))] || "file"
            }.svg`}" />
            <span>${relPath}</span>
            `;

            Object.assign(tile.style, {
              display: "flex",
              margin: "5px 0",
              cursor: "pointer",
            });
            tile.addEventListener("click", () => {
              location.href = `${location.origin + location.pathname}?${rel}/#${
                _path[0]
              }`;
              location.reload();
            });

            card.appendChild(tile);
          }
        });
      }
    });
})();
