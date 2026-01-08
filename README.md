# Material Management System

A comprehensive Next.js application for managing inventory, material transactions, defects, and alerts. All data is stored locally on your PC using browser localStorage.

## Features

### 📊 Dashboard
- Overview of key metrics (total materials, transactions, defects, active alerts)
- Recent activities feed
- Visual indicators for system status

### 📦 Material Records
- Store and manage all inventory data
- Synchronize with SAP quantities
- Search and filter materials
- Add, edit, and delete material records

### 📝 Material Transactions
- Record material receiving activities
- Record material issuance activities
- Automatic quantity updates
- Transaction history tracking

### ⚠️ Defects Module
- Monitor and log defective or damaged materials
- Track defect severity (low, medium, high, critical)
- Manage defect status (open, in-progress, resolved)
- Resolution notes tracking

### 🔔 Alerts System
- Automatic detection of mismatches between local system and SAP
- Real-time variance calculations
- Alert severity levels (warning, error, critical)
- Acknowledge and manage alerts

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation (using pnpm for faster installs)

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm build
pnpm start
```

## Data Storage

All data is stored locally in your browser's localStorage. This means:
- Data persists between sessions
- Data is specific to the browser and device
- No server or database required
- Data can be cleared by clearing browser storage

## Usage

1. **Start with Material Records**: Add your inventory materials first
2. **Record Transactions**: Log receiving and issuance activities
3. **Monitor Defects**: Report any defective materials
4. **Check Alerts**: Review any mismatches with SAP quantities
5. **View Dashboard**: Get an overview of all activities

## Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **localStorage** - Local data persistence

## Notes

- The system automatically checks for SAP mismatches every 30 seconds
- Material quantities are automatically updated when transactions are recorded
- All timestamps are stored in ISO format
- The application works entirely offline after initial load

