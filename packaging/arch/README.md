# The packages for Arch Linux

`makepkg` in this directory builds two packages from the tree it is in:

- `glaukopis`, the application;
- `glaukopis-server`, the collaboration server, which is needed only on the
  computer that is to be the server.

The dictionaries of spelling and the data of Tesseract's languages are not
packaged: they are imported in the application, under *Settings*, from the
project's server or from files (ADR 0032), and the system's Hunspell
dictionaries (`hunspell-en_us`, `hunspell-en_gb` and the others) and
Tesseract's data (`tesseract-data-*`) serve as well.

```
cd packaging/arch
makepkg -s
sudo pacman -U glaukopis-0.1.0-17-x86_64.pkg.tar.zst
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

`release/PKGBUILD` builds the packages of a release from its archive on
GitHub instead of from the tree, as that release had them (0.1.0 still with
the packages of dictionaries): it names the release's tag and
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
