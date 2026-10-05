# The packages for Arch Linux

`makepkg` in this directory builds five packages from the tree it is in:

- `glaukopis`, the application;
- `glaukopis-server`, the collaboration server, which is needed only on the
  computer that is to be the server;
- `glaukopis-dictionaries-en`, `glaukopis-dictionaries-nb` and
  `glaukopis-dictionaries-nn`, the dictionaries that spelling is checked
  with, in English (American and British), Norwegian Bokmål and Norwegian
  Nynorsk. Each is optional: install those of the languages you write in.
  Glaukopis finds the dictionaries of Hunspell as well (`hunspell-en_us`,
  `hunspell-en_gb`; `hunspell-nb` and `hunspell-nn` are in the AUR), so
  those will do instead, and they serve for the other languages.

```
cd packaging/arch
makepkg -s
sudo pacman -U glaukopis-0.1.0-16-x86_64.pkg.tar.zst glaukopis-dictionaries-en-0.1.0-16-any.pkg.tar.zst
```

What the application needs on Arch comes from the repositories rather than
with it: Pandoc (`pandoc-cli`) and Libertinus (`otf-libertinus`), the serif
Typst sets with when a format asks for nothing else, and the font it sets
mathematics in here, are dependencies; the rest is
optional and said by `pacman -Qi glaukopis`. Tesseract, which reads text in
scans and pictures, is optional (`tesseract`, with `tesseract-data-eng` and
the data of the other languages); without it, Glaukopis reads no scans and
says so under *Settings*. The fonts that come with Typst are not compiled
into this build, as they are into the installers for Windows and macOS, since
here they are packages (`ttf-dejavu` for code, among the optional ones).
There is no package of New Computer Modern in the repositories; `otf-latin-modern`
stands in for it.

## The PKGBUILD of a release

`release/PKGBUILD` builds the same five packages from the archive of a
release on GitHub instead of from the tree: it names the release's tag and
the checksum of its archive. It is the PKGBUILD to publish, with a release or
in the AUR; `makepkg -s` in `release/` builds it as any PKGBUILD. When a
release is made, set `pkgver`, put back `pkgrel` to 1 or carry it on, and
put in the checksum of the new archive, `sha256sum` of what
`https://github.com/polemistes/glaukopis/archive/refs/tags/vX.Y.Z.tar.gz`
gives.

The building is done in `src/` and the packages are put together in `pkg/`,
both in this directory. Nothing is built in the tree itself. The first
building takes some minutes, and some gigabytes of disk while it lasts.

If `BUILDDIR` is set in your `makepkg.conf` to a directory that is kept in
memory, such as `/tmp`, set it to a place on disk for this package:

```
BUILDDIR="$PWD/build" makepkg -s
```
