# GrowEasy CSV Importer

An AI-powered CSV importer that intelligently maps messy, real-world CSV exports (Facebook Lead Ads, Google Ads, Excel sheets, CRM exports, etc.) into a standardized CRM format — regardless of column naming or structure.

**Live Demo:** https://grow-easy-csv-importer-eight.vercel.app
**Backend API:** https://groweasy-csv-importer-production-c75c.up.railway.app

## Features

- Drag & drop CSV upload
- AI-powered column mapping (handles synonyms, spelling variations, merged columns)
- Batch AI processing with Zod-validated output
- Automatic handling of multiple emails/phone numbers per record
- Skip logic for incomplete records (missing email and phone)
- Sortable, searchable, paginated results table
- Skipped records view with reasons
- Export to JSON or CSV
- Dark mode support

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, TanStack Table, React Dropzone, Lucide Icons

**Backend:** Node.js, Express, TypeScript, Multer, PapaParse, Google Gemini API, Zod

**Deployment:** Vercel (frontend), Railway (backend)

## Architecture

growEasy-csv-importer/
├── frontend/          Next.js app (upload UI, results table)
└── backend/           Express API (CSV parsing, AI processing)
└── src/
├── routes/       API route handlers
├── services/     AI integration (column mapping, transformation)
├── schemas/       Zod validation schemas
└── utils/         Batch processing utilities

### How it works

1. User uploads a CSV via drag & drop
2. Backend parses the CSV into rows using PapaParse
3. **Phase 1:** A small sample of rows + column headers are sent to Gemini, which returns a mapping of each column to a CRM field
4. **Phase 2:** All rows are split into batches of 50 and sent to Gemini along with the column mapping, which returns clean, validated CRM records
5. Every AI response is validated with Zod before being trusted
6. Results are displayed in a sortable/searchable table, with skipped records shown separately

## Setup Instructions

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com))

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here


Run it:
```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

NEXT_PUBLIC_API_URL=http://localhost:5000

Run it:
```bash
npm run dev
```

Visit `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/upload` | Upload a CSV file, returns processed CRM records |

## Future Improvements

- Retry mechanism for individual failed batches
- Preview raw CSV data before AI processing begins
- Virtualized table rendering for very large CSVs
- Unit and integration test coverage
- Docker setup for containerized deployment

## Author

Built by Kabita Tarai as a submission for the GrowEasy Software Developer Intern position.