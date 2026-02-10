# CSF Compass Worker API

Cloudflare Worker backend for CSF Compass application.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Storage**: Cloudflare R2
- **AI**: Anthropic Claude API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Secrets

Set your Anthropic API key:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

### 3. Run Database Migrations

For local development:

```bash
npm run db:migrate:local
```

For production:

```bash
npm run db:migrate
```

### 4. Development

Start the local development server:

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

### 5. Deployment

Deploy to Cloudflare:

```bash
npm run deploy
```

## Database

**D1 Database**: csf-compass-db (ID: 4dfa232a-bb0e-4576-8a67-ae787ca0f996)

Migrations are located in `migrations/` directory.

## Storage

**R2 Bucket**: csf-evidence-files

Used for storing evidence files uploaded during assessments.

## Project Structure

```
worker/
├── src/
│   ├── index.ts           # Main entry point
│   ├── db/
│   │   ├── schema.ts      # Drizzle schema
│   │   └── client.ts      # Database client
│   ├── lib/
│   │   ├── scoring.ts     # Assessment scoring
│   │   ├── storage.ts     # R2 file operations
│   │   └── ai.ts          # Anthropic client
│   ├── routes/
│   │   ├── assessments.ts # Assessment endpoints
│   │   ├── vendors.ts     # Vendor endpoints
│   │   ├── evidence.ts    # Evidence upload/download
│   │   ├── csf.ts         # CSF reference data
│   │   └── ai.ts          # AI analysis
│   └── types/
│       └── env.ts         # Environment bindings
├── migrations/            # D1 migrations
├── wrangler.toml         # Worker configuration
└── package.json
```

## API Endpoints

### Health
- `GET /health` - Health check

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/:id` - Get assessment details
- `PATCH /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:id` - Get vendor details
- `PATCH /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Evidence
- `POST /api/evidence/upload` - Upload evidence file
- `GET /api/evidence/download/:token` - Download evidence file
- `DELETE /api/evidence/:id` - Delete evidence file

### CSF Reference
- `GET /api/csf/functions` - List CSF functions
- `GET /api/csf/categories` - List CSF categories
- `GET /api/csf/subcategories` - List CSF subcategories

### AI Services
- `POST /api/ai/analyze` - Analyze evidence
- `POST /api/ai/gap-analysis` - Generate gap recommendations
- `POST /api/ai/executive-summary` - Generate executive summary

## Demo Mode

This application runs in demo mode with hardcoded credentials:
- Organization ID: `demo-org-123`
- User ID: `demo-user-456`

No authentication is required for development.
