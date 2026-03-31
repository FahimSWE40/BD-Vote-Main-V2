# ইউনিভোট — Blockchain E-Voting System for Bangladesh

A modern, secure, and transparent digital voting platform built with React, TypeScript, and Ethereum blockchain — designed specifically for Bangladesh.

---

## Features

### Voter
- **Biometric Verification** — AI-powered face recognition with liveness detection
- **OCR ID Scanning** — Automatic data extraction from NID / University ID cards via Tesseract.js
- **Blockchain Vote Recording** — Every vote is recorded immutably on the Ethereum Sepolia testnet
- **Offline Support** — Votes are queued locally and synced when connectivity is restored (PWA)
- **Real-time Results** — Live vote counting with blockchain transparency and charts
- **Voter Dashboard** — View voting history, election info, and submission status

### Admin
- **Bulk Voter Import** — Drag-and-drop ID card upload with auto OCR processing
- **Candidate Management** — Create, edit, and delete candidates per constituency
- **Constituency Management** — Define and manage election areas
- **Audit Logs** — Full activity trail for all system events
- **Incident Reporting** — Log and track voting anomalies

### Candidate
- **Candidate Dashboard** — View live vote counts and election performance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn-ui (Radix UI) |
| State / Data | React Query (@tanstack/react-query) |
| Routing | React Router DOM v6 |
| Backend / DB | Supabase (PostgreSQL) |
| Blockchain | Ethereum via ethers.js (Sepolia testnet) |
| Face AI | face-api.js (detection + recognition + liveness) |
| OCR | Tesseract.js |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PWA | vite-plugin-pwa |
| Testing | Vitest |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or bun

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd BD-Vote-Main-V2

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at `http://localhost:8080`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>

# Optional — required for blockchain vote recording
VITE_BD_VOTE_CONTRACT_ADDRESS=<deployed-contract-address>
```

> All `VITE_` prefixed variables are exposed to the client. Use only publishable/anon keys here.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development mode build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── Verification.tsx       # ID scan + face verification flow
│   ├── Ballot.tsx             # Vote casting
│   ├── Dashboard.tsx          # Voter dashboard
│   ├── Results.tsx            # Live election results
│   ├── admin/                 # Admin panel pages
│   └── candidate/             # Candidate pages
├── components/
│   ├── ui/                    # shadcn-ui base components
│   ├── admin/                 # Admin-specific components
│   ├── ballot/                # Ballot UI components
│   ├── landing/               # Landing page sections
│   └── layout/                # Navbar, Footer
├── hooks/                     # Custom React hooks
├── lib/
│   ├── blockchain.ts          # Ethereum smart contract interaction
│   ├── face-verification.ts   # face-api.js wrapper
│   ├── ocr.ts                 # Tesseract.js OCR engine
│   ├── liveness-detection.ts  # Face liveness checks
│   └── utils.ts
└── integrations/
    └── supabase/
        ├── client.ts          # Supabase client
        └── types.ts           # Auto-generated DB types
```

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/verification` | Voter ID + face verification |
| `/ballot` | Cast a vote |
| `/dashboard` | Voter dashboard |
| `/results` | Live election results |
| `/admin/login` | Admin login |
| `/admin/*` | Admin dashboard (voters, candidates, audit, etc.) |
| `/candidate/login` | Candidate login |
| `/candidate` | Candidate dashboard |

---

## Deployment

Build the project and deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.):

```sh
npm run build
```

The app is PWA-ready — users can install it on mobile and desktop and use it offline.

---

## License

This project is private. All rights reserved.
