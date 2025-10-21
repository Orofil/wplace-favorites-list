class SavedFav {
  constructor(url, name, image, coordLat, coordLon, pixelX, pixelY, areaCountry, areaName, areaNumber) {
    this.url = url;
    this.name = name;
    this.image = image; // Encoded in base64
    this.coordLat = coordLat;
    this.coordLon = coordLon;
    this.pixelX = pixelX;
    this.pixelY = pixelY;
    this.areaCountry = areaCountry;
    this.areaName = areaName;
    this.areaNumber = areaNumber;
  }
}

function getCoordinates(urlText) {
  const url = new URL(urlText);
  const params = new URLSearchParams(url.search);
  
  const lat = params.get("lat");
  const lng = params.get("lng");
  return [lat, lng];
}

function createButton(label, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

// Find share button and add onClick
function waitForShareButton() {
  const container = document.querySelector(
    "div.hide-scrollbar.flex.max-w-full.gap-1\\.5.overflow-x-auto.px-3.pb-2.pt-3.sm\\:pb-3");
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
  const { savedFavs = [] } = await browser.storage.local.get("savedFavs");

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
    const { savedFavs = [] } = await browser.storage.local.get("savedFavs");
    if (!savedFavs.some((l) => l.url === urlText)) {
      const favName = nameInput.value.trim();

      // Find the image for the fav
      const imgElement = document.querySelector("img.border-base-content\\/20.border");
      const imageBase64 = await getImageAsBase64(imgElement);

      const [coordLat, coordLon] = getCoordinates(urlText);

      const infoContainer = document.querySelector(
        "div.rounded-t-box.bg-base-100.border-base-300.sm\\:rounded-b-box.w-full.border-t.pt-2.sm\\:mb-3.sm\\:shadow-xl");
      const pixelSpan = infoContainer.querySelector("span.whitespace-nowrap");
      const pixelText = pixelSpan.innerText;
      const pixelX = pixelText.substring(pixelText.indexOf(":")+2, pixelText.indexOf(","));
      const pixelY = pixelText.substring(pixelText.indexOf(",")+2);

      const areaContainer = infoContainer.querySelector("button.btn.btn-xs.flex.gap-1.py-3.text-sm.max-sm\\:max-w-32");
      const [areaCountry, areaName, areaNumber] = Array.from(areaContainer.querySelectorAll("span"))
        .map(span => span.textContent.trim());

      const newFav = new SavedFav(urlText, favName, imageBase64, coordLat, coordLon, pixelX, pixelY, areaCountry, areaName, areaNumber);
      savedFavs.push(newFav);
      await browser.storage.local.set({ savedFavs });
    }
    saveBtn.innerText = "Saved";
    saveBtn.disabled = true;
  });
  saveBtn.classList.add("share-save-btn");
  saveBtn.classList.add("btn");
  saveBtn.classList.add("btn-primary");
  saveWrapper.appendChild(saveBtn);

  if (savedFavs.some((l) => l.url === urlText)) {
    saveBtn.innerText = "Saved";
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
  btn.title = "Favorites";
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
  
  const modalDiv = document.createElement("div");
  modalDiv.classList.add("modal-box");
  modalDiv.classList.add("max-h-11/12");
  
  const stickyHeader = document.createElement("div");
  stickyHeader.classList.add("modal-sticky-header");

  const closeForm = document.createElement("form");
  closeForm.classList.add("close-form");
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

  const backupButtonsContainer = document.createElement("div");
  backupButtonsContainer.classList.add("backup-buttons");

  createBackupButton(backupButtonsContainer);
  createImportButton(backupButtonsContainer);

  headerContainer.appendChild(backupButtonsContainer);

  stickyHeader.appendChild(closeForm);
  stickyHeader.appendChild(headerContainer);
  
  const list = document.createElement("ul");
  list.id = "favs-list";
  
  modalDiv.appendChild(stickyHeader);
  modalDiv.appendChild(list);
  
  modal.appendChild(modalDiv);
  modal.appendChild(backdrop);

  document.body.appendChild(modal);
}

