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
  const params = new URLSearchParams(url.search);
  params.delete("zoom");
  urlText = urlText.substring(0, urlText.indexOf("?") + 1);
  urlText += params;
  if (!urlText) return;

  const parent = input.parentElement?.parentElement;
  if (!parent) return;

  const h3 = parent.querySelector("h3");
  if (!h3) return;

  // Remove any previously inserted Save button
  const oldBtn = parent.querySelector(".share-save-btn");
  if (oldBtn) oldBtn.remove();

  // Get storage
  const { savedTexts = [] } = await browser.storage.sync.get("savedTexts");

  const saveBtn = createButton("Save to Favorites", async () => {
    const { savedTexts = [] } = await browser.storage.sync.get("savedTexts");
    if (!savedTexts.includes(urlText)) {
      savedTexts.push(urlText);
      await browser.storage.sync.set({ savedTexts });
    }
    saveBtn.disabled = true;
  });
  saveBtn.classList.add("share-save-btn");
  saveBtn.classList.add("btn");
  saveBtn.classList.add("btn-primary");
  saveBtn.style.width = "160px";
  saveBtn.style.marginBottom = "10px";

  if (savedTexts.includes(urlText)) {
    saveBtn.disabled = true;
  }

  h3.parentElement.insertBefore(saveBtn, h3);
}

// Listing button
function createListButton() {
  const container = document.querySelector(
    "div.flex.flex-col.items-center.gap-3"
  );
  if (!container) return;

  if (container.querySelector(".favs-list-btn")) return;

  const btn = createButton("Favs", showFavsModal);
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
  closeForm.appendChild(close);
  
  const list = document.createElement("ul");
  list.id = "favs-list";
  
  modalBox.appendChild(closeForm);
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
  const { savedTexts = [] } = await browser.storage.sync.get("savedTexts");
  const list = document.querySelector("#favs-list");
  if (!list) return;
  list.innerHTML = "";
  savedTexts.forEach((txt) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = txt;
    a.textContent = txt;
    a.target = "_self";
    a.style.display = "block";
    a.style.margin = "5px 0";
    li.appendChild(a);
    list.appendChild(li);
  });
}

// Run setup
setInterval(initFavsModal, 1000);
setInterval(waitForShareButton, 1000);
setInterval(createListButton, 2000);