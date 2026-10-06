# Language packages

The languages of spelling and of OCR that Glaukopis imports (ADR 0032;
`docs/language-packages.md` says what a package is).

- `dictionaries/` holds the dictionaries made here, of Norwegian Bokmål and
  Nynorsk, from the word lists of Bokmålsordboka and Nynorskordboka, and
  copies of LibreOffice's English, which the tests of spelling check with.
  `scripts/update-norwegian-dictionaries.sh` makes them anew; see
  `dictionaries/README.md`.
- `out/`, which is not kept in git, is where the packages are made.

## Making the packages and putting them on the server

```
scripts/make-language-packages.py
```

fetches LibreOffice's dictionaries and Tesseract's `tessdata_best` into
`packaging/build/languages` (again with `--fetch`), and writes a package
for each language, and `index.json`, into `out/`. The version of the
dictionaries is the day they are made, unless `--version` says another;
the zips are made the same from the same files. Then everything in `out/`
is copied to the server, as it is:

```
rsync -av --delete packaging/languages/out/ <server>:<folder of https://robertemilberge.no/glaukopis/>
```

`index.json` should be served as `application/json`, and the folder over
HTTPS. `e2e/language-packages.mjs` tries the packages in the application,
with `out/` as the server.
