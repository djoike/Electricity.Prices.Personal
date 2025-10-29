# Electricity.Prices.Personal

A very small, serverless Vue 3 app that displays the current Danish electricity price and the next 36 hours as a responsive bar chart. Uses data from `stromligning.dk` and deploys to GitHub Pages.

## Stack
- Vue 3 + Vite + TypeScript
- SCSS for styling
- Chart.js via vue-chartjs
- No backend; static hosting on GitHub Pages

## Local development
```bash
pnpm install
pnpm dev
# open http://localhost:5173/Electricity.Prices.Personal/ (or just / during local dev)
```

## Build
```bash
pnpm build
```

## Deploy to GitHub Pages
This repo includes a GitHub Actions workflow that builds on pushes to `main` and publishes the `dist/` folder to Pages. Make sure Pages is set to **Source: GitHub Actions** in your repository settings.

> **Note**: `vite.config.ts` sets `base` to `/Electricity.Prices.Personal/` so assets resolve correctly on Pages. If you rename the repo, update that value.

## Configuration
All API parameters are hardcoded in `src/data/config.ts`:
```ts
export const BASE_URL = 'https://stromligning.dk';
export const PRODUCT_ID = 'greenbow_elaftale';
export const SUPPLIER_ID = 'noe_net';
export const HOURS_AHEAD = 36;
export const AGGREGATION = '1h';
export const AGGREGATION_METHOD = 'mean';
export const INCLUDE_FORECAST = true;
```

## Refresh behavior
- Auto-refresh on **tab focus** (when the tab becomes visible).
- Hidden manual refresh by tapping/clicking the **top-right corner** (44×44 px hit area).

## Notes for Tesla/mobile
- Dark theme by default, large tap target hit area, and responsive layout.
- No service worker is included. If you later want offline viewing, add one and cache the most recent payload.
