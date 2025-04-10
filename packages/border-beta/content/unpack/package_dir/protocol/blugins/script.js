const $ = (el) => document.querySelector(el);

const bluginTable = $(".blugins");

// Wait for Border API
addEventListener("borderloaded", () => {
  const { i18n } = Border;

  // Append the blugins
  Border.Blugin.blugins.forEach(async (blugin) => {
    const { meta } = blugin;

    const box = document.createElement("div");
    box.classList.add("blugin");
    box.innerHTML = `
    <div>
      <img src="../../res/img/icon32.png" />
      <div class="meta">
        <span>
          <strong class="name">${meta.name}</strong>
          <em class="version">${meta.version}</em>
        </span>
        <span class="description">${meta.description}</span>
      </div>
    </div>
    <div class="buttons">
      <button class="kill">${i18n.t("blugins.kill")}</button>
      <button ${await blugin.opts.system ? "disabled" : ""} class="toggle-active">${i18n.t(`blugins.${await Border.Blugin.isActive(blugin) ? "deactivate" : "activate"}`)}</button>
    </div>
    `;

    box.querySelector(".kill").addEventListener("click", () => {
      Border.Blugin.removeBlugin(blugin);
      box.remove();
    });

    const toggleActive = box.querySelector(".toggle-active")
    toggleActive.addEventListener("click", async () => {
      if (await Border.Blugin.isActive(blugin)) {
        await Border.Blugin.desactivateBlugin(blugin);
        toggleActive.textContent = i18n.t("blugins.activate");
      } else {
        await Border.Blugin.activateBlugin(blugin);
        toggleActive.textContent = i18n.t("blugins.deactivate");
      }
    });

    bluginTable.appendChild(box);
  });
});