import { saveWorkbookToDevice } from '../export/excelExport.js';

/**
 * Share the Excel workbook to Google Drive or other apps via Android Native Share Sheet,
 * or direct Google Drive upload workflow on desktop browsers.
 * 
 * @param {Array<Object>} accounts 
 * @param {Array<Object>} payments 
 * @param {string} [customFileName]
 * @returns {Promise<{success: boolean, message: string, fileName: string, driveOpened?: boolean}>}
 */
export async function shareToGoogleDrive(accounts, payments, customFileName = null) {
  try {
    const saveResult = await saveWorkbookToDevice(accounts, payments, customFileName);
    const { filePath, fileName, blob, blobUrl } = saveResult;

    // 1. Cordova Android native share
    if (window.plugins && window.plugins.socialsharing) {
      return new Promise((resolve) => {
        const options = {
          message: 'Land Amortization Tracker - Full Backup & Excel Report',
          subject: fileName,
          files: [filePath],
          chooserTitle: 'Save to Google Drive or Share via...'
        };

        window.plugins.socialsharing.shareWithOptions(
          options,
          (result) => {
            console.log('Share completed:', result);
            resolve({
              success: true,
              message: `Shared "${fileName}" successfully! Select Google Drive in the share menu to upload.`,
              fileName,
              blobUrl
            });
          },
          (err) => {
            console.error('Share error/dismiss:', err);
            resolve({
              success: true,
              message: 'Share closed.',
              fileName,
              blobUrl
            });
          }
        );
      });
    }

    // 2. Web browser: Try Web Share API safely (mobile web browsers)
    if (typeof navigator !== 'undefined' && navigator.share && blob && navigator.canShare) {
      try {
        const file = new File([blob], fileName, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: fileName,
            text: 'Land Amortization Tracker Backup',
            files: [file]
          });
          return {
            success: true,
            method: 'web_share',
            message: 'Share menu opened! Select Google Drive to upload.',
            fileName,
            blobUrl
          };
        }
      } catch (shareErr) {
        if (shareErr && shareErr.name === 'AbortError') {
          return {
            success: true,
            method: 'cancelled',
            message: 'Share window closed.',
            fileName,
            blobUrl
          };
        }
        // Permission denied or unsupported in desktop Chrome; fall through to Google Drive web link
        console.warn('Web Share API not supported on this browser session, falling back to Google Drive link:', shareErr);
      }
    }

    // 3. Desktop browser fallback:
    // Open Google Drive directly so the user can easily upload the saved file
    try {
      window.open('https://drive.google.com/drive/my-drive', '_blank');
    } catch (_) {}

    return {
      success: true,
      method: 'browser_drive_link',
      driveOpened: true,
      message: `File "${fileName}" saved! Opening Google Drive in a new tab so you can upload it.`,
      fileName,
      blobUrl
    };
  } catch (error) {
    console.error('Error during share/export:', error);
    throw error;
  }
}
