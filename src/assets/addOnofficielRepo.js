(async () => {
  let srcJSON = JSON.parse(
    await w96.FS.readstr("c:/system/packages/configs/sources.json")
  );
  srcJSON.sources.push("https://onofficiel.github.io/w96");
  await w96.FS.writestr(
    "c:/system/packages/configs/sources.json",
    JSON.stringify(srcJSON)
  );
  alert("Onofficiel's Repo was succesfully added to\nPackage Manager's repos");
})();
