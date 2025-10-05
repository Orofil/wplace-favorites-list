let activeBlobUrls = [];

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "backup") {
    const blob = new Blob([message.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    activeBlobUrls.push(url);

    browser.downloads.download({
      url,
      filename: message.filename,
      saveAs: true
    }).then((downloadId) => {
      // When download finishes, release the blob URL
      browser.downloads.onChanged.addListener(function cleanup(delta) {
        if (delta.id === downloadId && delta.state?.current === "complete") {
          URL.revokeObjectURL(url);
          activeBlobUrls = activeBlobUrls.filter(u => u !== url);
          browser.downloads.onChanged.removeListener(cleanup);
        }
      });
    }).catch(err => {
      console.error("Download failed:", err);
      URL.revokeObjectURL(url);
    });
  }
});