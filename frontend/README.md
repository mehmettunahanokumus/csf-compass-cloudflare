# CSF Compass Frontend

React SPA frontend for CSF Compass application.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Router**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:8787
```

### 3. Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build

Build for production:

```bash
npm run build
```

The built files will be in `dist/` directory.

### 5. Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=csf-compass
```

## Demo Mode

This application runs in demo mode:
- **Organization ID**: `demo-org-123`
- **User ID**: `demo-user-456`

These values are hardcoded in the API client and require no authentication.
