# DevDart — Precision Web Development

Portfolio site for [DevDart](https://devdart.in), a freelance agency that builds websites, internal tools, and automation for businesses — end to end: creation, hosting, and management — on a flat **$800/month** subscription.

**Dev** means development. **Dart** means precision.

## Stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

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
git remote add origin https://github.com/<your-username>/<repo-name>.git
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
