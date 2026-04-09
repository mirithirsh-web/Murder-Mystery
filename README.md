# Murder Mystery Detective

Browser-based detective game (**Deadly Secrets** scenario). English UI.

## Play online (GitHub Pages)

Your site URL (after Pages is enabled):

**https://mirithirsh-web.github.io/Murder-Mystery/**

### If you see “404 / There isn’t a GitHub Pages site here”

GitHub does **not** turn Pages on automatically. Do this once:

1. Open the repo on GitHub: **Settings** (tab) → **Pages** (left sidebar).
2. Under **Build and deployment** → **Source**, choose **GitHub Actions** (recommended; this repo includes a workflow).
3. Push any commit to `main` (or open **Actions** → run **Deploy to GitHub Pages** manually). Wait until the workflow finishes (green check).
4. Refresh **Settings → Pages** — you should see **“Your site is live at …”**
5. Open the URL again (hard refresh: Cmd+Shift+R).

**Alternative (no Actions):** set **Source** to **Deploy from a branch**, branch **main**, folder **/ (root)**, Save, wait ~2 minutes.

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
