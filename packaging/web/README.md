# The page of packages

`packages/index.html` is the page that lists the packages put out for testing,
with what each file is, and `packages/SHA256SUMS` the checksums of those files.
Both go into the folder on the web server that holds the packages themselves;
the links in the page are the file names, so the page and the files must be in
the same folder.

When the packages are built anew, change the names and sizes in the page and
make the checksums again, from `packaging/`:

```
(sha256sum arch/*-N-*.pkg.tar.zst installers/glaukopis-windows/msi/*.msi \
  installers/glaukopis-windows/nsis/*.exe installers/glaukopis-macos/dmg/*.dmg \
  | sed 's#  .*/#  #') > web/packages/SHA256SUMS
```

The page stands on its own: one file, no scripts, its own styles, light and
dark with the system.
