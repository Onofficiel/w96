const $ = (el) => document.querySelector(el);

const tbody = $(".table>tbody");
const table = $(".table");
const copyright = $(".copyright");

const addRow = (label, value) =>
  (tbody.innerHTML += `
    <tr>
      <td class="label">${label}</td>
      <td class="value">${value}</td>
    </tr>`);

// Wait for Border API
addEventListener("borderloaded", async () => {
  const { rel } = w96.sys;
  const { i18n } = Border;

  copyright.innerText = `${PRODUCT.AUTHOR}\n${PRODUCT.COPYRIGHT}.\nAll right reserved.`;

  addRow(i18n.t("{{version.browser_version}}"), `${PRODUCT.VERSION}`);
  addRow(i18n.t("{{version.blugin_runtime_version}}"), `${RT_VERSION}`);
  addRow(i18n.t("{{version.os_version}}"), `${rel.getVersionString()} ${rel.getReleaseChannel()} (Build ${await rel.getBuildId()})`)
  addRow(i18n.t("{{version.command_line}}"), `${Border.ctx.execCtx.boxedEnv.args.join(" ")}`);
  addRow(i18n.t("{{version.binary_path}}"), `${Border.ctx.execCtx.launchCommand}`);
  addRow(i18n.t("{{version.user_agent}}"), `${navigator.userAgent}`);
});