# Progress: credits and licences (brief .claude/briefs/credits.md)

Branch fast-forwarded to main (796ee7a) first: the worktree had been made
from an older commit without crates/pdf-text.

## Done
- [x] 1. Gather and verify licences (notes below)
- [x] 2. src/lib/settings/credits.ts
- [x] 3. locales/en/credits.ftl, locales/nb/credits.ftl
- [x] 4. src/lib/settings/CreditsDialog.svelte
- [ ] 5. pnpm check, pnpm test, check-locales, pnpm format

## Notes

- Rust licences read from `cargo metadata --offline` (the registry's own
  Cargo.toml) and the LICENSE files beside them; npm from
  node_modules/<pkg>/package.json and LICENSE (pnpm install --offline done in
  the worktree).
- Svelte is a devDependency but its runtime is compiled into the interface:
  credited.
- Fonts: Inter, Literata, STIX Two Math (fontsource, OFL-1.1); Typst's
  embedded fonts from typst-assets 0.15.1 NOTICE: Libertinus Serif (OFL),
  New Computer Modern (GUST Font License; NewCM10-Regular GPL-3.0-or-later
  WITH Font-exception-2.0), DejaVu Sans Mono (Bitstream-Vera + Arev); Foxit
  PDF standard fonts (BSD-3-Clause, PDFium Authors) in every build via
  typst-svg and hayro.
- Copied code: crates/pdf-text (pdf-extract 0.12.1, MIT, Jeff Muizelaar),
  resources/typst/wrap-it.typ (wrap-it 0.1.1, Unlicense, Nathan Jessurun).
  Nothing else found.
- Data: CSL styles + locales (CC-BY-SA-3.0); Norwegian dictionaries
  (Bokmålsordboka/Nynorskordboka CC-BY-4.0, Norsk ordbank CC-BY-4.0,
  spell-norwegian GPL-2.0-only); server's LibreOffice dictionaries
  (licences from scripts/make-language-packages.py and their READMEs in
  packaging/build/languages); tessdata_best Apache-2.0 (its LICENSE).
- Programs: Pandoc GPL-2.0-or-later, Tesseract Apache-2.0 (pacman metadata).
- WebKitGTK: LGPL + BSD-2-Clause among others (Arch licence file).
- Opening a URL: openPath(url) from $lib/api/documents.
