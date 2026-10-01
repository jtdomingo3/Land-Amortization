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
    const { filePath, displayPath, fileName, blob, blobUrl, dataUri, canceled } = saveResult;
    if (canceled) {
      return { success: false, message: 'Save cancelled by user.', fileName };
    }

    const shareTarget = filePath || dataUri;
    const config = getGoogleDriveConfig();

    // 0. Electron Desktop Environment: Reveal in File Explorer & optional Drive link
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (filePath && window.electronAPI.shell) {
        window.electronAPI.shell.showItemInFolder(filePath);
      }
      if (config && config.folderUrl && window.electronAPI.shell) {
        window.electronAPI.shell.openExternal(config.folderUrl);
      }
      return {
        success: true,
        method: 'electron_desktop',
        message: `Report exported successfully to ${displayPath || filePath}! File highlighted in Windows Explorer.`,
        fileName,
        filePath,
        displayPath,
        blobUrl
      };
    }

    // 1. Cordova Android native: Launch Google Drive directly
    if (window.plugins && window.plugins.socialsharing) {
      return new Promise((resolve) => {
        // Try targeting Google Drive's UploadMenuActivity directly
        window.plugins.socialsharing.shareVia(
          'com.google.android.apps.docs/com.google.android.apps.docs.common.shareitem.UploadMenuActivity',
          'Land Amortization Tracker Backup',
          fileName,
          [shareTarget],
          null,
          (result) => {
            console.log('Google Drive direct launch success:', result);
            resolve({
              success: true,
              method: 'google_drive_direct',
              message: `Google Drive opened! Confirm your Google account and target folder to save "${fileName}".`,
              fileName,
              filePath,
              displayPath,
              blobUrl
            });
          },
          (err) => {
            console.warn('Google Drive direct launch with activity notice, trying package only:', err);
            // Fallback to package-only intent (launches Drive's default send receiver)
            window.plugins.socialsharing.shareVia(
              'com.google.android.apps.docs',
              'Land Amortization Tracker Backup',
              fileName,
              [shareTarget],
              null,
              (res2) => {
                resolve({
                  success: true,
                  method: 'google_drive_direct',
                  message: `Google Drive opened! Confirm your Google account and target folder to save "${fileName}".`,
                  fileName,
                  filePath,
                  displayPath,
                  blobUrl
                });
              },
              (err2) => {
                console.error('Google Drive launch failed:', err2);
                // Open the Google Drive backup folder link directly if configured
                if (config && config.folderUrl) {
                  openGoogleDriveFolder();
                }
                resolve({
                  success: false,
                  method: 'drive_app_not_found',
                  message: `Could not launch Google Drive app directly. Please ensure Google Drive is installed, or upload "${fileName}" from Documents/Amortization Tracker/.`,
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
  const { filePath, displayPath, fileName, blob, blobUrl, dataUri, canceled } = saveResult;
  if (canceled) {
    return { success: false, message: 'Export cancelled.', fileName };
  }

  if (typeof window !== 'undefined' && window.electronAPI) {
    if (filePath && window.electronAPI.shell) {
      window.electronAPI.shell.showItemInFolder(filePath);
    }
    return {
      success: true,
      message: `Report saved to ${displayPath || filePath}. Revealed in File Explorer.`,
      fileName,
      filePath,
      displayPath
    };
  }

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
