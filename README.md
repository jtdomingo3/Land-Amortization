# Land Amortization Collection Tracker

[![Platform - Windows](https://img.shields.io/badge/Platform-Windows%20PC-0078D6?logo=windows&logoColor=white)](#1-land_amortization_pc-windows-pc-desktop-edition)
[![Platform - Android](https://img.shields.io/badge/Platform-Android%2014+-3DDC84?logo=android&logoColor=white)](#2-land_amortization-android-android-mobile-edition)
[![React - 19](https://img.shields.io/badge/React-19.3.0-61DAFB?logo=react&logoColor=black)](#)
[![Database - SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57?logo=sqlite&logoColor=white)](#)
[![Cloud - Supabase](https://img.shields.io/badge/Cloud-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](#supabase-cloud-synchronization)
[![Build - Gradle 7.6](https://img.shields.io/badge/Build-Gradle%207.6%20%7C%20JDK%2017-02303A?logo=gradle&logoColor=white)](#compiling-the-android-apk-installer)

A multi-platform financial tracking, amortization management, and collection system for real estate land sales and installment amortizations. Replicates the calculation engine, penalty formulas, multi-slip official receipts, statements of account (SOA), 5-sheet tabular Excel workbooks, and real-time cloud synchronization across mobile and desktop.

Developed by **Gezyne-Jamir Software Tech**.

---

## Table of Contents

- [Multi-Platform Monorepo Architecture](#multi-platform-monorepo-architecture)
- [Platform Feature Matrix](#platform-feature-matrix)
- [Key Features](#key-features)
- [Financial Calculation Engine](#financial-calculation-engine)
- [Supabase Cloud Synchronization](#supabase-cloud-synchronization)
- [Getting Started](#getting-started)
  - [Option A: Running Windows PC Desktop Edition](#option-a-running-windows-pc-desktop-edition)
  - [Option B: Running & Compiling Android Mobile Edition](#option-b-running--compiling-android-mobile-edition)
- [Compiling the Windows PC Desktop Installer (.exe)](#compiling-the-windows-pc-desktop-installer-exe)
- [Compiling the Android APK Installer](#compiling-the-android-apk-installer)
- [Automated Unit Testing & Quality Assurance](#automated-unit-testing--quality-assurance)
- [Database Schema & SQL Migration](#database-schema--sql-migration)
- [Security & Reverse Engineering Safeguards](#security--reverse-engineering-safeguards)
- [License & Credits](#license--credits)

---

## Multi-Platform Monorepo Architecture

```text
Land Amortization/
├── land_amortization-android/     # Android Mobile Application (Apache Cordova 12 + React 19 + SQLite)
│   ├── LandAmortization-v1.0.0.apk# Ready-to-install compiled Android APK installer
│   ├── build_apk.ps1              # Automated PowerShell APK build script
│   ├── build_apk.bat              # Automated Windows Command Prompt APK build script
│   ├── config.xml                 # Cordova platform configuration, permissions, and splash screen
│   ├── src/                       # Mobile React source code (Touch UI, BottomNav, Cloud Sync)
│   └── platforms/android/         # Native Android project with Gradle wrapper
├── land_amortization_pc/          # Windows PC Desktop Application (Electron + React 19 + better-sqlite3)
│   ├── electron/                  # Electron main & preload process scripts
│   ├── src/                       # Desktop React source code (Sidebar, Desktop Previews, Cloud Sync)
│   └── build/                     # Desktop app assets, icons, and legal terms
├── .gitignore                     # Monorepo gitignore rules (enforces .env and build isolation)
└── README.md                      # Master repository documentation
```

### 1. `land_amortization_pc/` (Windows PC Desktop Edition)
Designed for office accountants, administrators, and finance officers:
- **Tech Stack**: Electron, React 19, Vite (`vite-plugin-electron`), embedded `better-sqlite3`, SheetJS, Lucide Icons.
- **Local Database**: High-performance local SQLite file stored at `%APPDATA%\Roaming\land_amortization_pc\land_amortization.db`.
- **In-App Print Previewer**: Bypasses browser print preview dialogs with interactive paper preview (zoom 50%–150%, fit width, slip navigation, and direct system printer spooling).
- **Official Receipts**: Supports **Customer Copy** and **Accounting Copy** (2 slips per sheet) with company logo, words-in-words currency conversion, and authorized signatory/e-signature.
- **Statement of Account (SOA)**: Formats financial ledgers with period filtering (Full, YTD, This Year, Last 6 Months, Custom range).
- **Direct Excel Export**: Saves 5-sheet `.xlsx` files directly to `%USERPROFILE%\Documents\Amortization Tracker\ExcelFile`.
- **Developer Tools**: `F12` / `Ctrl+Shift+I` for Chrome DevTools, `F5` / `Ctrl+R` for instant reload, and `<ErrorBoundary>` crash boundary.

### 2. `land_amortization-android/` (Android Mobile Edition)
Designed for field collection agents, site managers, and on-the-go tracking:
- **Tech Stack**: Apache Cordova 12 (Android 14+), React 19, Vite 8, embedded SQLite (`cordova-sqlite-storage`), Lucide Icons.
- **Local Database**: Embedded on-device SQLite database with automated table migrations and offline persistence.
- **Single vs. Multiple Receipt Generation**: Toggle between printing/sharing the **single active receipt slip** currently on screen or **all covered receipts** in continuous view.
- **Native Android Sharing**: Direct sharing of official receipts, SOA PDFs, and Excel spreadsheets via Google Drive, WhatsApp, Viber, Gmail, and Bluetooth.
- **Branded Splash Screen**: Custom circular branded app icon on `#0f172a` slate background.
- **External Storage Permissions**: Pre-configured `WRITE_EXTERNAL_STORAGE`, `READ_EXTERNAL_STORAGE`, and `requestLegacyExternalStorage="true"` for direct `.xlsx` and PDF export.

---

## Platform Feature Matrix

| Feature | Windows PC Desktop (`land_amortization_pc`) | Android Mobile (`land_amortization-android`) |
| :--- | :---: | :---: |
| **Offline SQLite Engine** | `better-sqlite3` (C++ native driver) | `cordova-sqlite-storage` (Native Android SQLite) |
| **Cloud Synchronization** | Supabase 2-way real-time cloud sync | Supabase 2-way real-time cloud sync |
| **Credential Obfuscation** | Masked UI + `.env` fallback | Dynamic runtime XOR reconstitution (anti-reverse engineering) |
| **Official Receipts (OR)** | In-App Preview (Customer + Accounting copies) | Mobile In-App Preview (Single slip or All covered) |
| **Statement of Account (SOA)** | Multi-period filter + In-app print preview | Multi-period filter + Native PDF / Share |
| **Paper Sizing & Zoom** | A4, Letter, Legal, Roll80, Roll58 thermal | Responsive A4 canvas with dynamic zoom (60%–200%) |
| **Direct OS Printing** | Silent background spooling to chosen printer | Android Print Spooler / Native Share sheet |
| **Tabular 5-Sheet Excel** | Saved to `Documents\Amortization Tracker` | Saved to device `Downloads` / External Storage |
| **Google Drive Integration** | 1-Click browser upload + folder launcher | Native Android Share Sheet direct to Google Drive app |
| **Crash Protection** | Global `<ErrorBoundary>` with user recovery | Global `<ErrorBoundary>` with user recovery |
| **Developer Diagnostics** | `F12` / `Ctrl+Shift+I` DevTools | Chrome Remote Inspect (`chrome://inspect`) |

---

## Key Features

### 1. Dual View Mode Official Receipts
- **Waterfall Month Calculation**: When a buyer pays multiple months in a single transaction, the engine computes each covered amortization month and its respective due date.
- **Single Slip View**: View and print/share **only the individual receipt slip** currently selected (e.g. *Part 1 of 3*).
- **All / Multiple View**: View and print/share a continuous document containing **all covered slips** for that payment.
- **Signatory & E-Signature**: Automatically includes company logo, authorized signatory name, title, and transparent PNG e-signature.

### 2. Statement of Account (SOA)
- Comprehensive ledger of all contract milestones, down payments, monthly installments, penalty fees, and running balances.
- **Period Filtering**:
  - **Full History**: All transactions from contract start.
  - **Year to Date (YTD)**: Transactions from January 1 of the current year.
  - **This Year**: Current calendar year.
  - **Last 6 Months**: Rolling six-month statement.
  - **Custom Range**: Custom start and end dates.

### 3. Master 5-Sheet Tabular Excel Export (`.xlsx`)
Generates structured workbooks matching the master collection model:
1. **`Dashboard`**: 14 key financial performance indicators and portfolio summary.
2. **`Land Accounts`**: Complete 24-column financial dataset for every buyer.
3. **`Payments`**: 11-column chronological transaction ledger.
4. **`Monthly Schedule`**: 120-month advance waterfall schedule simulation.
5. **`Instructions`**: 10 fundamental real estate amortization business rules.

---

## Financial Calculation Engine

The core math engine strictly replicates the business rules of the master land amortization model:

1. **Down Payment Penalty (1%)**: If the agreed Down Payment is unpaid past the `Agreed Down Payment Due` date, a 1% penalty is computed against the unpaid portion.
2. **Installments Paid**: `Total Installment Amount Paid / Monthly Amortization`.
3. **Base Balance**: `Total Contract Amount - Down Payment - Total Installments Paid`.
4. **Advance Payment Waterfall**: Installment payments cascade to the earliest unpaid scheduled months first. Surpluses roll over to subsequent months as advance balance.
5. **Consecutive Missed Months**: Tracks unpaid months sequentially.
6. **10% Overdue Penalty**: Calculated as `10%` of delayed installments when consecutive missed months reach 2 or more.
7. **Down Payment Recalculation**: Recording a Down Payment automatically reduces the remaining contract principal and recomputes future monthly amortization amounts across the remaining term.
8. **Total Amount Due**: `(Expected Installments Due to Date) + Total Penalties - Total Amount Paid`.
9. **Outstanding Balance**: `Base Balance + Total Penalties`.

---

## Supabase Cloud Synchronization

Both the Windows PC and Android applications include built-in two-way synchronization with Supabase PostgreSQL:

```text
┌───────────────────────┐                    ┌────────────────────────┐
│  Windows PC Desktop   │                    │     Android Mobile     │
│   (better-sqlite3)    │◄───┐          ┌───►│ (cordova-sqlite-store) │
└───────────────────────┘    │          │    └────────────────────────┘
                             ▼          ▼
                      ┌────────────────────────┐
                      │  Supabase Cloud (PG)   │
                      │  - land_accounts       │
                      │  - land_payments       │
                      │  - Row Level Security  │
                      └────────────────────────┘
```

- **Startup Sync**: Automatically pulls new cloud accounts and payments when the app launches with internet connectivity.
- **Real-Time CRUD Hooks**: Creating, editing, or deleting an account or payment locally triggers an automatic background sync (800ms debounced).
- **Manual Sync & Connection Tester**: Settings page includes an instant "Test Connection" button and "Sync Now" button with last sync timestamps.
- **SQL Schema Generator**: One-click button in Settings to view and copy the PostgreSQL table migration script.

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x
- **npm**: v9.x or v10.x
- **Java Development Kit**: **JDK 17** (required for Cordova Android 12 & Gradle 7.6)
- **Android SDK**: Android 14 (API Level 34) platform and build-tools

---

### Option A: Running Windows PC Desktop Edition

```powershell
# 1. Navigate to the PC directory
cd land_amortization_pc

# 2. Install dependencies
npm install

# 3. Build React client and Electron main bundles
npm run build

# 4. Launch the desktop application
npm start
```

#### PC Developer Shortcuts:
- **`F12`** or **`Ctrl + Shift + I`**: Toggle Chrome Developer Tools & Console.
- **`F5`** or **`Ctrl + R`**: Reload the application.

---

### Option B: Running & Compiling Android Mobile Edition

```powershell
# 1. Navigate to the Android directory
cd land_amortization-android

# 2. Install dependencies
npm install

# 3. Run Vite development server for local browser preview
npm run dev
# Browser opens at http://localhost:5173
```

---

## Compiling the Windows PC Desktop Installer (.exe)

To compile the standalone 64-bit Windows NSIS installer:

```powershell
# 1. Navigate to PC directory
cd land_amortization_pc

# 2. Compile web assets, native SQLite, and NSIS installer
npm run build:win
```

### Windows Build Specifications:
- **Build Engine**: Electron Builder + NSIS (`win.target: nsis, arch: x64`)
- **Native Modules**: Compiles native C++ `better-sqlite3` bindings for Electron
- **Installer Features**:
  - Customizable installation directory (supports standard Program Files / custom paths)
  - Desktop and Start Menu shortcut generation
  - Integrated legal terms (`build/terms.txt`)
  - Clean uninstaller registered in Windows Add/Remove Programs
- **Output Executable**:
  - [`land_amortization_pc/release/Land Amortization Tracker Setup 1.0.0.exe`](file:///c:/Users/Jeff/repo/Land%20Amortization/land_amortization_pc/release/Land%20Amortization%20Tracker%20Setup%201.0.0.exe) (~135.3 MB)

---

## Compiling the Android APK Installer

### Method 1: One-Command Automated Build (Recommended)

From the `land_amortization-android` directory:

```powershell
npm run build:apk
```

Or execute the build script directly:
- **PowerShell**: `.\build_apk.ps1`
- **Command Prompt (CMD)**: `build_apk.bat`

The automated script automatically:
1. Bundles the React application with Vite (`npm run build`).
2. Syncs assets and Cordova plugins (`npx cordova prepare android`).
3. Auto-detects JDK 17 and Android SDK.
4. Compiles the debug APK via Gradle 7.6.
5. Copies the output installer to **`LandAmortization-v1.0.0.apk`**.

---

### Method 2: Manual Step-by-Step Compilation

#### Step 1: Build Web Bundle & Sync Cordova Platform
```powershell
cd land_amortization-android
npm run build
npx cordova prepare android
```

#### Step 2: Set Environment Variables (PowerShell)
> [!IMPORTANT]
> Gradle 7.6 is compatible with **JDK 17** (do not use JDK 21+).

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

#### Step 3: Run Gradle Compilation
```powershell
.\platforms\android\gradlew.bat -b .\platforms\android\build.gradle cdvBuildDebug
```

#### Step 4: Copy Installer to Root
```powershell
Copy-Item -Path ".\platforms\android\app\build\outputs\apk\debug\app-debug.apk" -Destination ".\LandAmortization-v1.0.0.apk" -Force
```

---

### Installer APK Output Location

* **Root Installer**: [land_amortization-android/LandAmortization-v1.0.0.apk](file:///c:/Users/Jeff/repo/Land%20Amortization/land_amortization-android/LandAmortization-v1.0.0.apk)
* **Gradle Build File**: `land_amortization-android/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Automated Unit Testing & Quality Assurance

Both the PC desktop application and Android mobile edition include automated unit test suites powered by Node.js's native test runner (`node --test`):

```powershell
# 1. Run Windows PC Desktop Unit Tests (39 tests):
cd land_amortization_pc
npm test

# 2. Run Android Mobile Unit Tests (39 tests):
cd ../land_amortization-android
npm test
```

### Complete Test Coverage (78 Tests Across Monorepo):
1. **Formatters (`formatters.test.js`)**:
   - Strict `MM/DD/YYYY` formatting across ISO strings, Date objects, and inputs.
   - Philippine Peso currency formatting (`₱1,500,000.00`) and optional currency symbol toggle.
   - Comma-separated numbers with customizable decimal precision.
   - Month Covered formatting (`October 2026`) and ISO date conversion.
2. **Date Engine (`dateUtils.test.js`)**:
   - Excel `EDATE` month addition with leap-year and month-end boundary handling.
   - Positive and negative calendar day difference calculations.
   - Midnight-referenced overdue detection.
3. **Calculation Formulas (`engine_calculations.test.js`)**:
   - Base balance equation (`Contract Amount - Down Payment - Installments Paid`).
   - 10% late penalty per consecutive missed month.
   - 1% DP penalty condition (verifying penalty is only incurred when DP is unpaid).
   - Balance retention after partial regular payments and reduction after penalty settlements.
   - Status transitions (`ACTIVE`, `OVERDUE`, `PENALTY`, and `PAID`).
4. **Waterfall Schedule Engine (`waterfall_schedule.test.js`)**:
   - Full schedule generation across all `num_of_months`.
   - Sequential advance payment waterfall simulation (e.g. lump sum covering 3+ future months).
   - Partial payment handling and status flagging.
5. **Dashboard Aggregations (`dashboard_engine.test.js`)**:
   - Portfolio receivables, collected funds, penalty balance summations, and collection rate percentages.
   - Category breakdowns (active, overdue, fully paid, 2+ missed months).
6. **Database Schema & Data Integrity (`schema_integrity.test.js`)**:
   - Verification of all required SQLite table definitions (including `is_dp_paid`).
   - Structural integrity and date validity of sample seed accounts and ledger payments.

---

## Database Schema & SQL Migration

### Local SQLite Schema
```sql
CREATE TABLE IF NOT EXISTS accounts (
  account_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_start TEXT NOT NULL,
  first_due_date TEXT NOT NULL,
  land_title_number TEXT,
  land_area_sqm REAL,
  total_contract_amount REAL NOT NULL,
  down_payment REAL DEFAULT 0,
  is_dp_paid INTEGER DEFAULT 0,
  agreed_dp_due TEXT,
  monthly_amortization REAL NOT NULL,
  num_of_months INTEGER NOT NULL,
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount_paid REAL NOT NULL,
  receipt_no TEXT,
  payment_method TEXT DEFAULT 'Cash',
  remarks TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);
```

### Supabase Cloud PostgreSQL Schema
```sql
CREATE TABLE IF NOT EXISTS land_accounts (
  account_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_start TEXT NOT NULL,
  first_due_date TEXT NOT NULL,
  land_title_number TEXT,
  land_area_sqm NUMERIC,
  total_contract_amount NUMERIC NOT NULL,
  down_payment NUMERIC DEFAULT 0,
  is_dp_paid INTEGER DEFAULT 0,
  agreed_dp_due TEXT,
  monthly_amortization NUMERIC NOT NULL,
  num_of_months INTEGER NOT NULL,
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS land_payments (
  payment_id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES land_accounts(account_id) ON DELETE CASCADE,
  payment_date TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  receipt_no TEXT,
  payment_method TEXT DEFAULT 'Cash',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE land_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for land_accounts" ON land_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for land_payments" ON land_payments FOR ALL USING (true) WITH CHECK (true);
```

### Optional: SQL Command to Empty / Clear Supabase Cloud Database

> [!CAUTION]
> **Administrative / Developer Command Only**: Do not execute unless you explicitly intend to delete all cloud data. This command is intentionally documented only here in the README and not exposed in the app interface to prevent accidental data deletion by end-users.

If you are resetting demo data, preparing for initial production rollout, or clearing test accounts from Supabase, run this command in your **Supabase SQL Editor**:

```sql
-- OPTION 1: Empty all records while preserving table schemas, indexes, and RLS security policies
TRUNCATE TABLE land_payments, land_accounts CASCADE;
```

```sql
-- OPTION 2: Completely drop tables and remove all schemas (start fresh from scratch)
DROP TABLE IF EXISTS land_payments CASCADE;
DROP TABLE IF EXISTS land_accounts CASCADE;
```

---

## Security & Reverse Engineering Safeguards

1. **Dynamic Runtime Credential Obfuscation**:
   Supabase project URL and API publishable key are split into non-linear XOR chunk arrays and reconstituted at runtime using a dynamic polynomial seed. Static binary scans (`strings`, zipfile inspect) confirm **zero plaintext URL or API key occurrences** in the compiled APK.
2. **Content Security Policy (CSP)**:
   Configured in `land_amortization-android/index.html` with explicit `connect-src * 'unsafe-inline' https: wss:;` to permit Supabase REST endpoints and live WebSocket channels while blocking untrusted scripts.
3. **Android Storage & Network Permissions**:
   Configured in `AndroidManifest.xml`:
   - `android.permission.INTERNET`
   - `android.permission.WRITE_EXTERNAL_STORAGE`
   - `android.permission.READ_EXTERNAL_STORAGE`
   - `android:requestLegacyExternalStorage="true"`
   - `android:usesCleartextTraffic="true"`
4. **Environment Isolation**:
   Local `.env` and sensitive development configurations are enforced via root `.gitignore`.

---

## License & Credits

- **System**: Land Amortization Collection Tracker
- **Developer**: Gezyne-Jamir Software Tech
- **Proprietary Software**: All rights reserved.
