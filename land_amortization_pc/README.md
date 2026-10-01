# Land Amortization Tracker — Windows Desktop Edition

A high-performance, offline-first Windows PC desktop application for land amortization management, installment collection tracking, waterfall calculation schedules, official receipt issuance, statements of account (SOA), and cloud synchronization.

Developed by **Gezyne-Jamir Software Tech**.

---

## Key Highlights & Features

- **100% Offline SQLite Database**: Uses native `better-sqlite3` embedded storage. Operates with zero internet dependency, fast transactions, and full data isolation.
- **Custom In-App Print Previewers**: Bypasses broken native Chromium/Windows print preview dialogs with interactive paper previews (zoom 50%–150%, fit width, slip navigation, and direct printing).
- **Official Receipts (2 Slips per Sheet)**: Formats **Customer Copy** and **Accounting Copy** with company logo, receipt numbers, words-in-words currency conversion, and authorized signatory/e-signature.
- **Statement of Account (SOA)**: Generates comprehensive financial ledgers with period filtering (Full, YTD, This Year, Last 6 Months, or Custom date range).
- **Automated Excel Export**: Generates 5-sheet tabular `.xlsx` workbooks (Dashboard, Land Accounts, Payments, Monthly Waterfall, Rules) saved directly to:
  ```text
  %USERPROFILE%\Documents\Amortization Tracker\ExcelFile
  ```
