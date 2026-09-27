# The packages for Arch Linux

`makepkg` in this directory builds two packages from the tree it is in:

- `glaukopis`, the application;
- `glaukopis-server`, the collaboration server, which is needed only on the
  computer that is to be the server.

```
cd packaging/arch
makepkg -s
sudo pacman -U glaukopis-0.1.0-1-x86_64.pkg.tar.zst
```

The building is done in `src/` and the packages are put together in `pkg/`,
both in this directory. Nothing is built in the tree itself. The first
building takes some minutes, and some gigabytes of disk while it lasts.

If `BUILDDIR` is set in your `makepkg.conf` to a directory that is kept in
memory, such as `/tmp`, set it to a place on disk for this package:

```
BUILDDIR="$PWD/build" makepkg -s
```
