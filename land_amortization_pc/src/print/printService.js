import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Print & PDF Export Service for Receipts and Statement of Account (SOA).
 * 
 * Specifically adapted for Windows Desktop PC (Electron):
 * - Native desktop printing: Bypasses the broken Chromium print preview, invokes
 *   the system printer dialog directly without UI freezing or blank screens.
 * - Native PDF saving: Uses Electron's vector-crisp printToPDF and native Windows file dialog.
 * - Browser Fallback: Generates high-DPI PDF via jsPDF & html2canvas or hidden iframe.
 */

/**
 * Generate a PDF Blob from an HTML string or an existing DOM element.
 * Handles single-page and multi-page documents (e.g. 180-month SOA tables) with crisp A4 pagination.
 */
export async function generatePdfBlobFromHtml(htmlContent, documentTitle = 'Document') {
  let container = null;
  let elementToCapture = null;

  try {
    // Create an off-screen render container matching standard A4 width (794px at 96 DPI)
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.background = '#ffffff';
    container.style.zIndex = '-9999';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    elementToCapture = container;

    // Wait a brief tick for fonts, styles, and base64 images to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Render high-DPI canvas
    const canvas = await html2canvas(elementToCapture, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: 794
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; // A4 width in mm
    const pdfPageHeight = 297; // A4 height in mm

    // Height in canvas pixels corresponding to 1 A4 page
    const pageCanvasHeight = Math.floor(canvas.width * (pdfPageHeight / pdfWidth));

    if (canvas.height <= pageCanvasHeight) {
      // Single page document (e.g. official receipt)
      const slicePdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, slicePdfHeight);
    } else {
      // Multi-page document (e.g. multi-year Statement of Account)
      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < canvas.height) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        const currentSliceHeight = Math.min(pageCanvasHeight, canvas.height - yOffset);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentSliceHeight;

        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, yOffset, canvas.width, currentSliceHeight,
          0, 0, canvas.width, currentSliceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const slicePdfHeight = (currentSliceHeight * pdfWidth) / canvas.width;
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, slicePdfHeight);

        yOffset += currentSliceHeight;
        pageNum++;
      }
    }

    const pdfBlob = pdf.output('blob');
    return { pdfBlob, pdf };
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Direct print document to printer.
 * On Electron PC: uses native print:html (silent: false) which opens the Windows OS
 * printer selection dialog directly without Chromium's broken print preview.
 */
export async function printDocument(htmlContent, documentTitle = 'Document', options = {}) {
  // 1. Electron Desktop Native Print
  if (typeof window !== 'undefined' && window.electronAPI?.print?.printHtml) {
    try {
      const res = await window.electronAPI.print.printHtml(htmlContent, {
        title: documentTitle,
        silent: options.silent || false
      });
      return res;
    } catch (err) {
      console.error('[PrintService] Electron native print error:', err);
    }
  }

  // 2. Browser Fallback: Clean hidden iframe print
  return new Promise((resolve) => {
    try {
      let iframe = document.getElementById('silent-print-frame');
      if (iframe) {
        iframe.remove();
      }
      iframe = document.createElement('iframe');
      iframe.id = 'silent-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${documentTitle}</title>
            <style>
              @page { size: auto; margin: 10mm; }
              body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      doc.close();

      iframe.contentWindow.focus();
      setTimeout(() => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        }
        setTimeout(() => {
          iframe.remove();
          resolve({ success: true });
        }, 1500);
      }, 300);
    } catch (err) {
      console.error('Browser print fallback failed:', err);
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Save Document as PDF directly to disk.
 * On Electron: uses vector-sharp printToPDF and native Windows save dialog.
 * On Browser: uses jsPDF + html2canvas and browser downloads.
 */
export async function saveDocumentAsPdf(htmlContent, documentTitle = 'Document') {
  const sanitizedTitle = (documentTitle || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Electron Native PDF Export
  if (typeof window !== 'undefined' && window.electronAPI?.print?.toPdf) {
    try {
      const res = await window.electronAPI.print.toPdf(htmlContent, {
        title: sanitizedTitle,
        dialogTitle: `Save ${documentTitle} as PDF`
      });
      if (res.canceled) {
        return { success: false, canceled: true, message: 'Export canceled by user.' };
      }
      if (res.success) {
        return { success: true, filePath: res.filePath, fileName: res.fileName, message: `Successfully saved to ${res.fileName}` };
      }
    } catch (err) {
      console.warn('[PrintService] Electron native PDF failed, falling back to jsPDF:', err);
    }
  }

  // 2. Web / Browser fallback with jsPDF
  const { pdfBlob } = await generatePdfBlobFromHtml(htmlContent, documentTitle);
  const fileName = `${sanitizedTitle}.pdf`;

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);

  return { success: true, message: `Saved as ${fileName} to Downloads.` };
}

/**
 * Backward-compatible wrapper for previous shareOrSavePdf callers.
 * Desktop app drops the share intent sheet and saves PDF directly.
 */
export async function shareOrSavePdf(htmlContent, documentTitle = 'Document') {
  return saveDocumentAsPdf(htmlContent, documentTitle);
}
