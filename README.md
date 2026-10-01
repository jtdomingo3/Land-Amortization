# Cortez Land Amortization Collection Tracker

A multi-platform financial tracking and amortization management system for real estate land sales and installment collections. Built to replicate the calculation engine, penalty formulas, official receipt issuances, statements of account, and 5-sheet tabular Excel exports of the master financial model.

---

## Repository Structure

```text
Land Amortization/
├── land_amortization-android/     # Complete Android mobile application (Cordova + React + SQLite)
├── land_amortization_pc/          # PC / Desktop implementation directory
├── .gitignore                     # Monorepo ignore rules
└── README.md                      # Main project documentation
```

### 1. `land_amortization-android/`
The complete, production-ready offline-first Android mobile application.
- **Tech Stack**: Apache Cordova (Android 14+), React 19, Vite, SQLite (`cordova-sqlite-storage`), Lucide Icons.
- **Database**: 100% offline embedded SQLite database with schema migrations.
- **Key Features**:
  - Full financial amortization schedule calculation engine (down payment penalty, 10% consecutive missed months penalty, advance payment waterfall).
  - Official Receipt (OR) multi-month generator with breakdown and balance forwarding.
  - Multi-page Statement of Account (SOA) generator with preset period filtering (Full, YTD, This Year, Last 6 Mos, Custom).
  - Configurable Company Details & Signatory with digital signature rendering.
  - Native Android sharing (Drive, WhatsApp, Gmail, Bluetooth, Messenger) with FileProvider permissions.
  - 5-sheet Excel workbook export (`.xlsx`) matching the master spreadsheet structure.

### 2. `land_amortization_pc/`
Reserved directory designated for the PC / Desktop application implementation.

---

## Core Financial Calculation Rules

The system implements the exact business and accounting rules from the master financial model:

1. **Down Payment Penalty (1%)**: If the agreed Down Payment is unpaid past the due date, a 1% penalty is charged on the unpaid portion.
2. **Installments Paid**: `Total Installment Amount Paid / Monthly Amortization`.
3. **Base Balance**: `Total Contract Amount - Down Payment - Total Installments Paid`.
4. **Advance Payment Waterfall**: Payments applied chronologically to monthly dues. Surpluses roll over to future months as `Advance / Remaining`.
5. **Consecutive Missed Months**: Tracks unpaid months sequentially.
6. **10% Penalty**: Charged as `Base Balance × 10%` whenever consecutive missed months reach 2 or more.
7. **Total Penalties**: `Down Payment Penalty + 10% Penalty`.
8. **Total Amount Due**: `(Expected Installments Due to Date) + Total Penalties - Total Amount Paid`.
9. **Outstanding Balance**: `Base Balance + Total Penalties`.

---

## Getting Started: Android App

To run or build the Android application:

```bash
cd land_amortization-android

# Install dependencies
npm install

# Run Vite development server
npm run dev

# Build web assets and prepare Cordova platform
npm run build
npx cordova prepare android

# Compile Android Debug APK
cd platforms/android
gradle assembleDebug
```

Compiled APK output path:
`land_amortization-android/platforms/android/app/build/outputs/apk/debug/app-debug.apk`