- **Google Drive Backup Workflow**: 1-click launch of Google Drive in your default web browser, automatically saving the report file and providing instant shortcuts to open the folder in Windows File Explorer.
- **Supabase Cloud Sync**: Synchronize records between multiple desktop PCs and Android mobile devices via Supabase PostgreSQL.
- **Developer Mode & Diagnostics**: Integrated keyboard shortcuts (`F12`, `Ctrl+Shift+I`, `F5`), terminal console error forwarding, and React Error Boundaries to prevent white screens.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Desktop Framework** | [Electron](https://www.electronjs.org/) (with `vite-plugin-electron`) |
| **Frontend UI** | [React 19](https://react.dev/), [Vite](https://vitejs.dev/) |
| **Styling** | Vanilla CSS (Dark glassmorphic design system) |
| **Database** | Embedded [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| **Cloud Sync** | [Supabase Client](https://supabase.com/) (`@supabase/supabase-js`) |
| **Spreadsheet Engine** | [SheetJS (xlsx)](https://docs.sheetjs.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Linter** | [Oxlint](https://oxc.rs/) |

---

## Project Structure

```text
land_amortization_pc/
├── electron/
│   ├── main.js             # Electron main process (IPC handlers, SQLite, printing, dev shortcuts)
│   └── preload.js          # Context bridge exposing electronAPI (sqlite, shell, print, excel, dev)
├── src/
│   ├── assets/             # Brand logos and images
│   ├── components/
│   │   ├── ErrorBoundary.jsx        # Catches runtime exceptions with diagnostic UI & DevTools trigger
│   │   ├── GoogleDriveModal.jsx     # Google Drive folder link & webhook config modal
│   │   ├── GoogleDriveShareModal.jsx# 1-click desktop Google Drive & Excel export modal
│   │   ├── Header.jsx               # Top navigation bar with live SQLite & cloud status
│   │   ├── Modal.jsx                # Accessible glassmorphic modal wrapper
│   │   ├── ReceiptPreviewModal.jsx  # In-app print preview for Official Receipts (2 slips/page)
│   │   ├── Sidebar.jsx              # Collapsible navigation drawer
│   │   ├── SOAModal.jsx             # In-app print preview for Statement of Account (SOA)
│   │   └── WelcomeModal.jsx         # Initial onboarding tour
│   ├── context/
│   │   └── AppContext.jsx  # Global React state, account/payment CRUD, and live computed metrics
│   ├── db/
│   │   ├── database.js     # Electron SQLite IPC query wrappers
│   │   └── sampleData.js   # Master demo accounts & payment seed records
│   ├── export/
│   │   └── excelExport.js  # 5-sheet Excel workbook generator with direct desktop saving
│   ├── pages/
│   │   ├── AccountDetailPage.jsx # Individual account profile, payment history, and SOA launcher
│   │   ├── AccountFormModal.jsx  # New / Edit land account dialog
│   │   ├── AccountsPage.jsx      # Accounts table, search, filters, and batch status badges
│   │   ├── DashboardPage.jsx     # Executive KPI cards, collections summary, and quick actions
│   │   ├── ExportSharePage.jsx   # Excel export hub, Google Drive backup, and export history
│   │   ├── HelpPage.jsx          # Comprehensive User Guide & Knowledge Base
│   │   ├── PaymentFormModal.jsx  # Record payment dialog (Down payment vs Installment)
│   │   ├── PaymentsPage.jsx      # Payment ledger, receipt print triggers, and search
│   │   ├── SchedulePage.jsx      # Waterfall amortization calendar & missed month tracker
│   │   └── SettingsPage.jsx      # Company logo, signatory, e-sig, Supabase sync, and DB tools
│   ├── print/
│   │   ├── companyConfig.js # Company profile loader (merges .env defaults and SQLite settings)
│   │   ├── printService.js  # Silent background printing engine bypassing broken OS previews
│   │   ├── printStyles.css  # Paper sheet styling, A4/Letter margins, and print rules
│   │   ├── receiptTemplate.js # 2-slip Official Receipt HTML template
│   │   └── soaTemplate.js   # Multi-page Statement of Account HTML template
│   ├── services/
│   │   ├── googleDriveService.js # Google Drive folder configurations and Apps Script webhook helpers
│   │   └── supabaseSync.js       # Supabase connection tester, bi-directional sync, and SQL schema
│   ├── App.jsx             # Top-level view router
│   ├── main.jsx            # React root with ErrorBoundary
│   └── index.css           # Global CSS variables, animations, and typography
├── .env.example            # Sanitized environment variable template
├── package.json            # Scripts and dependencies
└── vite.config.js          # Vite build & Electron plugin configuration
```

---

## Core Financial Calculation Engine

The desktop application enforces the financial rules of the master land amortization model:

1. **Down Payment Penalty (1%)**: If the agreed Down Payment is unpaid past the due date, a 1% penalty is computed against the total contract amount.
2. **Installments Paid**: `Total Installment Amount Paid / Monthly Amortization`.
3. **Base Balance**: `Total Contract Amount - Down Payment - Total Installments Paid`.
4. **Advance Payment Waterfall**: Installment payments cascade to the earliest unpaid scheduled months first. Any surplus rolls over to subsequent months as advance balance.
5. **Consecutive Missed Months**: Tracks unpaid months sequentially.
6. **10% Overdue Penalty**: Calculated as `10%` of delayed installments when consecutive missed months reach 2 or more.
7. **Down Payment Recalculation**: Recording a Down Payment automatically reduces the remaining contract principal and recomputes future monthly amortization amounts across the remaining term.
8. **Total Amount Due**: `(Expected Installments Due to Date) + Total Penalties - Total Amount Paid`.
9. **Outstanding Balance**: `Base Balance + Total Penalties`.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: Version 18.0 or higher
- **Operating System**: Windows 10 or Windows 11 (64-bit)

### 2. Installation

Navigate to the `land_amortization_pc` directory and install project dependencies:

```bash
cd land_amortization_pc
npm install
```

### 3. Environment Configuration

Copy the example environment template to create your local `.env`:

```bash
copy .env.example .env
```

Edit `.env` to configure your company details and cloud sync credentials:

```env
# Company Profile (Used on Receipts & SOA)
VITE_COMPANY_NAME="Your Company Name"
VITE_COMPANY_ADDRESS="Your Office Address"
VITE_COMPANY_CONTACT="Contact Number / Email"
VITE_SIGNATORY_NAME="Authorized Representative"
VITE_SIGNATORY_TITLE="Project Manager"

# Supabase Cloud Database (Optional — For Multi-PC Sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-api-key-here
```

> [!NOTE]
> All `.env*` files are strictly ignored by `.gitignore` to prevent leaking private credentials and API keys.

---

## Running the Application

### Development / Desktop Execution

Build the application bundle and start Electron:

```bash
# Build Vite client & Electron main process
npm run build

# Start Electron desktop application
npm start
```

### Fast Hot-Reload Development

To run Vite with hot module replacement:

```bash
npm run dev
```

### Code Quality & Linting

Run Oxlint to check code quality:

```bash
npm run lint
```

---

## Desktop Developer Mode & Shortcuts

| Shortcut | Action |
|---|---|
| **`F12`** or **`Ctrl + Shift + I`** | Toggle Chrome Developer Tools & Console |
| **`F5`** or **`Ctrl + R`** | Reload the desktop application |
| **Terminal Logging** | All renderer warnings, errors, and unhandled exceptions are automatically piped to your terminal running `npm start`. |
| **Crash Protection** | An `<ErrorBoundary>` wraps the application. If an error occurs, it displays a diagnostic screen with error details and stack trace instead of a blank white screen. |

---

## File Storage & Local Database

- **SQLite Database File**:
  ```text
  %APPDATA%\Roaming\land_amortization_pc\land_amortization.db
  ```
- **Excel Exports Directory**:
  ```text
  %USERPROFILE%\Documents\Amortization Tracker\ExcelFile
  ```

---

## License & Credits

- **System**: Land Amortization Tracker (Windows Desktop Edition)
- **Developer**: Gezyne-Jamir Software Tech
