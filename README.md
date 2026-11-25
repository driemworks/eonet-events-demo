# eonet

NASA [EONET](https://eonet.gsfc.nasa.gov/docs/v3) natural events → the `eonet-events` repo on Fangorn, through
[`@fangorn-network/logbook`](../logbook). One record per event (id `EONET_…`); a changed event replaces its record.

- `ingest.js`: fetches the last `EONET_DAYS` (default 7) of events, open and closed, and publishes the new or changed
  ones. `data/state.json` holds a hash per published event. `--dry` prints what would be published.
- `site/`: the page (map, categories, search) on the indexer's `/view.json` and `/search`. `?index=<url>` overrides
  the indexer.
- `.github/workflows/ingest.yml`: 06:00 and 18:00 UTC; commits `data/state.json` back.
- `.github/workflows/pages.yml`: deploys `site/` to GitHub Pages on push to main.

## Setup

1. An indexer (ops app) that accepts `eonet-events` from your grant wallet.
2. Repo variable `EONET_APP` (the indexer URL); secrets `FANGORN_TOKEN` (its grant) and `NASA_API_KEY` (optional).
3. Settings → Pages → Source: GitHub Actions. Set the default indexer in `site/index.html` (`INDEX`).
