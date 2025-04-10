// Wait for Border API
addEventListener("borderloaded", () => {
  console.log(Border)

  // Translate the page using the i18n system
  const html = document.querySelector("html").innerHTML;
  document.querySelector("html").innerHTML = Border.i18n.t(html);
});