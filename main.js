class SavedFav {
  constructor(url, name) {
    this.url = url;
    this.name = name;
  }
}

// Get legible coordinates from a URL
function cleanCoordinates(urlText) {
  const url = new URL(urlText);
  const params = new URLSearchParams(url.search);
  
  const lat = Math.round(parseFloat(params.get("lat")) * 1_000_000) / 1_000_000.0;
  const lng = Math.round(parseFloat(params.get("lng")) * 1_000_000) / 1_000_000.0;
  const coords = lat + ", " + lng;
  return coords;
}

function createButton(label, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

// Get share button
const shareContainerSelector =
  "div.hide-scrollbar.flex.max-w-full.gap-1\\.5.overflow-x-auto.px-3.pb-2.pt-3.sm\\:pb-3";

// Find share button and add onClick
function waitForShareButton() {
  const container = document.querySelector(shareContainerSelector);
  if (!container) return;

  const shareBtn = [...container.querySelectorAll("button")].find((btn) =>
    btn.textContent.includes("Share")
  );

  if (shareBtn && !shareBtn.dataset.hasListener) {
    shareBtn.dataset.hasListener = "true";
    shareBtn.addEventListener("click", () => {
      setTimeout(createSaveButtonInModal, 500);
    });
  }
}

// Share button click
async function createSaveButtonInModal() {
  const input = document.querySelector(
    "input.text-base-content\\/80.min-w-10.grow.text-sm.font-medium"
  );
  if (!input) return;

  // Get URL, remove zoom parameter
  let urlText = input.value.trim()
  const url = new URL(urlText);
  if (!url) return;
  const params = new URLSearchParams(url.search);
  params.delete("zoom");
  urlText = urlText.substring(0, urlText.indexOf("?") + 1);
  urlText += params;

  const parent = input.parentElement?.parentElement;
  if (!parent) return;

  const h3 = parent.querySelector("h3:not(.share-save-header)");
  if (!h3 || !h3.parentElement) return;

  // Remove previously created elements
  const oldWrapper = parent.querySelector(".share-save-wrapper");
  if (oldWrapper) oldWrapper.remove();
  const oldHeader = parent.querySelector(".share-save-header");
  if (oldHeader) oldHeader.remove();

  // Get storage
  const { savedFavs = [] } = await browser.storage.sync.get("savedFavs");

  const header = document.createElement("h3");
  header.innerText = "⭐ Save to favorites";
  header.classList.add("share-save-header");
  header.classList.add("flex");
  header.classList.add("items-center");
  header.classList.add("gap-1.5");
  header.classList.add("text-xl");
  header.classList.add("font-bold");

  // Input and save button
  const wrapper = document.createElement("div");
  wrapper.classList.add("share-save-wrapper");
  wrapper.classList.add("border-base-content/20");
  wrapper.classList.add("rounded-field");
  wrapper.classList.add("mt-3");
  wrapper.classList.add("flex");
  wrapper.classList.add("w-full");
  wrapper.classList.add("items-center");
  wrapper.classList.add("gap-1");
  wrapper.classList.add("border-2");
  wrapper.classList.add("py-1.5");
  wrapper.classList.add("pl-4");
  wrapper.classList.add("pr-2.5");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Name for the favorite";
  nameInput.classList.add("text-base-content/80");
  nameInput.classList.add("min-w-10");
  nameInput.classList.add("grow");
  nameInput.classList.add("text-md");
  nameInput.classList.add("font-medium");

  const saveWrapper = document.createElement("div");
  saveWrapper.classList.add("h-10");

  const saveBtn = createButton("Save to Favorites", async () => {
    const { savedFavs = [] } = await browser.storage.sync.get("savedFavs");
    if (!savedFavs.some((l) => l.url === urlText)) {
      const favName = nameInput.value.trim() || cleanCoordinates(urlText); // Coordinates as default name
      const newFav = new SavedFav(urlText, favName); 
      savedFavs.push(newFav);
      await browser.storage.sync.set({ savedFavs });
    }
    saveBtn.disabled = true;
  });
  saveBtn.classList.add("share-save-btn");
  saveBtn.classList.add("btn");
  saveBtn.classList.add("btn-primary");
  saveWrapper.appendChild(saveBtn);

  if (savedFavs.some((l) => l.url === urlText)) {
    saveBtn.disabled = true;
  }

  wrapper.appendChild(nameInput);
  wrapper.appendChild(saveWrapper);

  h3.parentElement.insertBefore(wrapper, h3);
  h3.parentElement.insertBefore(header, wrapper);
}

// Listing button
function createListButton() {
  const container = document.querySelector(
    "div.flex.flex-col.items-center.gap-3"
  );
  if (!container) return;

  if (container.querySelector(".favs-list-btn")) return;

  const btn = createButton("⭐", showFavsModal);
  btn.classList.add("favs-list-btn");
  btn.classList.add("indicator");
  btn.classList.add("btn");
  btn.classList.add("btn-square");
  btn.classList.add("relative");
  btn.classList.add("shadow-md");
  container.appendChild(btn);
}

// Favs list modal
async function initFavsModal() {
  if (document.querySelector("#favs-list-modal")) return;

  const backdrop = document.createElement("form");
  backdrop.classList.add("modal-backdrop");
  backdrop.method = "dialog";

  const closeBackdrop = createButton("close", () => {});
  backdrop.appendChild(closeBackdrop);
  
  const modal = document.createElement("dialog");
  modal.id = "favs-list-modal";
  modal.classList.add("modal");
  
  const modalBox = document.createElement("div");
  modalBox.classList.add("modal-box");
  modalBox.classList.add("max-h-11/12");
  
  const closeForm = document.createElement("form");
  closeForm.method = "dialog";
  
  const close = createButton("✕", () => {});
  close.classList.add("btn");
  close.classList.add("btn-sm");
  close.classList.add("btn-circle");
  close.classList.add("btn-ghost");
  close.classList.add("absolute");
  close.classList.add("right-2");
  close.classList.add("top-2");
  close.style.zIndex = 2;
  closeForm.appendChild(close);

  const headerContainer = document.createElement("div");
  headerContainer.classList.add("modal-header");

  const header = document.createElement("h3");
  header.innerText = "⭐ Favorite locations";
  header.classList.add("flex");
  header.classList.add("items-center");
  header.classList.add("gap-1.5");
  header.classList.add("text-xl");
  header.classList.add("font-bold");
  headerContainer.appendChild(header);
  
  const list = document.createElement("ul");
  list.id = "favs-list";
  
  modalBox.appendChild(closeForm);
  modalBox.appendChild(headerContainer);
  modalBox.appendChild(list);
  
  modal.appendChild(modalBox);
  modal.appendChild(backdrop);

  document.body.appendChild(modal);
}

async function showFavsModal() {
  const overlay = document.querySelector("#favs-list-modal");
  if (overlay) {
    overlay.open = true;
  }

  // Refresh list
  const { savedFavs = [] } = await browser.storage.sync.get("savedFavs");
  const list = document.querySelector("#favs-list");
  if (!list) return;
  list.innerHTML = "";

  savedFavs.forEach((fav) => {
    const li = document.createElement("li");
    li.addEventListener("click", () => {
      window.open(fav.url, "_self");
    });

    const a = document.createElement("a");
    a.href = fav.url;
    a.textContent = fav.name;
    a.target = "_self";

    // Delete button
    const trash = document.createElement("button");
    trash.textContent = "🗑️";
    trash.className = "delete-btn";
    trash.title = "Remove favorite";

    trash.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Remove from storage
      const { savedFavs = [] } = await browser.storage.sync.get("savedFavs");
      const updated = savedFavs.filter((f) => f.url !== fav.url);
      await browser.storage.sync.set({ savedFavs: updated });

      li.remove();
    });

    li.appendChild(a);
    li.appendChild(trash);
    list.appendChild(li);
  });
}

// Run setup
setInterval(initFavsModal, 1000);
setInterval(waitForShareButton, 1000);
setInterval(createListButton, 2000);