const $ = (el) => document.querySelector(el);

const search = $(".search");
const go = $(".go");
const versionSpan = $(".version");

// Wait for Border API
addEventListener("borderloaded", () => {
  // Add the version number to the page
  versionSpan.innerText = `${PRODUCT.NAME} v${PRODUCT.VERSION}`;

  // Set URI when searching
  function handleSearch() {
    const query = search.value;

    if (query) {
      // Get the current tab
      const tab = Border.Tab.current;
      tab.setURI(query);
    }
  }

  search.addEventListener("keydown", ({ key }) => {
    if (key !== "Enter") return;
    handleSearch();
  });

  go.addEventListener("click", handleSearch);
});