# Murder Mystery Detective

Browser-based detective game (**Deadly Secrets** scenario). English UI.

## Play online (GitHub Pages)

Your site URL (after Pages is enabled):

**https://mirithirsh-web.github.io/Murder-Mystery/**

### If you see “404 / There isn’t a GitHub Pages site here”

GitHub does **not** turn Pages on automatically.

#### Option A — Simplest (no Actions)

1. **Settings** → **Pages** → **Build and deployment** → **Source**: **Deploy from a branch**
2. Branch: **main**, folder: **/ (root)** → **Save**
3. Wait 1–2 minutes, then open **https://mirithirsh-web.github.io/Murder-Mystery/**

You can ignore the **Actions** workflow for this option (or delete `.github/workflows/deploy-github-pages.yml` later).

#### Option B — GitHub Actions workflow

The workflow **cannot** deploy until Pages is wired to Actions **once** in the UI (otherwise the API returns “Not Found”):

1. **Settings** → **Pages** → **Source**: **GitHub Actions** → **Save** (do this **before** expecting a green deploy).
2. **Actions** → **Deploy to GitHub Pages** → **Re-run all jobs** (or push a commit to `main`).
3. When the run is green, refresh **Settings → Pages** for the live URL.

## Run locally

```bash
git clone git@github.com:mirithirsh-web/Murder-Mystery.git
cd Murder-Mystery
python3 server.py
```

Open **http://localhost:8081** (or `python3 -m http.server 8080` and use port 8080).

Using `file://` on `index.html` is unreliable because the game loads JSON via `fetch`.

## License

Add your license here if you publish publicly.
