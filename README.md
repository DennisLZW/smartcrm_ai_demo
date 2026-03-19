## SmartCRM AI Demo

A CRM demo built with **Next.js App Router + Prisma + Postgres (Docker)**.

## Features
- **Customer management**: CRUD (including notes). Customers list links to customer details.
- **Activity timeline**: Add activities on the customer details page; view a global recent timeline.
- **Dashboard**: Key metrics, recent activities, and customers to follow up on. Cards link to the lists.
- **Dev data seeding**: Generate 50 customers + random activities.
- **Email assistant & logs**: Draft and send plain-text emails via Gmail OAuth, and view email logs.

## Getting Started

### Prerequisites
- Node.js / npm
- Docker Desktop (for local Postgres)

### 1) Start Postgres (Docker)

```bash
docker compose up -d db
```

Default port mapping: `localhost:5434 -> container:5432`

### 2) Configure environment variables

`.env` is included with defaults; locally you can use it directly:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/smartcrm?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3) Install dependencies

```bash
npm install
```

### 4) Initialize the database (Prisma migrate)

```bash
npx prisma migrate dev
```

### 5) Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000`

## Seed (Demo data)

Available only in development:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Writes: **50 customers** + **random activity records**.

### Reset + Seed (with login accounts)

Resets demo data (clears `Customer` / `Activity` / `User`):

```bash
curl -X POST http://localhost:3000/api/dev/reset-seed
```

It creates 3 login accounts by default (same password):
- admin: `admin@demo.local` / `password123`
- staff: `staff1@demo.local` / `password123`
- staff: `staff2@demo.local` / `password123`

## AI & Gmail (OAuth)

### AI endpoints
- `POST /api/ai/insight`: Generate progress insight based on customer + recent activities
- `POST /api/ai/email/draft`: Generate a plain-text follow-up email draft

### Gmail OAuth (send plain text)

1) Configure `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/oauth/callback
GMAIL_SENDER_USER=your@gmail.com
GMAIL_SEND_AS=your@gmail.com

# AI (either OpenAI or Gemini, depending on what you set)
OPENAI_API_KEY=...
# GEMINI_API_KEY=...
```

2) Connect Gmail (stores the refresh token into `GmailAuth`):
- Open `/api/gmail/oauth/start`

3) Send email:
- `POST /api/email/send` (body: `customerId,toEmail,subject,bodyText`)

## Routes

### Pages
- `/dashboard`: Dashboard (cards + recent activities + follow-up)
- `/dashboard/new-customers`: New customers (last 7 days)
- `/dashboard/stale-customers`: Customers to follow up (14 days without contact)
- `/customers`: Customer list (CRUD) — click a customer to open details
- `/customers/[id]`: Customer details + activities (manual add)
- `/activities`: Global activities timeline (latest 50)
- `/emails`: Global email logs
- `/emails/[id]`: Email log detail + plain-text body

### APIs
- `GET/POST /api/customers`
- `GET/PATCH/DELETE /api/customers/[id]`
- `GET/POST /api/activities`
- `POST /api/email/send`
- `GET /api/email/logs`
- `POST /api/dev/seed` (development only)
- `POST /api/dev/reset-seed` (development only)

## Notes
- Prisma Client output is generated into `lib/generated/prisma/` (see `prisma/schema.prisma`).
- If you change `.env`, restart `npm run dev`.

## Deployment (Vercel + Neon)

This project supports production deployment with a hosted Postgres database (Neon) and Vercel.

### 1) Create Neon Postgres
- Create a Neon Postgres project (Serverless Postgres is fine).
- Copy the `DATABASE_URL` (make sure it includes SSL settings as provided by Neon).

### 2) Configure Vercel Environment Variables
In your Vercel project: `Settings -> Environment Variables`:

Required:
- `DATABASE_URL` (from Neon)
- `NEXTAUTH_URL` (your production URL, e.g. `https://crm.example.com`)
- `NEXTAUTH_SECRET` (generate a long random string and keep it secret)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (must exactly match your production callback)
- `GMAIL_SENDER_USER`
- `GMAIL_SEND_AS` (optional, but recommended)

AI (choose one):
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional; default is `gemini-1.5-flash`)

Recommended:
- `NEXT_PUBLIC_APP_URL` = `NEXTAUTH_URL`

### 3) Vercel Build Command (Prisma migration)
Set `Build Command` to:

```bash
npx prisma generate && npx prisma migrate deploy && npm run build
```

And `Start Command` to:

```bash
npm start
```

### 4) Google OAuth redirect URI
In Google Cloud Console, add this exact redirect URI:
- `https://<your-domain>/api/gmail/oauth/callback`

If your Google OAuth consent screen is in **Testing** mode, add your test email(s) to **Test users** to avoid `access_denied`.

### 5) Important note about dev endpoints
The endpoints under `POST /api/dev/*` are disabled in production (they return `403`), so use them only for local development.

## Next
Planned AI enhancements (based on activities/customer information):
- Auto-convert raw notes into structured activities
- Better AI insights and next-action generation
- Email assistant improvements (drafting, refining, and follow-up)
