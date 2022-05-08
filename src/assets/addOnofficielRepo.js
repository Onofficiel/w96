//!wrt
(async () => {
  let srcJSON = JSON.parse(
    await w96.FS.readstr("c:/system/packages/configs/sources.json")
  );

  // Setting the correct repo version
  if (w96.sys.env.getEnv("os_ver") >= 300000) {
    srcJSON.sources.push("https://onofficiel.github.io/w96/v3");
  } else {
    srcJSON.sources.push("https://onofficiel.github.io/w96/v2");
  }

  await w96.FS.writestr(
    "c:/system/packages/configs/sources.json",
    JSON.stringify(srcJSON)
  );
  alert("Onofficiel's Repo was succesfully added to\nPackage Manager's repos");
})();