async function showFavsModal() {
  const overlay = document.querySelector("#favs-list-modal");
  if (overlay) {
    overlay.open = true;
  }

  // Refresh list
  const { savedFavs = [] } = await browser.storage.local.get("savedFavs");
  const list = document.querySelector("#favs-list");
  if (!list) return;
  list.innerHTML = "";

  savedFavs.forEach((fav) => {
    const li = document.createElement("li");
    // The entire list element is clickable
    li.addEventListener("click", () => {
      window.open(fav.url, "_self");
    });

    const leftContainer = document.createElement("div");
    leftContainer.className = "left-group";

    // Thumbnail
    if (fav.image) {
      const thumbnail = document.createElement("img");
      thumbnail.src = fav.image;
      thumbnail.alt = fav.name;
      thumbnail.className = "list-thumbnail";
      leftContainer.appendChild(thumbnail);
    }

    const infoContainer = document.createElement("div");
    infoContainer.className = "info-container";

    const a = document.createElement("a");
    a.href = fav.url;
    a.textContent = fav.name;
    a.target = "_self";
    infoContainer.appendChild(a);

    const locationInfoContainer = document.createElement("div");
    locationInfoContainer.className = "location-info";

    const locationTextInfoContainer = document.createElement("div");
    locationTextInfoContainer.className = "location-text";

    // Coordinates
    const coordSpan = document.createElement("span");
    coordSpan.classList.add("small-info-text");
    coordSpan.textContent = fav.coordLat + ", " + fav.coordLon;
    locationTextInfoContainer.appendChild(coordSpan);

    // Pixel
    const pixelSpan = document.createElement("span");
    pixelSpan.classList.add("small-info-text");
    pixelSpan.textContent = "Pixel: " + fav.pixelX + ", " + fav.pixelY;
    locationTextInfoContainer.appendChild(pixelSpan);

    // Area
    const areaBtn = document.createElement("button");
    areaBtn.className = "btn btn-xs flex gap-1 py-3 text-sm max-sm:max-w-32 text-blue-600";
    
    const countrySpan = document.createElement("span");
    countrySpan.className = "font-flag tooltip";
    countrySpan.textContent = fav.areaCountry;
    
    const nameSpan = document.createElement("span");
    nameSpan.className = "line-clamp-1 text-ellipsis";
    nameSpan.textContent = fav.areaName;
    
    const numberSpan = document.createElement("span");
    numberSpan.textContent = fav.areaNumber;
    
    areaBtn.appendChild(countrySpan);
    areaBtn.appendChild(nameSpan);
    areaBtn.appendChild(numberSpan);

    locationInfoContainer.appendChild(areaBtn);
    locationInfoContainer.appendChild(locationTextInfoContainer);

    infoContainer.appendChild(locationInfoContainer);
    leftContainer.appendChild(infoContainer);


    const buttonContainer = document.createElement("div");
    buttonContainer.className = "buttons-group";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "list-btn";
    editBtn.title = "Edit name";

    editBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      let newName = prompt("Rename favorite to:", fav.name);
      if (newName === null) return;
      newName = newName.trim();
      if (!newName) return;

      // Update storage
      const { savedFavs = [] } = await browser.storage.local.get("savedFavs");
      const updated = savedFavs.map((f) =>
        f.url === fav.url ? { ...f, name: newName } : f
      );
      await browser.storage.local.set({ savedFavs: updated });

      fav.name = newName;
      a.textContent = newName;
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.className = "list-btn";
    deleteBtn.title = "Remove favorite";

    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const confirmed = confirm("Delete favorite '" + fav.name + "'?");
      if (!confirmed) return;

      // Remove from storage
      const { savedFavs = [] } = await browser.storage.local.get("savedFavs");
      const updated = savedFavs.filter((f) => f.url !== fav.url);
      await browser.storage.local.set({ savedFavs: updated });

      li.remove();
    });

    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);

    li.appendChild(leftContainer);
    li.appendChild(buttonContainer);
    list.appendChild(li);
  });
}

async function getImageAsBase64(imgElement, targetSize = 64) {
  if (!imgElement || !imgElement.src) return null;
  try {
    // Image as Blob
    const response = await fetch(imgElement.src);
    const blob = await response.blob();

    // Blob to HTMLImageElement
    const bitmap = await createImageBitmap(blob);

    // Crop area
    const side = Math.min(bitmap.width, bitmap.height);
    const cropX = (bitmap.width - side) / 2;
    const cropY = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Crop and fit the image to the canvas size
    ctx.drawImage(
      bitmap,
      cropX, cropY, side, side,
      0, 0, targetSize, targetSize
    );

    // Convert the canvas back to Base64
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error resizing image:", err);
    return null;
  }
}

function createBackupButton(container) {
  const backupBtn = document.createElement("button");
  backupBtn.textContent = "Backup";
  backupBtn.classList.add("btn");

  backupBtn.addEventListener("click", async () => {
    const { savedFavs = [] } = await browser.storage.local.get("savedFavs");
    if (savedFavs.length === 0) {
      alert("No favorites to back up.");
      return;
    }

    const data = JSON.stringify(savedFavs, null, 2);
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .replace(/\..+/, ""); // Remove milliseconds
    const filename = `wplace-favorites_${timestamp}.json`;

    // Download using background script
    browser.runtime.sendMessage({ action: "backup", data, filename });
  });

  container.appendChild(backupBtn);
}

function createImportButton(container) {
  const importBtn = document.createElement("button");
  importBtn.textContent = "Import";
  importBtn.classList.add("btn");

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.style.display = "none";

  importBtn.addEventListener("click", () => {
    fileInput.click(); // Trigger file picker
  });

  fileInput.addEventListener("change", async () => {
    if (!fileInput.files.length) return;
    const file = fileInput.files[0];

    try {
      const text = await file.text();
      const importFavs = JSON.parse(text);

      if (!Array.isArray(importFavs)) {
        alert("Invalid backup file format.");
        return;
      }

      const { savedFavs = [] } = await browser.storage.local.get("savedFavs");

      // Append imported favorites, but not duplicate URLs
      const mergedFavs = [...savedFavs];
      let imported = 0;
      importFavs.forEach(link => {
        if (!mergedFavs.some(other => other.url === link.url)) {
          mergedFavs.push(link);
          imported++;
        }
      });

      await browser.storage.local.set({ savedFavs: mergedFavs });

      showFavsModal();

      console.log(`Imported ${imported} out of ${importFavs.length} favs. Total favs: ${mergedFavs.length}`);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import backup file.");
    }

    fileInput.value = "";
  });

  container.appendChild(importBtn);
  container.appendChild(fileInput);
}

// Run setup
setInterval(initFavsModal, 1000);
setInterval(waitForShareButton, 1000);
setInterval(createListButton, 2000);