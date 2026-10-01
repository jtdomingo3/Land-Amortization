/**
 * Print Service for Receipts and Statement of Account (SOA).
 * 
 * Works seamlessly across:
 * - Desktop browsers (Chrome/Edge/Firefox Print Preview -> Save as PDF / Print)
 * - Android WebView / Cordova (triggers Android Print Service with Share, Save as PDF, and Print options)
 */

export function printDocument(htmlContent, documentTitle = 'Receipt') {
  return new Promise((resolve) => {
    let printArea = document.getElementById('print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'print-area';
      document.body.appendChild(printArea);
    }

    const previousTitle = document.title;
    if (documentTitle) {
      document.title = documentTitle;
    }

    printArea.innerHTML = htmlContent;

    // Small timeout ensures base64 images and styles have settled in WebView
    setTimeout(() => {
      const cleanup = () => {
        printArea.innerHTML = '';
        document.title = previousTitle;
        window.removeEventListener('afterprint', cleanup);
        resolve(true);
      };

      window.addEventListener('afterprint', cleanup);

      try {
        window.print();
      } catch (err) {
        console.error('Error invoking window.print():', err);
      }

      // Fallback cleanup in case afterprint does not fire on certain Android webviews
      setTimeout(cleanup, 2000);
    }, 150);
  });
}
