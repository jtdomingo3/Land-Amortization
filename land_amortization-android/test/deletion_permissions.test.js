import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Android Deletion Permissions & Security Suite', () => {
  const rootDir = path.resolve('..');
  const androidSrcDir = path.resolve('src');
  const pcSrcDir = path.resolve(rootDir, 'land_amortization_pc', 'src');

  it('Mobile: AccountsPage should not contain delete buttons for accounts', () => {
    const filePath = path.join(androidSrcDir, 'pages', 'AccountsPage.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.strictEqual(
      content.includes('title="Delete Customer Account"'),
      false,
      'Mobile AccountsPage must not render a delete account button'
    );
  });

  it('Mobile: AccountDetailPage should not contain delete buttons for accounts or payments', () => {
    const filePath = path.join(androidSrcDir, 'pages', 'AccountDetailPage.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.strictEqual(
      content.includes('title="Delete Customer Account"'),
      false,
      'Mobile AccountDetailPage must not render delete customer button'
    );
    assert.strictEqual(
      content.includes('title="Delete Payment (Syncs to Supabase)"'),
      false,
      'Mobile AccountDetailPage must not render delete payment button'
    );
    assert.strictEqual(
      content.includes('Delete Customer Record'),
      false,
      'Mobile AccountDetailPage must not render danger delete card'
    );
  });

  it('Mobile: PaymentsPage should not contain delete payment button', () => {
    const filePath = path.join(androidSrcDir, 'pages', 'PaymentsPage.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.strictEqual(
      content.includes('title="Delete Payment"'),
      false,
      'Mobile PaymentsPage must not render a delete payment button'
    );
  });

  it('Mobile: SettingsPage and ExportSharePage must not render "Clear All Data" global delete button', () => {
    const settingsPath = path.join(androidSrcDir, 'pages', 'SettingsPage.jsx');
    const exportPath = path.join(androidSrcDir, 'pages', 'ExportSharePage.jsx');

    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const exportContent = fs.readFileSync(exportPath, 'utf8');

    assert.strictEqual(
      settingsContent.includes('<span>Clear All Data</span>'),
      false,
      'Mobile SettingsPage must not render "Clear All Data" button'
    );
    assert.strictEqual(
      exportContent.includes('Clear All Data'),
      false,
      'Mobile ExportSharePage must not render "Clear All Data" button'
    );
  });

  it('Mobile: supabaseSync.js must not contain any remote deletions sent to Supabase', () => {
    const androidSyncPath = path.join(androidSrcDir, 'services', 'supabaseSync.js');
    const androidSync = fs.readFileSync(androidSyncPath, 'utf8');

    assert.strictEqual(
      androidSync.includes('.delete('),
      false,
      'Android supabaseSync.js must not execute any remote deletes'
    );
  });
});
