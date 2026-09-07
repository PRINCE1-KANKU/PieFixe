# Pie Fixe — GitHub Pages + Node API

This copy is prepared for deploying the Pie Fixe website with GitHub Pages.

## Website (GitHub Pages)

The static frontend is in the repository root. GitHub Pages can therefore use:

- Branch: `main`
- Folder: `/ (root)`

A `CNAME` file is included for `piefixe.co.za` and `.nojekyll` is included for static hosting.

## Backend

The Node/Express backend remains in `server/`. GitHub Pages does **not** run Node.js, so the backend must be deployed separately to a Node-compatible host.

The frontend currently points to:

`https://api.piefixe.co.za/api`

in `config.js`.

## Important

Do not put private backend `.env` values or API secrets into the frontend. Keep secrets in the backend hosting environment.
