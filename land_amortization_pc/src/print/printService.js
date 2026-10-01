import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Print & PDF Sharing Service for Receipts and Statement of Account (SOA).
 * 
 * Works seamlessly across:
 * - Android Cordova WebView: Generates PDF, saves to Documents/Amortization Tracker,
 *   and launches native Share sheet (Drive, WhatsApp, Viber, Messenger, Bluetooth, Print).
 * - Web Browsers: Generates PDF and downloads it, or triggers browser window.print().
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
 * Save PDF to device and trigger Android native share menu or browser download.
 */
export async function shareOrSavePdf(htmlContent, documentTitle = 'Document') {
  const sanitizedTitle = (documentTitle || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${sanitizedTitle}.pdf`;

  // 1. Generate PDF Blob and PDF instance
  const { pdfBlob, pdf } = await generatePdfBlobFromHtml(htmlContent, documentTitle);

  // 2. Extract base64 for SocialSharing
  let shareTarget = null;
  try {
    const dataUri = pdf.output('datauristring');
    const commaIdx = dataUri.indexOf(',');
    if (commaIdx !== -1) {
      const rawBase64 = dataUri.substring(commaIdx + 1);
      shareTarget = `df:${fileName};data:application/pdf;base64,${rawBase64}`;
    }
  } catch (encErr) {
    console.warn('Failed to encode PDF for sharing:', encErr);
  }

  // 3. Cordova Android Native Share Sheet
  const socialSharing = typeof window !== 'undefined' && (window.plugins?.socialsharing || window.SocialSharing);
  if (socialSharing && shareTarget) {
    // Also save a background copy to Documents/Amortization Tracker if cordova file is ready
    try {
      if (window.cordova?.file?.externalRootDirectory && window.resolveLocalFileSystemURL) {
        window.resolveLocalFileSystemURL(window.cordova.file.externalRootDirectory, (rootEntry) => {
          rootEntry.getDirectory('Documents', { create: true, exclusive: false }, (docsEntry) => {
            docsEntry.getDirectory('Amortization Tracker', { create: true, exclusive: false }, (trackerEntry) => {
              trackerEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
                fileEntry.createWriter((writer) => writer.write(pdfBlob), () => {});
              }, () => {});
            }, () => {});
          }, () => {});
        }, () => {});
      }
    } catch (saveErr) {
      console.warn('Background copy error (non-fatal):', saveErr);
    }

    return new Promise((resolve) => {
      socialSharing.shareWithOptions({
        message: `${documentTitle} - Cortez Land Amortization`,
        subject: documentTitle,
        files: [shareTarget],
        chooserTitle: 'Share / Save PDF via...'
      }, (res) => {
        resolve({ success: true, message: 'Share sheet opened successfully.', filePath: fileName });
      }, (err) => {
        resolve({ success: true, message: 'Share sheet dismissed or closed.', filePath: fileName });
      });
    });
  }

  // 3. Web Browser Fallback: Automatic download of PDF
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
 * Desktop browser print preview (window.print).
 * If on Cordova Android where window.print is non-functional, automatically delegates to shareOrSavePdf.
 */
export async function printDocument(htmlContent, documentTitle = 'Receipt') {
  if (typeof window !== 'undefined' && window.cordova) {
    // Android Cordova WebView does not support window.print() reliably
    return shareOrSavePdf(htmlContent, documentTitle);
  }

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

      setTimeout(cleanup, 2000);
    }, 150);
  });
}
