# Farmers Connect 🌾

A social platform purpose-built for farmers — Instagram-style feed and profiles, **plus** a
**Marketplace** (farmers/organizations buy & sell produce, livestock, equipment) and an
**Education** hub (NGOs and organizations publish courses farmers can enroll in).

Built as a Progressive Web App (PWA): one codebase that works as a **website** and installs
as an **app** on phone home screens — recommended over maintaining two separate frontends.

This is original, from-scratch code (no Instagram/Meta source used) — UI/UX patterns
(feed, like, comment, follow, bottom nav) are common, unprotected interaction conventions,
not copied assets or code.

---

## Architecture (Object-Oriented)

```
farmers-connect/
├── backend/                  Node.js + Express REST API
│   ├── schema.sql            Postgres schema (run once on Neon)
│   ├── src/
│   │   ├── db/pool.js        Shared Neon-compatible Postgres connection pool
│   │   ├── db/migrate.js     Applies schema.sql programmatically
│   │   ├── models/
│   │   │   ├── BaseModel.js  Abstract class: generic CRUD (insert/update/delete/find)
│   │   │   ├── User.js       extends BaseModel — auth, follow/unfollow, individual vs organization
│   │   │   ├── Post.js       extends BaseModel — feed, likes, comments
│   │   │   ├── Product.js    extends BaseModel — marketplace listings + orders
│   │   │   └── Course.js     extends BaseModel — education content + enrollments
│   │   ├── controllers/      Route handlers, one per resource
│   │   ├── middleware/auth.js  JWT auth guard + organization-only guard
│   │   ├── routes/           Express routers per resource
│   │   ├── app.js            Express app (CORS, security headers, rate limiting)
│   │   └── server.js         Entry point
│   └── package.json
│
├── frontend/                 PWA (vanilla JS, ES Modules — no build step needed)
│   ├── index.html
│   ├── manifest.json         PWA manifest (installable)
│   ├── sw.js                 Service worker (offline caching)
│   ├── css/styles.css
│   └── js/
│       ├── app.js            Bootstraps router, nav, auth check
│       ├── services/
│       │   ├── api.js        ApiService class — every backend call lives here
│       │   ├── store.js       Store class — holds logged-in user, observable
│       │   └── router.js     Router class — hash-based SPA routing
│       └── views/             One class per screen, all extending BaseView
│           ├── BaseView.js, AuthView.js, FeedView.js,
│           ├── MarketplaceView.js, EducationView.js, ProfileView.js, NavView.js
│
└── render.yaml                One-click Render blueprint for both services
```

### Why this OOP structure
- `BaseModel` centralizes all SQL CRUD logic once; every entity model (`User`, `Post`,
  `Product`, `Course`) **inherits** it and only adds domain-specific methods
  (e.g. `Post.like()`, `Product.placeOrder()`).
- `BaseView` does the same on the frontend: a shared `render()` contract, DOM helper
  methods, and utilities (`timeAgo`, `toast`) inherited by every screen class.
- `ApiService` and `Store` are singleton classes that encapsulate all network state and
  app state respectively — no scattered `fetch()` calls or global variables.

---

## Core features delivered

- **Account types at signup**: every new user explicitly identifies as an
  **Individual Farmer** or an **Organization** (NGO / Cooperative / Government / Agribusiness).
  This flag (`account_type`) drives permissions across the app (only organizations can
  publish courses, for example).
- **Instagram-like core**: photo posts, captions, likes, comments, follow/unfollow,
  profile grid, bottom navigation.
- **Marketplace**: any farmer or organization can list products (seeds, livestock,
  produce, equipment, fertilizer) with price/quantity/unit/location, and place orders
  on others' listings.
- **Education**: organizations publish courses (with category, cover image, and a link
  to video/PDF/article content); farmers browse and enroll.
- **PWA**: installable, has an offline-capable service worker, works on mobile and desktop
  from the same codebase.

---

## Deployment — Neon (database) + Render (hosting)

### 1. Create your Neon database
1. Sign up at https://neon.tech and create a new project (e.g. `farmers-connect`).
2. Copy the **pooled connection string** from the Neon dashboard — looks like:
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/farmersconnect?sslmode=require`
3. Apply the schema. Easiest way: open Neon's SQL Editor in the dashboard, paste the
   contents of `backend/schema.sql`, and run it.
   (Alternative: set `DATABASE_URL` locally and run `npm run migrate` inside `backend/`.)

### 2. Deploy the backend API to Render
1. Push this project to a GitHub repo.
2. In Render, **New → Web Service**, connect the repo, set **Root Directory** to `backend`.
3. Build command: `npm install` — Start command: `npm start`.
4. Add environment variables (Render dashboard → Environment):
   - `DATABASE_URL` → your Neon connection string
   - `JWT_SECRET` → a long random string (generate with
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `CLIENT_ORIGIN` → the URL of your deployed frontend (add after step 3 below; comma-separate if multiple)
   - `NODE_ENV` → `production`
5. Deploy. Note the resulting backend URL, e.g. `https://farmers-connect-api.onrender.com`.

### 3. Deploy the frontend (PWA) to Render
1. In Render, **New → Static Site**, connect the same repo, **Root Directory** `frontend`.
2. Build command: leave empty (no build step). Publish directory: `.`
3. Before deploying, open `frontend/js/services/api.js` and replace:
   ```js
   : 'https://YOUR-BACKEND-NAME.onrender.com/api';
   ```
   with your actual backend URL from step 2 above.
4. Deploy. You'll get a URL like `https://farmers-connect.onrender.com` —
   this is both your **website** and, once visited on a phone and "Added to Home Screen"
   (PWA install prompt), your **app**.
5. Go back to the backend service's `CLIENT_ORIGIN` env var and set it to this frontend URL,
   then redeploy the backend so CORS allows it.

### 4. Replace placeholder icons
`frontend/icons/icon-192.svg` is a placeholder. Before going live, generate real
`icon-192.png` and `icon-512.png` (any logo tool, or `npx sharp-cli`) and place them
in `frontend/icons/` — `manifest.json` already points to them.

---

## Running locally

**Backend**
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npm run migrate           # applies schema.sql to your Neon DB
npm run dev                # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npx serve .                # or any static file server, e.g. `python3 -m http.server 5173`
```
Visit the printed local URL — `js/services/api.js` already points to
`http://localhost:4000/api` when running on `localhost`.

---

## Suggested next steps
- Add real image upload (e.g. Cloudinary or S3) instead of pasting image URLs.
- Add a messaging/chat screen (the `messages` and `notifications` tables already exist
  in `schema.sql` — just needs routes/controllers/views, following the same pattern).
- Add push notifications via the PWA's service worker.
- Add pagination/infinite scroll to the feed and marketplace grids.
