chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'savePdf') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        // Inject content script for direct PDF generation
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).catch(error => {
          console.error('Script injection failed:', error);
        });
      }
    });
  }
  
  if (request.action === 'generateDirectPDF') {
    // Start icon animation
    animateIcon(true);
    
    // Use chrome.debugger to generate PDF directly
    generatePDFWithDebugger(request.options)
      .then(result => {
        // Stop icon animation
        animateIcon(false);
        
        // Show system notification on success
        if (result.success) {
          showSavedNotification(result.filename);
        }
        
        sendResponse(result);
      })
      .catch(error => {
        // Stop icon animation on error
        animateIcon(false);
        console.error('PDF generation failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  return true;
});

// Icon animation functions
let animationInterval;
let animationFrame = 0;

// Simple working icon animation with badges and original icons
function animateIcon(start) {
  if (start) {
    // Clear any existing animation
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    
    // Reset to original icons and use badges for animation
    chrome.action.setIcon({ path: "icons/icon48.png" });
    chrome.action.setTitle({ title: 'Generating PDF...' });
    
    // Simple rotating line animation
    const loadingFrames = ['|', '/', '−', '\\'];
    animationFrame = 0;
    
    animationInterval = setInterval(() => {
      const frame = loadingFrames[animationFrame % loadingFrames.length];
      chrome.action.setBadgeText({ text: frame });
      chrome.action.setBadgeBackgroundColor({ color: '#6B7280' }); // Neutral gray
      animationFrame++;
    }, 200);
    
  } else {
    // Stop animation
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
    
    // Show success badge briefly
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#374151' }); // Dark gray
    
    // Return to default state after 2 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: 'Web to PDF - Click to save current page as PDF' });
    }, 2000);
  }
}

// Show system notification when PDF is saved
function showSavedNotification(filename) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '📄 PDF Saved Successfully!',
    message: `File saved: ${filename}`,
    priority: 1
  }, (notificationId) => {
    // Auto-clear notification after 4 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 4000);
  });
}

// Initialize icon on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.action.setIcon({ path: "icons/icon48.png" });
  chrome.action.setBadgeText({ text: '' });
});

// Initialize icon when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setIcon({ path: "icons/icon48.png" });
  chrome.action.setBadgeText({ text: '' });
});

// Add click handler for the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Same functionality as popup button - inject content script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }).catch(error => {
    console.error('Script injection failed:', error);
  });
});

async function generatePDFWithDebugger(options = {}) {
  let tabId;
  
  try {
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    tabId = tabs[0].id;
    const tab = tabs[0];
    
    // Attach debugger
    await chrome.debugger.attach({ tabId }, '1.3');
    console.log('Debugger attached to tab:', tabId);
    
    // Enable necessary domains
    await chrome.debugger.sendCommand({ tabId }, 'Page.enable');
    await chrome.debugger.sendCommand({ tabId }, 'DOM.enable');
    await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');
    
    // Try to emulate screen media before PDF generation
    try {
      await chrome.debugger.sendCommand({ tabId }, 'Emulation.setEmulatedMedia', {
        media: 'screen'
      });
      console.log('Successfully set media emulation to screen');
    } catch (emulationError) {
      console.warn('Media emulation failed, continuing without it:', emulationError);
    }
    
    // Add CSS to hide our notification during PDF generation
    try {
      await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: `
          // Hide our notification
          const notification = document.getElementById('web2pdf-notification');
          if (notification) notification.style.display = 'none';
          
          // Also add print CSS to hide it completely
          const style = document.createElement('style');
          style.innerHTML = '@media print { #web2pdf-notification { display: none !important; } }';
          document.head.appendChild(style);
        `
      });
    } catch (hideError) {
      console.warn('Could not hide notification:', hideError);
    }

    // Configure PDF generation with minimal margins
    const pdfOptions = {
      printBackground: true,
      preferCSSPageSize: false,
      paperWidth: 8.5,
      paperHeight: 11,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      displayHeaderFooter: false,
      transferMode: 'ReturnAsBase64',
      generateDocumentOutline: false,
      generateTaggedPDF: true
    };
    
    console.log('Generating screen-accurate PDF with options:', pdfOptions);
    
    // Generate PDF
    const result = await chrome.debugger.sendCommand({ tabId }, 'Page.printToPDF', pdfOptions);
    
    if (!result || !result.data) {
      throw new Error('No PDF data returned from Chrome');
    }
    
    // Create data URL from base64
    const dataUrl = `data:application/pdf;base64,${result.data}`;
    
    // Generate filename
    const title = tab.title ? tab.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') : 'webpage';
    const filename = `${title}_${Date.now()}.pdf`;
    
    // Download the PDF
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    });
    
    console.log('Screen-accurate PDF download started:', downloadId);
    
    return { success: true, downloadId, filename };
    
  } catch (error) {
    console.error('Error in generatePDFWithDebugger:', error);
    return { success: false, error: error.message };
    
  } finally {
    // Always detach debugger
    if (tabId) {
      try {
        await chrome.debugger.detach({ tabId });
        console.log('Debugger detached from tab:', tabId);
      } catch (detachError) {
        console.error('Error detaching debugger:', detachError);
      }
    }
  }
}
