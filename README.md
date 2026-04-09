# Murder Mystery Detective

Browser-based detective game (**Deadly Secrets** scenario). English UI.

## Play online (GitHub Pages)

**Live URL:** https://mirithirsh-web.github.io/Murder-Mystery/

### Turn on Pages (one-time)

GitHub does **not** publish the site until you enable it:

1. Open the repo on GitHub → **Settings** → **Pages** (sidebar).
2. **Build and deployment** → **Source**: **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Wait **1–2 minutes**, then open the URL above (hard refresh if needed).

If you see **404 — There isn’t a GitHub Pages site here**, GitHub has **not created a Pages site** for this repo yet. The code on `main` is fine; only the **Pages setting** is missing or wrong.

**Check these mistakes:**

| Mistake | Fix |
|--------|-----|
| Folder is **`/docs`** | Must be **`/ (root)`** — `index.html` is at repo root, not in `docs/`. |
| Branch is not **`main`** | Select **`main`**. |
| **Source** is still **GitHub Actions** | Switch to **Deploy from a branch** (this repo does not use a Pages workflow). |
| Repo is **private** (free plan) | GitHub may block Pages on private repos unless you have a paid feature; make the repo **public** for free hosting. |

### Enable Pages via API (one command)

If the UI is confusing, run this once from your machine (creates or updates the Pages site):

```bash
cd Murder-Mystery
chmod +x scripts/enable-github-pages.sh
export GITHUB_TOKEN=ghp_YOUR_CLASSIC_PAT_WITH_REPO_SCOPE
./scripts/enable-github-pages.sh
```

Create a token: **GitHub → Settings → Developer settings → Personal access tokens**.  
Classic: enable **`repo`**. Fine-grained: **Contents: Read**, **Pages: Read and write**.

Wait **1–3 minutes** after success, then open the live URL again.

This project is **static files only** (no GitHub Actions required).

## Run locally

```bash
git clone git@github.com:mirithirsh-web/Murder-Mystery.git
cd Murder-Mystery
python3 server.py
```

Open **http://localhost:8081** (or `python3 -m http.server 8080`).

Do not rely on opening `index.html` via `file://` — the game loads JSON with `fetch`, which needs a real HTTP URL.

## License

Add your license here if you publish publicly.
