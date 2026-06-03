# Drift Atlas

**Powder Characterisation Atlas**

Visit the live website:

https://mostlynominal.github.io/drift-atlas/

Drift Atlas is a static, sample-first atlas for metallic powder characterisation.
It combines a sample atlas, powder passports, comparison views, method notes, and
a contributor upload guide.

Viewers do not install anything. They should visit the GitHub Pages website
above. They should not run npm, Python, Streamlit, DuckDB, a local server, or
open `index.html` directly.

## Product Model

The centre of Drift Atlas is the sample.

Current site structure:

- Landing page
- Sample Atlas
- Sample Detail / Powder Passport
- Compare Samples
- Methods / Knowledge Base
- Data Upload Guide
- About

The main journey is:

1. Open the website.
2. Browse powder sample cards.
3. Open a powder passport.
4. Review identity, alloy, supplier, batch, state, storage history, PSD, KF,
   GranuTap, SEM metadata, notes, and future module placeholders.
5. Compare two or more samples side by side.
6. Read method and contributor guidance.

## Static Data

The browser loads static JSON from:

```text
public/data/processed/
  samples.json
  measurements.json
  images.json
  methods.json
```

Repeats are stored as individual observations in `measurements.json`. The
browser calculates mean, sample SD, SEM, and n. The UI always displays n, and
error bars or SD interpretation only apply when n is greater than 1.

## Contributor Workflow

Contributors update data or code in GitHub:

1. Edit JSON files or add prepared template data.
2. Commit and push.
3. GitHub Pages rebuilds the static site.
4. Viewers see the update at https://mostlynominal.github.io/drift-atlas/

There is no backend and no server database.

## Local Development

Local setup is for contributors only:

```bash
npm install
npm run build
```

Optional checks:

```bash
npm run test
npm run typecheck
```

## GitHub Pages

This is a GitHub Pages project site. The Vite base path must remain:

```text
/drift-atlas/
```

`npm run build` must produce `dist/index.html`, and built asset paths should use
`/drift-atlas/`.

One-time GitHub setting:

- Settings -> Pages -> Build and deployment -> Source: GitHub Actions

## Roadmap

- MVP: sample atlas, powder passports, compare page, PSD, KF, GranuTap, SEM
  metadata, method notes, upload guide.
- Next: GranuDrum / GranuFlow traces.
- Future: ASEM / AZtecFeature morphology and chemistry, FT4, XRD, DSC/TGA,
  EBSD notes, correlations, and prediction once the atlas has enough samples.

## License

MIT. See [LICENSE](LICENSE).
