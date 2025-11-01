# Lacrosse Recruiting CRM MVP Starter

This repository is a **minimal, mobile‑first PWA** starter for a lacrosse recruiting CRM.  
It uses **Next.js (App Router)** with **TypeScript**, **Tailwind CSS** and **Supabase** to store data.  
The goal of this starter is to give you something simple and neat that you can run locally and extend as you build out your recruiting tool.

## Features

* ✅ Listing and adding players (`/players`)
* ✅ Listing and adding colleges (`/colleges`)
* ✅ Logging interactions between players and colleges (`/interactions/new`)
* ✅ Supabase client configured via environment variables
* ✅ Tailwind CSS styling and a basic layout

This starter deliberately omits authentication, complex permissions and analytics so that you can focus on core interactions first.  
You can add those features later once you have the basics working.

## Getting Started

1. **Clone the repo**

   ```bash
   git clone <this repo> lax-recruiting-crm-mvp-starter
   cd lax-recruiting-crm-mvp-starter
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn
   ```

3. **Configure Supabase**

   Create a Supabase project at [supabase.com](https://supabase.com) and set up three tables:

   - **players** — columns: `id (uuid, primary key, default uuid())`, `first_name (text)`, `last_name (text)`, `grad_year (integer)`, `created_at (timestamp, default now())`.
   - **colleges** — columns: `id (uuid, primary key, default uuid())`, `name (text)`, `division (text, nullable)`, `region (text, nullable)`, `created_at (timestamp, default now())`.
   - **interactions** — columns: `id (uuid, primary key, default uuid())`, `player_id (uuid, foreign key to players.id)`, `college_id (uuid, foreign key to colleges.id)`, `type (text)`, `notes (text, nullable)`, `created_at (timestamp, default now())`.

   Ensure that **Row Level Security (RLS)** is turned off or configured to allow inserts and selects while you’re prototyping.  
   Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key:

   ```bash
   cp .env.example .env.local
   # Then edit .env.local with your values
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.  
   You can start adding players, colleges, and logging interactions right away.

## File Structure

```
├── app
│   ├── layout.tsx         # Shared layout and global styles
│   ├── page.tsx           # Landing page with navigation
│   ├── globals.css        # Tailwind base/styles
│   ├── players
│   │   └── page.tsx       # List/add players
│   ├── colleges
│   │   └── page.tsx       # List/add colleges
│   └── interactions
│       └── new
│           └── page.tsx   # Form to log a new interaction
├── lib
│   └── supabaseClient.ts  # Supabase client singleton
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── tsconfig.json
├── package.json
└── .env.example
```

## Extending the Starter

This starter is intentionally barebones.  Some ideas for next steps:

* Add **authentication** and role‑based access (Supabase Auth or NextAuth).
* Create a **roster grid** view that joins players and colleges via interactions.
* Implement **status tracking** for interests (e.g. contacted, offer, committed).
* Add **file uploads** for highlight videos or transcripts using Supabase storage.
* Build **email reminders** for stale interactions and check‑in reports.

Feel free to fork and customise this project.  Pull requests are welcome!