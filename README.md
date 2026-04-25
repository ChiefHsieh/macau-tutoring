## Macau Tutoring Marketplace (MVP)

Web-first tutoring marketplace for Macau, based on a 12-week MVP roadmap.

### Tech stack
- Next.js 16 + TypeScript + Tailwind
- Supabase (Auth + Postgres)
- next-intl (Traditional Chinese + English)
- React Hook Form + Zod
- FullCalendar (availability)

### Getting started
1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Start dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000` (auto-redirect to `/zh-HK`).

### Project planning docs
- Execution TODO: `docs/MVP_TODO.md`
- Initial DB schema: `supabase/schema.sql`

### Current status
- [x] Project scaffold created
- [x] Core dependencies installed
- [x] Bilingual routing (`zh-HK` / `en`) set up
- [x] Initial roadmap page implemented
- [x] Database schema file prepared

### Next implementation target
- Build authentication and role-based onboarding flow (Phase 1).

