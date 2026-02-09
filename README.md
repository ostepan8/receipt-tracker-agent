# Receipt Tracker Agent

An AI-powered expense tracking application that automatically extracts data from receipts, categorizes expenses, and generates reports.

Built with [Subconscious](https://subconscious.dev) AI agents and [Reducto](https://reducto.ai) document extraction.

## Features

- **Upload or Photograph Receipts**: Drag-and-drop, file picker, or mobile camera capture
- **AI Data Extraction**: Automatically extract merchant, date, items, totals, and more
- **Smart Categorization**: AI-powered expense categorization using Subconscious agents
- **Duplicate Detection**: Automatically flag potential duplicate receipts
- **Expense Reports**: Generate reports by date range with category breakdowns
- **CSV Export**: Export reports for accounting software

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Auth**: Firebase Authentication
- **Database**: Supabase (PostgreSQL + Storage)
- **AI Agent**: Subconscious SDK
- **Document Extraction**: Reducto Extract API
- **Styling**: Tailwind CSS + shadcn/ui

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ostepan8/receipt-tracker-agent.git
cd receipt-tracker-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Then fill in your API keys in `.env.local`:

| Service | Where to get it |
|---------|-----------------|
| Firebase | [Firebase Console](https://console.firebase.google.com) -> Project Settings -> General |
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) -> Project Settings -> API |
| Subconscious | [subconscious.dev/platform](https://www.subconscious.dev/platform) |
| Reducto | [reducto.ai](https://reducto.ai) |

### 4. Set Up Supabase

#### Create Tables

Run the migrations in your Supabase SQL editor:

```bash
# Run supabase/migrations/001_initial_schema.sql
# Then run supabase/migrations/002_add_review_flags.sql
```

#### Create Storage Bucket

1. Go to your Supabase dashboard -> Storage
2. Create a new bucket called `receipts`
3. Set it to **Private**

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
receipt-tracker-agent/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── sign-in/                    # Firebase sign-in
│   │   ├── sign-up/                    # Firebase sign-up
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Main dashboard
│   │   │   ├── receipts/[id]/page.tsx  # Receipt detail
│   │   │   └── reports/                # Reports pages
│   │   └── api/
│   │       ├── process-stream/         # Main processing endpoint (SSE)
│   │       ├── receipts/               # Receipt CRUD
│   │       ├── reports/                # Report endpoints
│   │       └── auth/                   # Auth endpoints
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── receipt-card.tsx
│   │   ├── upload-zone.tsx
│   │   ├── camera-capture.tsx
│   │   └── ...
│   └── lib/
│       ├── firebase/                   # Firebase config & auth
│       ├── supabase/                   # Database queries
│       ├── reducto/extract.ts          # Reducto integration
│       ├── subconscious/agent.ts       # AI agent definition
│       └── types.ts                    # TypeScript types
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_add_review_flags.sql
└── .env.example
```

## How It Works

### Processing Pipeline

1. **Upload**: User uploads a receipt image or PDF
2. **Storage**: File is stored in Supabase Storage
3. **Extraction**: Reducto Extract API reads the document and extracts structured data
4. **Analysis**: Subconscious agent categorizes the expense, checks for duplicates, and validates data
5. **Storage**: Processed receipt is saved to the database
6. **Display**: User sees the extracted data with option to edit

### AI Agent

The Subconscious agent handles:

- **Categorization**: Assigns expense categories based on merchant and items
- **Duplicate Detection**: Compares against recent receipts to flag duplicates
- **Validation**: Checks for data consistency and flags issues

## Expense Categories

| Category | Examples |
|----------|----------|
| Meals & Entertainment | Restaurants, coffee, snacks |
| Travel & Transportation | Flights, hotels, Uber, gas |
| Office Supplies | Paper, pens, printer ink |
| Software & Subscriptions | SaaS, cloud hosting, domains |
| Utilities | Phone, internet, electricity |
| Professional Services | Legal, accounting, consulting |
| Equipment | Computers, monitors, furniture |
| Marketing | Advertising, swag, events |
| Healthcare | Pharmacy, doctor visits |
| Other | Miscellaneous expenses |

## Development

### Mock Mode

Set `MOCK=true` in your `.env.local` to use mock data instead of calling external APIs. Useful for development without API keys.

## License

MIT
