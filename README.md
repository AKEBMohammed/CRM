# CRM (DZ Sales) — SvelteKit + Supabase CRM

A lightweight, modular CRM built with SvelteKit, Supabase, and Google Gemini for an AI-powered assistant. It includes real-time chat, file uploads, embeddings-based similarity search (RAG), and an admin/settings interface.

## Table of Contents
- [About](#about)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Repo Structure](#high-level-repo-structure)
- [Prerequisites](#prerequisites)
- [Quickstart — Local Development](#quickstart--local-development)
- [Environment Variables](#environment-variables)
- [Database and Embeddings Setup](#database--embeddings-setup)
- [AI Assistant](#ai-assistant-important-runtime-notes)
- [Services & Where to Edit Logic](#services--where-to-edit-logic)
- [Frontend](#frontend)
- [File Uploads & Media Rendering](#file-uploads--media-rendering)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting--common-issues)
- [Testing](#testing)
- [Development Tips](#development-tips)
- [Contributing](#contribution)
- [Security](#security)
- [Resources](#resources)

## About
This project is a mini CRM designed for small businesses. It provides:
- Contact, company, product, deal, tasks, and discussion management
- Real-time chat and rooms
- File uploads (Supabase storage) with media rendering
- An AI assistant powered by Google Gemini with RAG (embeddings + similarity search)
- A settings page for profile, avatar, notifications, and account management

## Features
- ✅ CRUD for contacts, companies, deals, products, tasks, discussions
- ✅ Real-time updates using Supabase
- ✅ File uploads and intelligent media rendering (image, audio, video)
- ✅ AI assistant that uses:
  - Conversation history
  - Business context (recent contacts, deals, tasks)
  - Retrieval-Augmented Generation (RAG) using embeddings and a `match_embeddings` RPC
- ✅ Tabbed settings UI, avatar upload, password changes, and "Danger Zone" account actions

## Technology Stack
- **Framework**: SvelteKit (TypeScript)
- **UI**: Flowbite Svelte components & icons
- **Backend DB & Auth**: Supabase (Postgres + storage + functions)
- **AI**: Google Gemini via `@google/genai`
- **Embeddings & Similarity Search**: Supabase vector extensions / RPC
- **Build Tooling**: Vite, bun / Node-compatible (see package.json)

## High-Level Repo Structure
```
src/
  ├── lib/
  │   ├── supabase.ts              # Supabase client & helpers
  │   ├── services/                # Service layer (companies, contacts, rooms, etc.)
  │   ├── components/              # Reusable Svelte components
  │   └── graphql.ts, index.ts     # Helpers & exports
  ├── routes/
  │   ├── (app)/dashboard/         # Main app UI (contacts, deals, assistant, rooms, settings)
  │   ├── api/assistant/+server.ts # AI assistant endpoint (Gemini + RAG)
  │   └── api/files/upload/        # File upload handler
  ├── app.html, app.css            # Global app shell and styling
database/                          # SQL scripts (embeddings, migrations)
supabase/functions/                # Serverless functions
scripts/                           # Sample data seeding
static/                            # Static assets
```

## Prerequisites
- **Node.js** (recommended LTS; check `package.json` for engine)
- **npm** or **pnpm** or **yarn**
- **Supabase project** (Postgres, Storage)
- **Google API key** for Gemini (or alternate model)
- **(Optional) bun** — some dev scripts may run under bun; Node is fully supported

## Quickstart — Local Development

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd CRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   # pnpm install
   ```

3. **Set environment variables**
   - Copy `.env.example` (if exists) or create `.env` and add the keys listed in [Environment Variables](#environment-variables).

4. **Start development server**
   ```bash
   npm run dev
   ```
   - Open: http://localhost:5173 (or the port shown)

5. **Seed sample data (optional)**
   - Run SQL scripts in `database/` or use `scripts/add_sample_data.sql` with psql / Supabase SQL editor.

## Environment Variables
Create a `.env` file (or use your platform env) with at least the following values:

**Required for Supabase:**
```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<supabase-anon-or-service-role-key>
SUPABASE_SERVICE_KEY=<service-role-key-for-server-operations>
```

**Required for Google Gemini:**
```env
PUBLIC_GOOGLE_API_KEY=<your-google-api-key>
```

**Other helpful vars:**
```env
VITE_SUPABASE_URL=<same-as-above-if-frontend-uses-it>
VITE_SUPABASE_KEY=<same-as-above-if-frontend-uses-it>
DATABASE_URL=<if-running-migrations-locally>
NODE_ENV=development
```

> **Note**: The code references `PUBLIC_GOOGLE_API_KEY` (a SvelteKit public env). If you keep keys secret, prefer server-only env vars and avoid exposing them to the client.

## Database & Embeddings Setup
To use RAG and similarity search you'll need to set up embeddings storage and functions:

1. **Run the SQL in `database/similarity_search_setup.sql`**
   - Creates table(s) or functions (e.g., `match_embeddings`) used by the assistant
2. **Run `database/files_table_migration.sql`** to add file metadata columns (`file_type`, `file_size`)
3. **Run `database/check_embeddings.sql`** to check existing embeddings or debug
4. **If you use Supabase Functions for embeddings**, review `supabase/functions/embedding-function/index.ts`

**Notes:**
- The app expects a `match_embeddings` RPC that accepts `query_embedding`, `match_threshold`, and `match_count`.
- Embeddings are generated using `text-embedding-004` via the Google REST endpoint in the code. Ensure your Google API key has Embedding permissions.

## AI Assistant (Important Runtime Notes)
**Endpoint**: `src/routes/api/assistant/+server.ts`

The assistant builds a system prompt combining:
- Discussion metadata
- Conversation history
- RAG results from `match_embeddings`
- Business context (contacts, deals, tasks, products)

It calls Google GenAI SDK (`@google/genai`). The code supports both `gemini-3-pro-preview` and `gemini-2.0-flash-exp`. For local free-tier use, the project defaults to **`gemini-2.0-flash-exp`**.

### Embeddings
- The code uses a direct REST call to `text-embedding-004` for embeddings.
- Embeddings are then matched using Supabase RPC.

### Rate Limits & Quotas
- **Gemini 3** requires billing; free quota may be zero for some models.
- If you see 429 quota errors, switch to `gemini-2.0-flash-exp` or enable billing for Gemini 3 in GCP.

### Common Errors & Fixes
- **"Quota exceeded"** → enable billing or switch to free-tier model
- **"fetch failed sending request"** → ensure outbound network access and valid API key, verify environment variable `PUBLIC_GOOGLE_API_KEY` is set
- **"ApiError"** → inspect `node_modules/@google/genai` logs or SDK error message for details

### How to Change the Model
Edit `src/routes/api/assistant/+server.ts`:
- Look for `client.models.generateContent({ model: "<model-id>", ... })`
- Replace model with:
  - `"gemini-2.0-flash-exp"` for free-tier friendly
  - `"gemini-3-pro-preview"` for Gemini 3 (billing required)

## Services & Where to Edit Logic
The app uses a services layer under `src/lib/services/` — small, focused modules for each domain:
- `contacts.service.ts`, `companies.service.ts`, `deals.service.ts`, `rooms.service.ts`, `files.service.ts`, `profiles.service.ts`, etc.
- **Modify business logic, validation, or DB queries here.**

## Frontend
- Svelte components live in `src/lib/components/` (Chatbox.svelte, DataTable.svelte, DiscussionBox.svelte, Header/Footer/Sidebar)
- Routes are in `src/routes/(app)/dashboard/*`
- The settings page is at `src/routes/(app)/dashboard/settings/+page.svelte`

## File Uploads & Media Rendering
- File uploads handled via `src/routes/api/files/upload/+server.ts` and `files.service.ts`
- Chatbox renders images, video, audio based on detected MIME type
- Ensure `files_table_migration.sql` has `file_type` and `file_size` columns for proper rendering

## Deployment
**Build:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Deploy to any SvelteKit-compatible host** (Vercel, Netlify, Cloudflare Pages with adapter, or self-host):
- Ensure env vars are set in your deployment provider
- For server-side Supabase operations, prefer `SUPABASE_SERVICE_KEY` in server environment only

## Troubleshooting & Common Issues

### 1. AI assistant returns 429 / quota errors
- Check `PUBLIC_GOOGLE_API_KEY` and GCP billing/quotas
- Switch to `gemini-2.0-flash-exp` for free-tier testing

### 2. "fetch failed sending request" from GenAI SDK
- Confirm network access from your dev host
- Confirm API key is correct and not blocked
- Confirm Node TLS settings (rare)

### 3. Icon import / Flowbite issues
- Some Flowbite icon names differ; check `node_modules/flowbite-svelte-icons/package.json` for available exports

### 4. TypeScript errors about `contents` shape
The GenAI SDK expects `contents` as an array of content objects with `role` and `parts`:
```typescript
contents: [
  { role: 'user', parts: [{ text: 'Hello' }] }
]
```

### 5. Supabase errors for missing columns
- Run DB migrations in `database/` to add missing columns like `file_type`, `file_size`, embeddings table, etc.

## Testing
- **Unit tests**: none included by default
- **Manual testing**:
  - Log in via the auth route, create sample data, open a discussion, and interact with the Assistant UI.
  - Monitor server logs for AI calls and Supabase queries.

## Development Tips
- Use the service layer for business logic changes — keeps routes clean
- Reuse UI components in `src/lib/components`
- When updating embeddings or similarity functions, re-run `database/similarity_search_setup.sql` and regenerate embeddings if needed

## Contribution
- Fork the repo, create a feature branch, and open a PR
- Keep changes limited to a single concern per PR
- Add tests for new business logic where possible

## Security
- Never commit API keys or secrets to the repo
- Use server-only env vars for service keys
- Rotate keys if they leak

## Resources
- [Gemini 3 Documentation](https://ai.google.dev/gemini-api/docs/gemini-3)
- [GenAI SDK](https://www.npmjs.com/package/@google/genai)
- [Supabase](https://supabase.com)
- [SvelteKit](https://kit.svelte.dev)

---

**Built with ❤️ for small businesses**
