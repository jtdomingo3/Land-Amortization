import { saveWorkbookToDevice } from '../export/excelExport.js';
import { getGoogleDriveConfig, openGoogleDriveFolder } from '../services/googleDriveService.js';

/**
 * Share the Excel workbook directly to Google Drive app on Android,
 * or direct Google Drive upload workflow on desktop browsers.
 * 
 * @param {Array<Object>} accounts 
 * @param {Array<Object>} payments 
 * @param {string} [customFileName]
 * @returns {Promise<{success: boolean, message: string, fileName: string, filePath?: string, blobUrl?: string, driveOpened?: boolean}>}
 */
export async function shareToGoogleDrive(accounts, payments, customFileName = null) {
  try {
    const saveResult = await saveWorkbookToDevice(accounts, payments, customFileName);
    const { filePath, displayPath, fileName, blob, blobUrl, dataUri } = saveResult;
    const shareTarget = filePath || dataUri;
    const config = getGoogleDriveConfig();

    // 1. Cordova Android native: Launch Google Drive directly
    if (window.plugins && window.plugins.socialsharing) {
      return new Promise((resolve) => {
        // Try launching Google Drive ("Save to Drive") directly
        window.plugins.socialsharing.shareVia(
          'com.google.android.apps.docs',
          'Land Amortization Tracker Backup',
          fileName,
          [shareTarget],
          null,
          (result) => {
            console.log('Google Drive direct launch success:', result);
            resolve({
              success: true,
              method: 'google_drive_direct',
              message: `Google Drive opened! Choose your Google account and target folder to save "${fileName}".`,
              fileName,
              filePath,
              displayPath,
              blobUrl
            });
          },
          (err) => {
            console.warn('Google Drive direct share notice, falling back to share chooser:', err);
            // Fallback if Google Drive app is missing or direct package intent throws
            window.plugins.socialsharing.shareWithOptions(
              {
                message: 'Land Amortization Tracker Backup (.xlsx)',
                subject: fileName,
                files: [shareTarget],
                chooserTitle: 'Save to Google Drive'
              },
              () => {
                resolve({
                  success: true,
                  method: 'share_options',
                  message: `Select Google Drive in the menu to upload "${fileName}".`,
                  fileName,
                  filePath,
                  displayPath,
                  blobUrl
                });
              },
              () => {
                resolve({
                  success: true,
                  method: 'cancelled',
                  message: `File saved locally to ${displayPath || fileName}.`,
                  fileName,
                  filePath,
                  displayPath,
                  blobUrl
                });
              }
            );
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
            message: 'Select Google Drive to upload.',
            fileName,
            displayPath,
            blobUrl
          };
        }
      } catch (shareErr) {
        if (shareErr && shareErr.name === 'AbortError') {
          return {
            success: true,
            method: 'cancelled',
            message: 'Share closed.',
            fileName,
            displayPath,
            blobUrl
          };
        }
      }
    }

    // 3. Desktop browser fallback:
    // Open Google Drive folder directly
    openGoogleDriveFolder();

    return {
      success: true,
      method: 'browser_drive_link',
      driveOpened: true,
      message: `File "${fileName}" saved! Opening Google Drive in a new tab so you can upload it.`,
      fileName,
      displayPath,
      blobUrl
    };
  } catch (error) {
    console.error('Error during share/export to Google Drive:', error);
    throw error;
  }
}

/**
 * Standard Native Share to other apps (WhatsApp, Email, Telegram, Bluetooth)
 */
export async function shareToOtherApps(accounts, payments, customFileName = null) {
  const saveResult = await saveWorkbookToDevice(accounts, payments, customFileName);
  const { filePath, displayPath, fileName, blob, blobUrl, dataUri } = saveResult;
  const shareTarget = filePath || dataUri;

  if (window.plugins && window.plugins.socialsharing) {
    return new Promise((resolve) => {
      window.plugins.socialsharing.shareWithOptions(
        {
          message: 'Land Amortization Tracker - 5-Sheet Excel Report',
          subject: fileName,
          files: [shareTarget],
          chooserTitle: 'Share Land Amortization Report via...'
        },
        () => resolve({ success: true, message: 'Shared successfully.', fileName, displayPath }),
        () => resolve({ success: true, message: 'Share dismissed.', fileName, displayPath })
      );
    });
  }

  return { success: true, message: `Saved to ${displayPath}`, fileName, displayPath };
}
