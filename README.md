# wonahran.com — static rebuild

Hand-written HTML and CSS. No framework, no build step, no dependencies.
Open `index.html` in a browser and it works.

## First run

```bash
bash fetch-images.sh
```

Downloads all 321 images from the Squarespace CDN into `assets/img/`, organised by project.
Takes a few minutes. Safe to re-run — it skips anything already downloaded.

You can skip this step if you like: every image also carries a fallback to the live
Squarespace URL, so the site displays correctly before the download finishes. But you
will want local copies before you cancel the Squarespace subscription.

## Structure

```
index.html          Home — thesis, discipline matrix, work grouped by client
about.html          Statement, experience, education, recognition
work/*.html         21 project pages
assets/style.css    All styling. Design tokens at the top under :root
assets/site.js      Scroll reveals and the matrix animation
assets/images.tsv   Image manifest used by fetch-images.sh
```

## Editing

**Text** — edit the HTML directly. Each project page has a `<h1 class="ptitle">`, a
`<p class="lede">`, a `<dl class="titleblock">` for metadata, and `<div class="ptext">`
for body copy.

**Colours and type** — all in `:root` at the top of `assets/style.css`. Changing
`--print` changes every accent on the site.

**Adding a project** — copy any file in `work/`, replace the content, then add a card to
the relevant `<ul class="cards">` in `index.html` and a row to the matrix if it opens a
new discipline.

## Deploying

Any static host. Drag the folder onto **Netlify Drop** (netlify.com/drop) or **Cloudflare
Pages** and it is live in under a minute, free, on your own domain.

If you want the password gate back, both hosts support password protection on paid plans;
Cloudflare Access does it free for a small number of users.

## Notes

- Fonts load from Google Fonts. To self-host, download Bricolage Grotesque, Newsreader and
  DM Mono, drop the files in `assets/fonts/`, and replace the `<link>` tag with `@font-face`
  rules.
- Images are full-resolution originals and some are large. Once downloaded, running them
  through ImageOptim or `cwebp` will cut page weight substantially.
- `assets/img/` is not created until you run `fetch-images.sh`.
