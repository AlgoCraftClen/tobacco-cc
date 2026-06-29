# CC Tobacco OS

An iPhone app for tracking tobacco shipments and managing the Clanny ↔ Clenny partnership.

---

## What it does

- **Shipments**: Create, track, and receive shipments with per-box unit ratios
- **Operations**: Log expenses with approval workflow (only approved ops count in settlement)
- **Sales**: Record sales per shipment with cash collector tracking
- **Settlement**: Per-shipment partnership economics — contribution %, projected payouts, profit/loss
- **Dashboard**: Overview, shipment selector, activity feed

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo 54 + React Native 0.81 |
| Router | expo-router (file-based) |
| State | React Context + hooks |
| Backend | Supabase (PostgreSQL + Realtime) |
| Styling | React Native StyleSheet (dark theme) |

---

## Project Structure

```
app/                    # Expo Router screens (tabs + new-shipment)
src/
  components/           # UI components (Avatar, Badge, Sheet, Toast, etc.)
  hooks/
    useAppData.ts      # App data provider (Supabase + local state)
  lib/
    data.ts            # Business logic, settlement formulas (Excel-aligned)
    supabase.ts        # DB client + CRUD for all tables
    storage.ts         # AsyncStorage wrapper (role only)
    theme.ts           # Colors, spacing, radius, fonts
  stubs/                # Expo Router stubs
assets/
  icon.png              # App icon (1024×1024)
  splash.png            # Splash screen
  favicon.png           # Web favicon (unused on iOS)
supabase/
  migrations/           # Database migrations
app.json                # Expo config (iOS only)
package.json
babel.config.js
metro.config.js
tsconfig.json
```

---

## Unit Ladder (Per-Shipment)

```
Cases/Box  = 6  (editable per shipment)
Rolls/Case = 18 (editable per shipment)
Cans/Roll  = 5  (editable per shipment)
Cans/Case  = Rolls/Case × Cans/Roll
Cans/Box   = Cases/Box × Cans/Case
```

---

## Getting Started

### Prerequisites

- **macOS** + **Xcode** (for iOS simulator / device build)
- **Node.js** 18+ and **npm**

### Install & Run

```bash
git clone https://github.com/AlgoCraftClen/tobacco-cc.git
cd tobacco-cc
npm install
npx expo start
```

Press `i` to open the iOS simulator, or scan the QR code with the Expo Go app on your physical iPhone.

---

## Build for Production (EAS)

```bash
npx eas build --platform ios
```

Requires an [Expo Application Services (EAS)](https://expo.dev/eas) account and Apple Developer account.

---

## Supabase Backend

- **Project**: `tobacco-cc` (restored from paused state)
- **Tables**: `shipments_v2`, `purchases`, `expenses`, `contributions`, `sales`
- **RLS**: Enabled with app-secret header validation
- **Migration**: `supabase/migrations/20260628_excel_formulas.sql`

---

## Roles

| Name | Role | Greeting |
|------|------|----------|
| **Clanny** | Sender | "Iakwe!" |
| **Clenny** | Receiver | "Iakwe!" |

Role is chosen on first launch and persisted in AsyncStorage. Switch anytime via the header chip.

---

## License

© 2026 Clenny Minor · All Rights Reserved
