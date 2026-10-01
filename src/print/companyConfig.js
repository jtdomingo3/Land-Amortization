import { getAllSettings, setMultipleSettings } from '../db/database.js';

export const DEFAULT_COMPANY = {
  company_name: 'Angeles Land Development Inc.',
  company_address: 'Sta Elena, Camarines Norte',
  company_contact: '(043) 555-1234',
  company_email: 'info@angelesland.ph',
  company_tin: '123-456-789-000',
  company_logo: '',
  signatory_name: '',
  signatory_title: '',
  signatory_esig: ''
};

export const SAMPLE_COMPANY_WITH_SIGNATORY = {
  company_name: 'Angeles Land Development Inc.',
  company_address: 'Sta Elena, Camarines Norte',
  company_contact: '(043) 555-1234',
  company_email: 'info@angelesland.ph',
  company_tin: '123-456-789-000',
  company_logo: '',
  signatory_name: 'Engr. Roberto M. Angeles',
  signatory_title: 'Authorized Managing Officer',
  signatory_esig: ''
};

/**
 * Retrieve company settings from DB, merged with defaults
 */
export async function getCompanySettings() {
  try {
    const stored = await getAllSettings();
    return {
      company_name: stored.company_name !== undefined ? stored.company_name : DEFAULT_COMPANY.company_name,
      company_address: stored.company_address !== undefined ? stored.company_address : DEFAULT_COMPANY.company_address,
      company_contact: stored.company_contact !== undefined ? stored.company_contact : DEFAULT_COMPANY.company_contact,
      company_email: stored.company_email !== undefined ? stored.company_email : DEFAULT_COMPANY.company_email,
      company_tin: stored.company_tin !== undefined ? stored.company_tin : DEFAULT_COMPANY.company_tin,
      company_logo: stored.company_logo || '',
      signatory_name: stored.signatory_name || '',
      signatory_title: stored.signatory_title || '',
      signatory_esig: stored.signatory_esig || ''
    };
  } catch (err) {
    console.warn('Failed to get company settings, returning defaults:', err);
    return { ...DEFAULT_COMPANY };
  }
}

/**
 * Save company settings object to DB
 */
export async function saveCompanySettings(settings) {
  const payload = {
    company_name: settings.company_name || '',
    company_address: settings.company_address || '',
    company_contact: settings.company_contact || '',
    company_email: settings.company_email || '',
    company_tin: settings.company_tin || '',
    company_logo: settings.company_logo || '',
    signatory_name: settings.signatory_name || '',
    signatory_title: settings.signatory_title || '',
    signatory_esig: settings.signatory_esig || ''
  };
  await setMultipleSettings(payload);
  return payload;
}

/**
 * Reset company settings to the sample company defaults
 */
export async function loadSampleCompany(includeSignatory = true) {
  const sample = includeSignatory ? SAMPLE_COMPANY_WITH_SIGNATORY : DEFAULT_COMPANY;
  await saveCompanySettings(sample);
  return { ...sample };
}

/**
 * Convert an image File/Blob to a base64 Data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
