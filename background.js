// Track tabs that are in print preview mode
const printPreviewTabs = new Set();

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url) return;

  try {
    const targetUrl = tab.url;

    // Create a new tab with about:blank first
    const newTab = await chrome.tabs.create({
      url: 'about:blank',
      active: true
    });

    // Mark this tab as a print preview tab
    printPreviewTabs.add(newTab.id);

    // Attach debugger to the blank tab
    chrome.debugger.attach({ tabId: newTab.id }, "1.3", async () => {
      if (chrome.runtime.lastError) {
        console.error("Debugger attach failed:", chrome.runtime.lastError);
        return;
      }

      // Enable print media emulation BEFORE loading the actual page
      chrome.debugger.sendCommand(
        { tabId: newTab.id },
        "Emulation.setEmulatedMedia",
        { media: "print" },
        async () => {
          if (chrome.runtime.lastError) {
            console.error("Emulation failed:", chrome.runtime.lastError);
            return;
          }

          console.log("Print media emulation enabled for tab", newTab.id);

          // Now navigate to the target URL - it will load with print styles
          try {
            await chrome.tabs.update(newTab.id, { url: targetUrl });
          } catch (error) {
            console.error("Failed to navigate:", error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error creating print preview tab:", error);
  }
});

// Clean up when print preview tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (printPreviewTabs.has(tabId)) {
    printPreviewTabs.delete(tabId);
    // Debugger will auto-detach when tab closes
  }
});

// Handle debugger detach events
chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId) {
    printPreviewTabs.delete(source.tabId);
    console.log("Debugger detached from tab", source.tabId, "Reason:", reason);
  }
});
