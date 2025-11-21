// Track tabs that are in print preview mode
const printPreviewTabs = new Set();

// Check if URL is valid for debugger attachment
function isValidUrl(url) {
  if (!url) return false;

  // Debugger cannot attach to chrome:// pages, extension pages, or webstore
  const restrictedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'chrome.google.com/webstore'
  ];

  return !restrictedPrefixes.some(prefix => url.startsWith(prefix));
}

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url) {
    console.error("No URL found for current tab");
    return;
  }

  // Check if URL is valid for debugger
  if (!isValidUrl(tab.url)) {
    console.error("Cannot preview this page type:", tab.url);
    alert("Print preview cannot be used on this page (restricted URL)");
    return;
  }

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
    chrome.debugger.attach({ tabId: newTab.id }, "1.3", () => {
      if (chrome.runtime.lastError) {
        console.error("Debugger attach failed:", chrome.runtime.lastError.message || chrome.runtime.lastError);
        alert("Failed to attach debugger: " + (chrome.runtime.lastError.message || "Unknown error"));
        // Close the blank tab since we failed
        chrome.tabs.remove(newTab.id);
        printPreviewTabs.delete(newTab.id);
        return;
      }

      // Enable print media emulation BEFORE loading the actual page
      chrome.debugger.sendCommand(
        { tabId: newTab.id },
        "Emulation.setEmulatedMedia",
        { media: "print" },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Emulation failed:", chrome.runtime.lastError.message || chrome.runtime.lastError);
            alert("Failed to enable print emulation: " + (chrome.runtime.lastError.message || "Unknown error"));
            // Close the tab since emulation failed
            chrome.tabs.remove(newTab.id);
            printPreviewTabs.delete(newTab.id);
            return;
          }

          console.log("Print media emulation enabled for tab", newTab.id);

          // Now navigate to the target URL - it will load with print styles
          chrome.tabs.update(newTab.id, { url: targetUrl }).catch((error) => {
            console.error("Failed to navigate:", error);
          });
        }
      );
    });
  } catch (error) {
    console.error("Error creating print preview tab:", error);
    alert("Error creating print preview: " + error.message);
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
