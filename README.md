# Capitar — Portfolio Operations & MIS

A single-page dashboard prototype for a **venture-debt fund**: portfolio holdings,
fundraising and deployment pipeline, secondary-market investor holdings, and the
underlying data models — all in one view.

Built as a static site with **plain HTML, CSS and vanilla JavaScript**. No build
step, no framework, no backend. Charts are hand-drawn SVG, so the whole thing is
self-contained and runs from any static host.

> All figures are **sample/dummy data** (see `data.js`). Nothing here is real
> portfolio information.

## What's inside

| View | What it shows |
|------|---------------|
| **Home** | Fund snapshot (AUM, outstanding principal, sell-down, weighted coupon), fund-wise holdings, status split, and the ALM cashflow ladder |
| **Portfolio** | Top exposures, status donut (click to filter), holdings table with group-by (company / sector / maturity / risk), and Capitar-vs-investor unit split |
| **Pipeline** | Fundraising pipeline (LPs into the new fund) + deployment pipeline (prospective borrowers), filterable by stage |
| **Investors** | Secondary-market investor holdings and a per-investor cashflow ladder |
| **Data Inputs** | Every data model behind the dashboard, with a live sample record |

Plus a **₹ Lakh / ₹ Cr toggle** and a derived **alerts** drawer (stressed/watch
holdings, near-term maturities).

## Run locally

It's static, so just open it — but a tiny local server avoids any file-path quirks:

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repo and push these files to the `main` branch (keep `index.html` at the root).
2. Repo → **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**, **Branch = main / (root)**, and Save.
4. Wait ~1 minute; your site goes live at `https://<username>.github.io/<repo-name>/`.

## Project structure

```
.
├── index.html    # markup + shell (sidebar, topbar, views, alerts drawer)
├── styles.css    # design tokens + all styling
├── data.js       # sample dataset (funds, holdings, schedules, investors, pipeline)
└── app.js        # rendering, SVG charts, filtering, currency toggle, alerts
```

## Notes on the model

- Money is stored once, in **₹ Lakh**, and converted to Cr at render time (1 Cr = 100 L).
- A **holding** is one NCD tranche; `unitsCapitar + unitsInvestors = principal` (face value).
- The **ALM ladder** overlays actual received cashflows on top of expected ones.
- **Alerts** are derived from the book at load time, not stored.
