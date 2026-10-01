# Land Amortization Tracker

An offline-first Android mobile application and financial tracker for real estate land sales and installment amortizations. Replicates the exact mathematical calculation engine, penalty formulas, and 5-sheet tabular structure of the master Excel model (`Land_Amortization_Tracker_Updated_Penalties_Advance.xlsx`).

---

## Key Highlights

- **100% Offline-First Database**: Runs on embedded local SQLite (`cordova-sqlite-storage`) on Android and in-memory WebSQL/IndexedDB for browser previews. No external servers or internet connection required for core operations.
- **Tabular 5-Sheet Excel Export (`.xlsx`)**: Generates comprehensive Excel workbooks matching the master spreadsheet:
  1. `Dashboard` (Summary metrics & 14 KPIs)
  2. `Land Accounts` (All 24 buyer financial columns)
  3. `Payments` (All 11 transaction ledger columns)
  4. `Monthly Schedule` (120-month payment waterfall simulation)
  5. `Instructions` (10 core business and amortization rules)
- **Native Google Drive Sharing (Zero Setup Required)**:
  - **On Android**: 1-tap upload via Android's native share intent directly into the user's Google Drive app.
  - **No Developer Configuration**: No Google Cloud Console registration, no OAuth setup, and **no API keys required** by the client.
- **Modern Clean Design**:
  - Light mode by default with crisp contrast, card shadows, and status badges.
  - Smooth dark mode toggle.
  - Custom circular branded application icon (`Land Amortization Tracker`).
  - Interactive SVG financial portfolio donut chart and monthly collection bar chart.
  - First-launch welcome popup modal with "Don't show again" toggle.
- **Proper File Naming System**:
  - Automatic date-stamped naming (e.g., `Land_Amortization_Tracker_YYYY-MM-DD.xlsx`).
  - Quick-preset chips for Daily, Timestamped, Monthly Reports, or Custom names.
  - Guaranteed valid binary output directly in the device's `Downloads` folder.

---

## Financial Calculation Rules

The calculation engine replicates the Excel formulas:

1. **Down Payment Penalty (1%)**: If the agreed Down Payment is unpaid past the `Agreed Down Payment Due` date, a 1% penalty is charged on the unpaid portion.
2. **Installments Paid**: `Total Installment Amount Paid / Monthly Amortization`.
3. **Base Balance**: `Total Contract Amount - Down Payment - Total Installments Paid`.
4. **Advance Payment Waterfall**: Payments applied chronologically to monthly dues. Surpluses roll over to future months as `Advance / Remaining`.
5. **Consecutive Missed Months**: Tracks unpaid months sequentially.
6. **10% Penalty**: Charged as `Base Balance × 10%` whenever consecutive missed months reach 2 or more.
7. **Total Penalties**: `Down Payment Penalty + 10% Penalty`.
8. **Total Amount Due**: `(Expected Installments Due to Date) + Total Penalties - Total Amount Paid`.
9. **Outstanding Balance**: `Base Balance + Total Penalties`.

---

## Project Structure

```text
├── config.xml                  # Apache Cordova Android application configuration
├── package.json                # Project dependencies & build scripts
├── vite.config.mjs             # Vite 8 bundling configuration
├── src/
│   ├── assets/                 # App icons, processed circular logos
│   ├── components/             # Reusable UI components & modals
│   │   ├── DashboardCharts.jsx # SVG Donut & Bar charts
│   │   ├── GoogleDriveShareModal.jsx # Google Drive connection & upload modal
│   │   ├── KpiCard.jsx         # Summary KPI cards
│   │   ├── Navbar.jsx          # Top bar with logo, theme toggle & export action
│   │   ├── Navigation.jsx      # Bottom tab bar
│   │   └── WelcomeModal.jsx    # First-launch welcome dialog
│   ├── context/
│   │   └── AppContext.jsx      # Global React state & database controller
│   ├── db/
│   │   ├── database.js         # SQLite database schema, CRUD, & migrations
│   │   └── sampleData.js       # Preloaded sample accounts & payment ledger
│   ├── engine/
│   │   ├── calculations.js     # Account & payment derived financial formulas
│   │   ├── dashboard.js        # KPI aggregator matching Excel Dashboard sheet
│   │   └── waterfall.js        # 120-month advance waterfall schedule engine
│   ├── export/
│   │   └── excelExport.js      # 5-sheet SheetJS binary workbook exporter
│   ├── pages/
│   │   ├── AccountDetailPage.jsx # Individual buyer breakdown & waterfall
│   │   ├── AccountFormModal.jsx  # New / Edit buyer account modal
│   │   ├── AccountsPage.jsx      # Buyer list with search, filter & badges
│   │   ├── DashboardPage.jsx     # Executive overview & financial metrics
│   │   ├── ExportSharePage.jsx   # Excel export, presets, & storage tools
│   │   ├── HelpPage.jsx          # Instructions & calculation rule reference
│   │   ├── PaymentFormModal.jsx  # Record new payment transaction modal
│   │   ├── PaymentsPage.jsx      # Transaction history with filtering
│   │   └── SchedulePage.jsx      # Full monthly schedule viewer
│   ├── share/
│   │   └── shareFile.js        # Android social sharing & Google Drive integration
│   ├── utils/
│   │   ├── constants.js        # 10 rules & instructions text
│   │   └── formatters.js       # Currency (₱ PHP), numbers, & date formatters
│   ├── index.css               # Design system & dark/light theme tokens
│   └── main.jsx                # React application entrypoint
└── www/                        # Compiled production bundle ready for Cordova
```

---

## Getting Started & Development

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or v10.x
- **Java Development Kit (JDK)**: JDK 17 (recommended for Cordova Android 12+)
- **Android SDK**: Android 14 (API Level 34) platform and build-tools installed via Android Studio or command-line tools.

### 2. Local Browser Preview
To run the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### 3. Build Web Bundle
To compile the React source into the `www/` directory:
```bash
npm run build
```

---

## Compiling the Android APK

1. **Ensure Cordova Android platform is prepared**:
   ```bash
   npm run build
   npx cordova prepare android
   ```

2. **Build Debug APK**:
   ```bash
   npx cordova build android
   ```
   The compiled APK will be located at:
   ```text
   platforms/android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Install & Run on a Connected Android Device or Emulator**:
   ```bash
   npx cordova run android
   ```

---

## Privacy & Security

- All buyer records, payments, and financial calculations remain strictly on the device's local storage.
- No third-party tracking, analytics, or external API dependencies.
- Google Drive upload only occurs when initiated by the user.

---

## License

Internal proprietary software developed for Land Amortization Tracking and Property Management.
