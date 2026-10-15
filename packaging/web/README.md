# The page of packages

`packages/index.html` is the page that lists the packages put out for testing,
with what each file is, and the language packages of spelling and of OCR;
`packages/SHA256SUMS` holds the checksums of the installers and packages. Both
go into the folder `glaukopis/` of robertemilberge.no, beside the installers,
the packages, and what `scripts/make-language-packages.py` makes
(`index.json` and the language packages; see `packaging/languages/README.md`).
The links in the page are the file names, so the page and the files must be in
the same folder. The page links back to the front page of the site, `/`.

When the language packages change, change their names and sizes in the page
as well, from `packaging/languages/out/index.json`.

When a release is made (as 0.2.0 was): the Arch packages are built from the
release's archive with `arch/release/PKGBUILD`; the installers, the deb and
the rpm are made on GitHub by the workflow `Installers` when the tag `vX.Y.Z`
is pushed, and fetched with `gh run download <run> -D build/run-<run>`. All
of them, the PKGBUILD, the page and the language packages
(`languages/out/*`) are gathered in one folder, `release-X.Y.Z/` (ignored by
git), and the checksums are made there:

```
cd release-X.Y.Z
sha256sum Glaukopis_*-setup.exe Glaukopis_*.msi Glaukopis_*.dmg glaukopis-*.pkg.tar.zst \
  PKGBUILD Glaukopis_*.deb Glaukopis-*.rpm > SHA256SUMS
```

Change the names and the sizes in the page, copy it and `SHA256SUMS` back
here, and upload the whole folder into `glaukopis/` of the site.

The page stands on its own: one file, no scripts, its own styles, light and
dark with the system.
