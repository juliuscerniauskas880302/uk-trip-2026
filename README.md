# Explore Three Cities 🇬🇧⚓🚢

**London • Portsmouth • Gosport**

Your simple, fast travel companion for discovering the best of three amazing UK destinations.

## Quick Start (Local)

```bash
npx -y http-server -p 8080 -c-1
```

Open `http://localhost:8080` in Chrome.

## Deploy to GitHub Pages (Free Hosting)

1. **Create a GitHub account** at [github.com](https://github.com) if you don't have one
2. **Create a new repository** — name it anything (e.g., `uk-trip`)
3. **Upload all files** from this folder to the repository
4. Go to **Settings → Pages → Source** → select `main` branch → **Save**
5. Your app will be live at `https://YOUR-USERNAME.github.io/uk-trip/`

### Fix paths for subdirectory hosting

If your app is at `username.github.io/uk-trip/` (not root), update these:

- In `manifest.json`: Change `"start_url": "/index.html"` → `"start_url": "./index.html"` and `"scope": "/"` → `"scope": "."`
- In `sw.js`: Update the `PRECACHE_URLS` array to use relative paths (`./index.html` instead of `/index.html`)

## Install on Android

1. Open your app URL in **Chrome** on your Android phone
2. Tap the **three-dot menu** (⋮) → **"Add to Home Screen"**
3. The app will appear on your home screen with its own icon
4. It launches full-screen and works offline!

## Alternative Free Hosting Options

| Service | URL | Setup |
|---------|-----|-------|
| **GitHub Pages** | github.io | Push to repo → enable Pages |
| **Netlify** | netlify.app | Drag & drop folder upload |
| **Vercel** | vercel.app | Connect GitHub repo |
| **Cloudflare Pages** | pages.dev | Connect GitHub repo |

All of these provide free HTTPS (required for PWA install).

## Features

- ✅ 29 curated places across 3 cities
- ✅ One-tap Google Maps directions
- ✅ Favorites saved locally
- ✅ Works offline (PWA)
- ✅ Installable on Android home screen
- ✅ Dark mode, glass UI, smooth animations
- ✅ Zero dependencies, ultra-fast loading
