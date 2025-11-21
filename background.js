// Track tabs that are in print preview mode
const printPreviewTabs = new Set();

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url) return;

  try {
    // Create a new tab with the same URL
    const newTab = await chrome.tabs.create({
      url: tab.url,
      active: true
    });

    // Mark this tab as a print preview tab
    printPreviewTabs.add(newTab.id);

    // Wait for the tab to finish loading before attaching debugger
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === newTab.id && changeInfo.status === 'complete') {
        // Remove this listener
        chrome.tabs.onUpdated.removeListener(listener);

        // Attach debugger and enable print emulation
        chrome.debugger.attach({ tabId: newTab.id }, "1.3", () => {
          if (chrome.runtime.lastError) {
            console.error("Debugger attach failed:", chrome.runtime.lastError);
            return;
          }

          // Enable print media emulation
          chrome.debugger.sendCommand(
            { tabId: newTab.id },
            "Emulation.setEmulatedMedia",
            { media: "print" },
            () => {
              if (chrome.runtime.lastError) {
                console.error("Emulation failed:", chrome.runtime.lastError);
              } else {
                console.log("Print media emulation enabled for tab", newTab.id);
              }
            }
          );
        });
      }
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
