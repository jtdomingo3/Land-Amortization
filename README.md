# Cortez Land Amortization Collection Tracker

A multi-platform financial tracking and amortization management system for real estate land sales and installment collections. Built to replicate the calculation engine, penalty formulas, multi-slip official receipts, statements of account (SOA), 5-sheet tabular Excel exports, and cloud synchronization across mobile and desktop.

Developed by **Gezyne-Jamir Software Tech**.

---

## Multi-Platform Monorepo Architecture

```text
Land Amortization/
├── land_amortization-android/     # Android Mobile Application (Apache Cordova + React 19 + SQLite)
├── land_amortization_pc/          # Windows PC Desktop Application (Electron + React 19 + better-sqlite3)
├── .gitignore                     # Monorepo gitignore rules (enforces .env isolation)
└── README.md                      # Main project documentation
```

### 1. `land_amortization_pc/` (Windows PC Desktop Edition)
A native desktop application optimized for finance officers, accountants, and office staff.
- **Tech Stack**: Electron, React 19, Vite (`vite-plugin-electron`), embedded `better-sqlite3`, SheetJS, Lucide Icons, Oxlint.
- **Database**: 100% offline embedded local SQLite (`%APPDATA%\Roaming\land_amortization_pc\land_amortization.db`).
- **Custom In-App Print Previewers**: Bypasses broken Chromium/Windows print preview dialogs with built-in interactive paper preview (zoom 50%–150%, fit width, slip navigation, and direct printing).
- **Official Receipts (2 Slips per Sheet)**: Formats **Customer Copy** and **Accounting Copy** with company logo, receipt numbers, words-in-words currency conversion, and authorized signatory/e-signature.
- **Statement of Account (SOA)**: Generates comprehensive financial ledgers with period filtering (Full, YTD, This Year, Last 6 Months, or Custom date range).
- **Direct Desktop Excel Export**: Saves 5-sheet tabular `.xlsx` workbooks directly to:
  ```text
  %USERPROFILE%\Documents\Amortization Tracker\ExcelFile
  ```
- **Google Drive Workflow**: 1-click launch of Google Drive in default web browser with automatic file preparation and quick shortcuts to open in Windows File Explorer.
- **Developer Mode & Diagnostics**: Integrated keyboard shortcuts (`F12`, `Ctrl+Shift+I` for DevTools, `F5` or `Ctrl+R` for reload), terminal console error forwarding, and `<ErrorBoundary>` crash protection.

### 2. `land_amortization-android/` (Android Mobile Edition)
The portable field collection app for mobile agents, site managers, and collectors.
- **Tech Stack**: Apache Cordova (Android 14+), React 19, Vite, SQLite (`cordova-sqlite-storage`), Lucide Icons.
- **Database**: 100% offline embedded SQLite database with schema migrations.
- **Native Android Sharing**: Share receipts, SOA, and `.xlsx` workbooks directly via Google Drive, WhatsApp, Gmail, Bluetooth, and Messenger with FileProvider permissions.
- **Touch-Optimized UI**: Responsive mobile layouts with SVG portfolio charts and quick-action bottom navigation.

---

## Platform Feature Matrix

| Feature | Windows PC Desktop (`land_amortization_pc`) | Android Mobile (`land_amortization-android`) |
|---|:---:|:---:|
| **Offline SQLite Engine** | `better-sqlite3` (High Performance) | `cordova-sqlite-storage` |
| **Financial Waterfall Math** | Yes | Yes |
| **Official Receipts (OR)** | Yes (In-App Print Preview + 2 Slips/Page) | Yes (Mobile PDF / Print) |
| **Statement of Account (SOA)** | Yes (Interactive Zoom & Filtered Ledger) | Yes (Full & Period Filtered) |
| **Direct OS Printing** | Yes (Silent Background Print Pipeline) | Yes (Android Print Spooler) |
| **Tabular 5-Sheet Excel Export** | Yes (Direct to `Documents\Amortization Tracker`) | Yes (Saved to `Downloads`) |
| **Google Drive Integration** | Yes (Desktop Browser + Folder Link) | Yes (Native Android Share Intent) |
| **Supabase Cloud Sync** | Yes (Configurable in Settings) | Yes (Direct Sync) |
| **Developer Tools (`F12`)** | Yes (`F12` / `Ctrl+Shift+I`) | Chrome Remote Inspect |

---

## Core Financial Calculation Engine

The system strictly adheres to the financial formulas from the master land amortization model:

1. **Down Payment Penalty (1%)**: If the agreed Down Payment is unpaid past the due date, a 1% penalty is computed against the total contract amount.
2. **Installments Paid**: `Total Installment Amount Paid / Monthly Amortization`.
3. **Base Balance**: `Total Contract Amount - Down Payment - Total Installments Paid`.
4. **Advance Payment Waterfall**: Installment payments cascade to the earliest unpaid scheduled months first. Surpluses roll over to subsequent months as advance balance.
5. **Consecutive Missed Months**: Tracks unpaid months sequentially.
6. **10% Overdue Penalty**: Calculated as `10%` of delayed installments when consecutive missed months reach 2 or more.
7. **Down Payment Recalculation**: Recording a Down Payment automatically reduces the remaining contract principal and recomputes future monthly amortization amounts across the remaining term.
8. **Total Amount Due**: `(Expected Installments Due to Date) + Total Penalties - Total Amount Paid`.
9. **Outstanding Balance**: `Base Balance + Total Penalties`.

---

## Getting Started

### Option A: Running the Windows PC Desktop App

```bash
cd land_amortization_pc

# 1. Install dependencies
npm install

# 2. Build client and Electron bundles
npm run build

# 3. Launch Electron Desktop Application
npm start
```

#### PC Developer Mode Shortcuts
- **`F12`** or **`Ctrl + Shift + I`**: Toggle Chrome Developer Tools & Console.
- **`F5`** or **`Ctrl + R`**: Refresh and reload the application.

---

### Option B: Running / Building the Android App

```bash
cd land_amortization-android

# 1. Install dependencies
npm install

# 2. Run Vite dev server for browser preview
npm run dev

# 3. Build web assets & prepare Cordova platform
npm run build
npx cordova prepare android

# 4. Compile Android Debug APK
cd platforms/android
gradle assembleDebug
```

Compiled APK output path:
`land_amortization-android/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Security & Environment Configuration

All sensitive keys, company profiles, and database credentials are strictly loaded via local `.env` files.

- `.env` files are excluded by `.gitignore` across all sub-projects.
- `.env.example` files are provided with dummy template values.
- In the PC Desktop application, Supabase URLs and API keys are masked by default in the Settings UI with visibility toggle buttons.

---

## License & Credits

- **System**: Cortez Land Amortization Collection Tracker
- **Developer**: Gezyne-Jamir Software Tech
