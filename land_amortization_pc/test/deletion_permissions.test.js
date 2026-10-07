import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Cross-Platform Deletion Permissions & Security Suite', () => {
  const rootDir = path.resolve('..');
  const pcSrcDir = path.resolve('src');
  const androidSrcDir = path.resolve(rootDir, 'land_amortization-android', 'src');

  it('Mobile: AccountsPage should not contain delete buttons for accounts', () => {
    const filePath = path.join(androidSrcDir, 'pages', 'AccountsPage.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Confirm that the delete button and title="Delete Customer Account" have been removed from the UI render
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

  it('PC: SettingsPage and ExportSharePage must not render "Clear All Data" global delete button', () => {
    const settingsPath = path.join(pcSrcDir, 'pages', 'SettingsPage.jsx');
    const exportPath = path.join(pcSrcDir, 'pages', 'ExportSharePage.jsx');

    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const exportContent = fs.readFileSync(exportPath, 'utf8');

    assert.strictEqual(
      settingsContent.includes('<span>Clear All Data</span>'),
      false,
      'PC SettingsPage must not render "Clear All Data" button'
    );
    assert.strictEqual(
      exportContent.includes('Clear All Data'),
      false,
      'PC ExportSharePage must not render "Clear All Data" button'
    );
  });

  it('PC: Should allow individual account and payment deletions', () => {
    const accountsPath = path.join(pcSrcDir, 'pages', 'AccountsPage.jsx');
    const detailPath = path.join(pcSrcDir, 'pages', 'AccountDetailPage.jsx');
    const paymentsPath = path.join(pcSrcDir, 'pages', 'PaymentsPage.jsx');

    const accountsContent = fs.readFileSync(accountsPath, 'utf8');
    const detailContent = fs.readFileSync(detailPath, 'utf8');
    const paymentsContent = fs.readFileSync(paymentsPath, 'utf8');

    assert.strictEqual(
      accountsContent.includes('handleDeleteAccount'),
      true,
      'PC AccountsPage must retain account deletion functionality'
    );
    assert.strictEqual(
      detailContent.includes('handleDeleteAccount'),
      true,
      'PC AccountDetailPage must retain account deletion functionality'
    );
    assert.strictEqual(
      paymentsContent.includes('handleDelete'),
      true,
      'PC PaymentsPage must retain payment deletion functionality'
    );
  });

  it('Both Platforms: supabaseSync.js must not contain batch deletions sent to Supabase client', () => {
    const pcSyncPath = path.join(pcSrcDir, 'services', 'supabaseSync.js');
    const androidSyncPath = path.join(androidSrcDir, 'services', 'supabaseSync.js');

    const pcSync = fs.readFileSync(pcSyncPath, 'utf8');
    const androidSync = fs.readFileSync(androidSyncPath, 'utf8');

    // Confirm that the batch syncWithSupabase function in PC contains no delete calls
    const pcSyncFunc = pcSync.split('export async function syncWithSupabase')[1].split('export async function syncDeleteAccount')[0];
    assert.strictEqual(
      pcSyncFunc.includes('.delete('),
      false,
      'PC syncWithSupabase must not execute batch delete on any table'
    );

    // Confirm that Android supabaseSync.js contains ZERO delete calls (mobile cannot delete remotely)
    assert.strictEqual(
      androidSync.includes('.delete('),
      false,
      'Android supabaseSync.js must not execute any remote deletes'
    );
  });
});
