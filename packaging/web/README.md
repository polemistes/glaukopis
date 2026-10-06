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

When the packages are built anew, change the names and sizes in the page and
make the checksums again, from `packaging/`:

```
(sha256sum arch/glaukopis-*-N-*.pkg.tar.zst installers/glaukopis-windows/msi/*.msi \
  installers/glaukopis-windows/nsis/*.exe installers/glaukopis-macos/dmg/*.dmg \
  installers/glaukopis-linux/deb/*.deb installers/glaukopis-linux/rpm/*.rpm \
  | sed 's#  .*/#  #') > web/packages/SHA256SUMS
```

The page stands on its own: one file, no scripts, its own styles, light and
dark with the system.
