// Get references to UI elements
const toggleBtn = document.getElementById('toggleBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const statusDiv = document.getElementById('status');

// Function to show status messages
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  // Hide status after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Toggle print preview
toggleBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.id) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      showStatus('Print preview toggled', 'success');
    } catch (error) {
      showStatus('Error toggling preview', 'error');
      console.error(error);
    }
  }
});

// Capture and download screenshot
screenshotBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show loading status
    showStatus('Capturing screenshot...', 'info');
    screenshotBtn.disabled = true;

    // Capture the visible tab as an image
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png'
    });

    // Create a temporary link to download the image
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `print-preview-${timestamp}.png`;
    link.href = dataUrl;
    link.click();

    showStatus('Screenshot downloaded!', 'success');
    screenshotBtn.disabled = false;
  } catch (error) {
    showStatus('Error capturing screenshot', 'error');
    console.error(error);
    screenshotBtn.disabled = false;
  }
});
