// A simple state-tracking variable on the window object
const stateKey = '__printPreviewActive';

// Function to enable print preview
function enablePrintPreview() {
  const sheets = document.styleSheets;
  for (const sheet of sheets) {
    const ownerNode = sheet.ownerNode;
    // Only process link and style tags
    if (ownerNode instanceof HTMLLinkElement || ownerNode instanceof HTMLStyleElement) {
      // Store the original media attribute in a data attribute
      ownerNode.dataset.originalMedia = ownerNode.media;
      // Force the media type to 'print'
      ownerNode.media = 'print';
    }
  }
  window[stateKey] = true;
  console.log('Print preview enabled.');
}

// Function to disable print preview and restore original styles
function disablePrintPreview() {
  // Find all nodes where we stored the original media type
  const nodes = document.querySelectorAll('[data-original-media]');
  for (const node of nodes) {
    // Restore the original media attribute
    node.media = node.dataset.originalMedia;
    // Clean up by removing the data attribute
    delete node.dataset.originalMedia;
  }
  window[stateKey] = false;
  console.log('Print preview disabled.');
}

// Toggle the preview state
function togglePrintPreview() {
  if (window[stateKey]) {
    disablePrintPreview();
  } else {
    enablePrintPreview();
  }
}

// Run the toggle function
togglePrintPreview();
