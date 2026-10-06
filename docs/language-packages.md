# Language packages

Glaukopis checks spelling with dictionaries of Hunspell's, and reads text in
scans and pictures with Tesseract. The languages of both are imported, under
*Settings* › *Spelling* and *Settings* › *Programs* › *Tesseract*: from a
server, by default `https://robertemilberge.no/glaukopis/`, or from files.
This page says how a package is made, for a language the server does not
offer, or for a server of one's own. ADR 0032 says why it is done so.

## A package

A package is a zip file that holds a `manifest.json` and the files of one
language. Folders within the zip are of no account: only the names of the
files count.

For spelling: the `.aff` and the `.dic` file of a dictionary of Hunspell's,
of any name.

```text
spelling-nb_NO.zip
  manifest.json
  nb_NO.aff
  nb_NO.dic
  README_NO.txt
  COPYING
```

For OCR: the `.traineddata` file of a language for Tesseract 4 or 5, from
`tessdata_best`, `tessdata` or `tessdata_fast`, or one trained by oneself.

```text
ocr-grc.zip
  manifest.json
  grc.traineddata
  LICENSE
```

Files whose names have *licence*, *license*, *copying*, *readme*,
*authors*, *notice* or *copyright* in them go along with the language and
are kept beside it in the data directory, under `languages/licences/`.
Whatever else the zip holds is left out.

## The manifest

```json
{
  "format": 1,
  "kind": "spelling",
  "language": "nb-NO",
  "name": "nb_NO",
  "title": "Norsk bokmål",
  "version": "2026.10.06",
  "licence": "CC-BY-4.0 AND GPL-2.0-only",
  "source": "Bokmålsordboka, Universitetet i Bergen og Språkrådet"
}
```

| Field | | What it is |
| --- | --- | --- |
| `format` | | 1 |
| `kind` | needed | `spelling` or `ocr` |
| `language` | needed | the language, as a tag of BCP 47: `nb-NO`, `en-GB`, `de`, `grc`, `sr-Latn` |
| `name` | | the name the files are given when imported: for spelling the name of a dictionary, `nb_NO`, `de_DE`, `fr`, which must begin with the language; for OCR Tesseract's name of the language, `nor`, `grc`, `chi_sim`. Without it, spelling takes the language with `_` for `-`, and OCR the name of the `.traineddata` file |
| `title` | | what the package is called, in its own language |
| `version` | | a version of one's own choosing; a language whose version differs from the one the server offers can be updated |
| `licence` | | the licences of the files, as SPDX names them where they can be |
| `source` | | where the files were taken from |

A name is of letters, digits, `_` and `-`. A language imported under the
same name as one imported before takes its place.

## Files without a manifest

Glaukopis also takes, under *Import from files…*:

- a dictionary extension of LibreOffice (`.oxt`) or of Firefox (`.xpi`), or
  any zip of dictionaries: every `.aff` and `.dic` of the same name in it is
  a language of its own, named by its files (`en_US`, `en_GB`), and the
  files of hyphenation and of thesauri are left out;
- the `.aff` and the `.dic` file of a dictionary, chosen together;
- a `.traineddata` file.

## A server

A server is a folder on the web, or on the computer, that holds the
packages and an `index.json` that lists them:

```json
{
  "format": 1,
  "packages": [
    {
      "kind": "spelling",
      "name": "nb_NO",
      "language": "nb-NO",
      "title": "Norsk bokmål",
      "version": "2026.10.06",
      "file": "spelling-nb_NO-2026.10.06.zip",
      "size": 1258291,
      "sha256": "…",
      "licence": "CC-BY-4.0 AND GPL-2.0-only",
      "source": "…"
    }
  ]
}
```

`file` is the package, relative to the server; `size` its size in bytes,
and `sha256` its SHA-256, in hexadecimal. A package that is not of the size
and the SHA-256 the index says is not imported. The index's `kind`,
`name`, `language` and `version` are those the language is imported with.

The server is changed under *Change*, beside its address in either panel:
an address beginning with `https://` or `http://`, or the path of a folder,
which serves where there is no network, or for packages of one's own.

`scripts/make-language-packages.py` makes the project's packages and their
index; see `packaging/languages/README.md`.
