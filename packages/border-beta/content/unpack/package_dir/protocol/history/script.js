const $ = (el) => document.querySelector(el);

const urlTable = $(".urls");

// Wait for Border API
addEventListener("borderloaded", () => {
  // Append the history
  Border.history.list.forEach((uri) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="#">${uri}</a>`;

    li.addEventListener("click", () => {
      Border.Tab.current.setURI(uri);
    });

    urlTable.appendChild(li);
  });

  // Make the clear button functional
  $(".clear-all").addEventListener("click", () => {
    Border.history.clear();
    Border.Tab.current.setURI("border://newtab");
  });
});