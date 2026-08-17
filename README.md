# DevDart — Precision Web Development

Portfolio site for [DevDart](https://devdart.in), a freelance agency that builds websites, internal tools, and automation for businesses — end to end: creation, hosting, and management — on a flat **$800/month** subscription.

**Dev** means development. **Dart** means precision.

## Stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Supabase](https://supabase.com/) — bookings database + admin auth

## Booking & admin panel

The **Book a free call** buttons open a modal where visitors pick a date and a
time slot and leave their details. Bookings are stored in Supabase, and an admin
panel at [`/#/admin`](http://localhost:5173/#/admin) lists them (sign-in
required) with per-booking status (pending → confirmed → cancelled) and delete.

Until Supabase is connected the booking modal runs in **demo mode** (the flow
works but nothing is saved), and the admin panel shows a setup notice.

### One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com/).
2. In **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates the `bookings` table, the row-level-security policies (public can
   only *create* bookings; only a signed-in admin can read them), and the
   `get_booked_slots` availability function.
3. Create your admin login under **Authentication → Users → Add user** (email +
   password). You'll use these to sign in at `/#/admin`.
4. Copy your API values from **Project Settings → API** into a local `.env`:

   ```bash
   cp .env.example .env
   # then edit .env:
   # VITE_SUPABASE_URL=https://your-ref.supabase.co
   # VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. Restart `npm run dev`. The modal now saves real bookings, and `/#/admin`
   lists them after you sign in.

For the deployed GitHub Pages build, add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` as repository **Actions → Secrets and variables →
Variables**, then reference them in the build step of
`.github/workflows/deploy.yml`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on every push to `main`.

1. Create a new GitHub repository (e.g. `devdart`).
2. Push this project to `main` (see below).
3. In the repo on GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. After the first workflow run completes, the site will be live at  
   `https://<your-username>.github.io/<repo-name>/`

For a custom domain (e.g. `devdart.in`), add a `CNAME` file in `public/` and configure DNS in your repo's Pages settings.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: DevDart portfolio site"
git branch -M main
git remote add origin https://github.com/thedevdart/devdart.git
git push -u origin main
```

## Project structure

```
src/
  components/   # UI sections (Hero, Services, Pricing, etc.)
  hooks/        # Responsive helpers
  App.jsx       # Page layout & scene transitions
  index.css     # Theme, animations, mobile overrides
  main.jsx      # React entry point
```

## Contact

**team@devdart.in**
