document.getElementById('save-pdf').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'savePdf' });
  window.close();
});
