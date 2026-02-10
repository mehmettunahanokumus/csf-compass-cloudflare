# CSF Compass - Cloudflare Edition

Complete migration of CSF Compass from Supabase to Cloudflare Developer Platform.

## Architecture

- **Frontend**: React SPA built with Vite, deployed to Cloudflare Pages
- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (object storage)
- **AI**: Anthropic Claude API

## Project Structure

- `worker/` - Cloudflare Worker API backend
- `frontend/` - React SPA frontend

## Getting Started

See individual README files in `worker/` and `frontend/` directories.
