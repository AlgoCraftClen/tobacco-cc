# CC Tobacco — iPhone App

A mobile-first iOS app for tracking tobacco shipments between Clanny (Sender) and Clenny (Receiver). Built with **Expo + React Native**.

> **iPhone only.** No Android or web build targets.

---

## What it does

- **Send shipments** (Clanny): brand + boxes → price/can → review → send
- **Receive shipments** (Clenny): confirm received or report issues
- **Record sales**: track resale price per can, revenue, profit per shipment
- **Log purchases, expenses, and contributions**: track who funded what
- **Dashboard**: 50/50 partnership economics, net position, activity feed
- **History**: chronological view of all transactions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo 54 + React Native 0.81 |
| Router | expo-router (file-based) |
| State | React Context + hooks |
| Backend | Supabase (PostgreSQL + Realtime) |
| Storage | AsyncStorage (local sales) |
| Styling | React Native StyleSheet (dark theme) |

---

## Project Structure

```
ios-app/
├── app/
│   ├── index.tsx              # Role selection (Clanny / Clenny)
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab navigation (6 tabs)
│   │   ├── dashboard.tsx      # Overview + Partnership + Activity
│   │   ├── shipments.tsx      # Shipment list + status cards
│   │   ├── receive.tsx        # Pending shipments to receive
│   │   ├── sale.tsx           # Running sales report
│   │   ├── purchases.tsx      # Funding / purchase log
│   │   └── history.tsx        # Chronological activity feed
│   └── new-shipment.tsx       # 4-step new shipment modal
├── src/
│   ├── components/            # Avatar, Badge, Icon, Sheet, Toast, etc.
│   ├── hooks/
│   │   └── useAppData.ts      # App data provider (Supabase + local)
│   ├── lib/
│   │   ├── data.ts            # Business logic, unit ladder, computePartnership
│   │   ├── supabase.ts        # DB client + CRUD for all tables
│   │   └── storage.ts         # AsyncStorage wrapper (role)
│   └── theme.ts               # Colors, spacing, radius, fonts
├── assets/
│   ├── icon.png               # App icon (1024×1024)
│   ├── splash.png             # Splash screen
│   └── favicon.png            # Web favicon (unused on iOS)
├── app.json                   # Expo config (iOS only)
├── package.json
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

---

## Unit Ladder (Critical)

```
1 Box  = 6 Cases = 108 Rolls = 540 Cans
1 Case = 18 Rolls = 90 Cans
1 Roll = 5 Cans
```

All calculations in `src/lib/data.ts` use these constants.

---

## Getting Started

### Prerequisites

- **macOS** + **Xcode** (for iOS simulator / device build)
- **Node.js** 18+ and **npm**
- **Expo CLI** (optional; `npx expo` works fine)

### Install & Run

```bash
cd ios-app
npm install
npx expo start
```

Then press `i` to open the iOS simulator, or scan the QR code with the Expo Go app on your physical iPhone.

### Quick Start (Windows batch)

From the repo root:

```bash
start-app.bat
```

This runs `npm ci` in `ios-app/` and launches `expo start --clear`.

---

## Build for Production (EAS)

```bash
cd ios-app
npx eas build --platform ios
```

Requires an [Expo Application Services (EAS)](https://expo.dev/eas) account and Apple Developer account.

---

## Supabase Backend

- **Project**: `njpkqemgpbstrbsaxpbz` ("tobacco-cc")
- **Tables**: `shipments_v2`, `purchases`, `expenses`, `contributions`
- **Local data**: running sales entries stored in `AsyncStorage`
- **RLS**: permissive for anon (private app; anon key embedded)

---

## Roles

| Name | Role | Greeting |
|------|------|----------|
| **Clanny** | Sender | "Iakwe!" (Marshallese hello) |
| **Clenny** | Receiver | "Iakwe!" |

Role is chosen on first launch and persisted in `AsyncStorage`. Switch anytime via the header chip.

---

## License

© 2026 Clenny Minor · All Rights Reserved
