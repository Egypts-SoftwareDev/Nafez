Nafez Landing – Production Redirect to Alpha

Overview
- The landing server issues a 302 redirect for any request under `/alpha` to the same path on the Alpha environment.
- Configure the destination origin using the `ALPHA_ORIGIN` environment variable. Optionally set `ALPHA_BASE_PATH` if your alpha app is mounted under a subpath (defaults to `/alpha`).

Configuration
- Required env vars:
  - `PORT` (optional): Port for the landing server (default: 3000)
  - `ALPHA_ORIGIN` (required): Origin of the alpha environment, e.g. `https://alpha.nafez.example`
  - `ALPHA_BASE_PATH` (optional): Where the alpha app is mounted on the alpha origin. Use `/alpha` for local dev, or `/` if the alpha app runs at the origin root. Defaults to `/alpha`.

Options to set variables
- Host environment:
  - PowerShell: `$env:ALPHA_ORIGIN='https://alpha.nafez.example'`
  - Bash: `export ALPHA_ORIGIN='https://alpha.nafez.example'`
- .env file (loaded automatically):
  - Copy `.env.example` to `.env` and set `ALPHA_ORIGIN` and `ALPHA_BASE_PATH`
- systemd unit example:
  - `Environment=PORT=80`
  - `Environment=ALPHA_ORIGIN=https://alpha.nafez.example`
  - `Environment=ALPHA_BASE_PATH=/`

Local test
1) Start alpha: `cd C:\nafez-alpha && node server.js` (port 4000)
2) Start landing: set `ALPHA_ORIGIN=http://localhost:4000` and `ALPHA_BASE_PATH=/alpha`, then `node server.js`
3) Visit `http://localhost:3000/` then click “Preview Nafez Alpha” (or open `/alpha/login`).

