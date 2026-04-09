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

If you see **404 — There isn’t a GitHub Pages site here**, Pages is not enabled yet or the branch/folder is wrong.

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
