(async () => {
  // Prevent multiple runs
  if (window.__web2pdf_running) return;
  window.__web2pdf_running = true;

  try {
    console.log('Starting direct PDF generation like Safari');

    // Create notification element (hidden initially, shown only on completion)
    const notification = document.createElement('div');
    notification.id = 'web2pdf-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      max-width: 300px;
      line-height: 1.4;
      display: none;
    `;
    document.body.appendChild(notification);

    // Request background script to generate PDF using chrome.debugger
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'generateDirectPDF',
        options: {
          preserveScreenLayout: true,
          includeFonts: true,
          enableTextSelection: true
        }
      }, resolve);
    });

    if (result && result.success) {
      // PDF generated successfully - show completion alert
      notification.style.background = '#4CAF50';
      notification.style.display = 'block';
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">✅ PDF Generated!</div>
        <div style="font-size: 13px;">
          PDF downloaded successfully with screen appearance and selectable text.
        </div>
      `;
      
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
      }, 4000);
      
    } else {
      // Fallback: Show clear instructions for manual PDF creation
      notification.style.background = '#FF9800';
      notification.style.display = 'block';
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">📄 Manual PDF Creation</div>
        <div style="font-size: 13px; margin-bottom: 8px;">
          Direct PDF generation blocked. Use browser's native PDF:
        </div>
        <div style="font-size: 12px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px;">
          1. Press <strong>Ctrl+P</strong> (or Cmd+P)<br>
          2. Select <strong>"Save as PDF"</strong><br>
          3. Click <strong>"More settings"</strong><br>
          4. Check <strong>"Background graphics"</strong><br>
          5. Set margins to <strong>"Minimum"</strong><br>
          6. Click <strong>"Save"</strong>
        </div>
        <button onclick="this.parentElement.remove()" style="
          background: rgba(255,255,255,0.2); 
          color: white; 
          border: 1px solid rgba(255,255,255,0.3); 
          padding: 6px 12px; 
          border-radius: 4px; 
          cursor: pointer;
          font-size: 11px;
          margin-top: 8px;
          float: right;
        ">Got it</button>
        <div style="clear: both;"></div>
      `;
      
      // Auto-remove after 15 seconds
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
      }, 15000);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);

    // Show simple manual instructions
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      max-width: 300px;
      line-height: 1.4;
    `;
    errorMsg.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Extension Blocked</div>
      <div style="font-size: 13px; margin-bottom: 8px;">
        This website blocks PDF generation. Use:
      </div>
      <div style="font-size: 12px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px;">
        <strong>Ctrl+P</strong> → Save as PDF → More settings → Background graphics ON
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 6px 12px; 
        border-radius: 4px; 
        cursor: pointer;
        font-size: 11px;
        margin-top: 8px;
        float: right;
      ">Close</button>
      <div style="clear: both;"></div>
    `;
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
      if (errorMsg.parentNode) errorMsg.remove();
    }, 10000);
  } finally {
    window.__web2pdf_running = false;
  }
})();
