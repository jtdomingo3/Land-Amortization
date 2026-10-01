import { generateWorkbook, getExportFileName } from '../export/excelExport.js';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'land_amortization_gdrive_config';

/**
 * Default Google Drive configuration
 */
export function getGoogleDriveConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading gdrive config:', e);
  }

  return {
    folderUrl: '',
    folderName: 'Amortization Tracker Backups',
    folderId: '',
    userEmail: '',
    webhookUrl: '',
    lastSync: null
  };
}

/**
 * Open external URL safely in Google Drive App or System Browser
 */
export function openGoogleDriveFolder(customUrl = null) {
  const config = getGoogleDriveConfig();
  const targetUrl = customUrl || config.folderUrl || 'https://drive.google.com/drive/my-drive';
  
  try {
    if (window.cordova) {
      window.open(targetUrl, '_system');
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.warn('Could not open drive url:', err);
    window.open(targetUrl, '_blank');
  }
}

/**
 * Extract Google Drive folder ID from link or raw ID
 */
export function extractFolderId(input = '') {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Save Google Drive configuration
 */
export function saveGoogleDriveConfig(config) {
  try {
    const current = getGoogleDriveConfig();
    const updated = { ...current, ...config };
    if (updated.folderUrl) {
      updated.folderId = extractFolderId(updated.folderUrl);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving gdrive config:', e);
    return config;
  }
}

/**
 * Clear Google Drive connection
 */
export function disconnectGoogleDrive() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

/**
 * Finds or creates a folder by name in Google Drive
 */
async function getOrCreateFolder(folderName, accessToken) {
  // 1. Search for existing folder
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive folder search failed (${searchRes.status})`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create folder in Google Drive (${createRes.status})`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Upload an Excel workbook directly to Google Drive via Drive API v3 (Multipart Upload)
 */
export async function uploadToGoogleDrive(accounts = [], payments = [], customFileName = null, onProgress = null) {
  const config = getGoogleDriveConfig();
  const fileName = getExportFileName(customFileName);

  // Generate binary XLSX
  const wb = generateWorkbook(accounts, payments);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  // Flow A: Google Apps Script Webhook
  if (config.webhookUrl) {
    if (onProgress) onProgress('Uploading to Google Drive via Webhook...');
    const payload = {
      fileName,
      folderName: config.folderName || 'Land Amortization Backups',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: base64Data
    };

    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    saveGoogleDriveConfig({ lastSync: new Date().toISOString() });

    return {
      success: true,
      fileName,
      folderName: config.folderName,
      fileId: data.fileId || null,
      webViewLink: data.url || `https://drive.google.com/drive/search?q=${encodeURIComponent(fileName)}`,
      message: `Successfully uploaded "${fileName}" to Google Drive folder "${config.folderName}"!`
    };
  }

  // Flow B: Google OAuth 2.0 Access Token
  if (config.accessToken) {
    if (onProgress) onProgress('Connecting to Google Drive...');
    
    // Check if token expired
    if (config.tokenExpiresAt && Date.now() > config.tokenExpiresAt) {
      throw new Error('Google Drive authorization has expired. Please re-authenticate your Google account.');
    }

    if (onProgress) onProgress(`Checking folder "${config.folderName}" in Drive...`);
    const folderId = await getOrCreateFolder(config.folderName || 'Land Amortization Backups', config.accessToken);

    if (onProgress) onProgress(`Uploading "${fileName}" to Google Drive...`);
    
    // Multipart upload to Google Drive v3
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const mediaHeader = `${delimiter}Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
    
    const body = metadataPart + mediaHeader + base64Data + closeDelimiter;

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: body
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      if (uploadRes.status === 401) {
        throw new Error('Google Drive session expired. Please re-connect your account.');
      }
      throw new Error(err.error?.message || `Google Drive upload failed (${uploadRes.status})`);
    }

    const fileData = await uploadRes.json();
    saveGoogleDriveConfig({
      folderId,
      lastSync: new Date().toISOString()
    });

    return {
      success: true,
      fileName,
      fileId: fileData.id,
      webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
      folderName: config.folderName,
      message: `Successfully uploaded "${fileName}" to Google Drive folder "${config.folderName}"!`
    };
  }

  // Not configured yet
  const err = new Error('NOT_CONFIGURED');
  err.code = 'NOT_CONFIGURED';
  throw err;
}
