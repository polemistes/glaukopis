# 0032 — Languages of spelling and of OCR that are imported

Date: 2026-10-06. Status: accepted. Changes, of ADR 0018, where the data of
Tesseract's languages comes from, and of ADR 0019, which dictionaries come
with the application.

## Context

The dictionaries of spelling came with the application on Windows and macOS
(English and Norwegian), and as packages of the project's own on Arch; the
installers for Windows and macOS brought the data of eleven languages for
Tesseract. Any other language could be had only on Linux, from the system's
packages, or by putting files into the folders of the application, which an
update undoes and which asks for the rights of an administrator.

The one the application is made for asked for a system of importing
languages instead of bundling them or packaging them: imported from the
official archives of Hunspell's dictionaries and Tesseract's data, or from
a server of the project's own, where their content and stability are the
project's to control; on Linux the system's languages serving as well, and
the imported coming before them. And for single languages to be importable
from files, with instructions for how such a file is made.

## Decision

- **A language comes as a package**: a zip of a `manifest.json`, which says
  its kind (`spelling` or `ocr`), its language, the name of its files, its
  title, version, licence and source, and the files themselves: the `.aff`
  and `.dic` of a dictionary of Hunspell's, or the `.traineddata` of a
  language for Tesseract; and the licences that go with them.
  `docs/language-packages.md` says how one is made.
- **Packages are offered by a server**, by default
  `https://robertemilberge.no/glaukopis/`, which can be changed in the
  settings (`languagesServer`) to another, or to a folder on the computer.
  The server's `index.json` lists the packages with their size and SHA-256,
  which what is fetched must match; nothing else is imported from it.
- **Files are imported as well**: a package; a dictionary extension of
  LibreOffice or Firefox, or any zip of dictionaries, each pair of `.aff` and
  `.dic` in it a language of its own; the `.aff` and `.dic` of a dictionary
  chosen together; a `.traineddata`. Only the names of the files in a zip
  are used, never its folders.
- **What is imported is kept in the data directory**, under `languages/`:
  `spelling/` and `ocr/` hold the files of each language and its manifest,
  `licences/` what goes with them.
- **Spelling looks in `languages/spelling`** after the writer's own folder
  of dictionaries and before those of the application and of the system.
- **Tesseract reads from one folder**, so where any language is imported it
  is given `languages/tessdata`, which holds the languages imported and,
  linked, everything of the folder it reads from by itself (its languages,
  its configurations, its font): links on Linux and macOS, hard links or
  copies on Windows. Where none is imported, it is left as it was, and the
  folder made for it before is taken away.
- **The project's packages** are made by `scripts/make-language-packages.py`,
  with their index, for English (American and British), Norwegian (Bokmål
  and Nynorsk, the project's own dictionaries), Swedish, Danish, German,
  French and Italian, from LibreOffice's dictionaries, and for OCR the same
  and Ancient Greek and Latin, from `tessdata_best`.
  The script mends what Hunspell lets pass and Spellbook does not (an
  unescaped slash in a word of the Danish).
- **Nothing is bundled any longer but the engine**: the dictionaries leave
  the resources of the application, and the packages of dictionaries for
  Arch are given up; the installers for Windows and macOS bring Tesseract
  with the data it has of its own (English), and no more. The deb and the
  rpm recommend the system's dictionaries of English.

## Why not otherwise

- *Signing the index*: the address can be changed, to a server or a folder
  of one's own, which a key held by the project would refuse; HTTPS and the
  checksums of the index keep what is fetched to what the index says. A
  signature may be added for the project's own server later.
- *Fetching from the official archives directly*: their addresses and forms
  are theirs to change, and a broken upstream would break the application;
  the index holds what has been tried.
- *Leaving Tesseract its own folder and naming the imported languages by
  path*: Tesseract takes languages by name, within one folder.

## Consequences

- A fresh installation on Windows or macOS checks no spelling until a
  dictionary is imported; F7 and the settings say where to import one.
- The server must be kept: `packaging/languages/README.md` says how the
  packages are made and put there.
- The tests of spelling use the dictionaries kept in
  `packaging/languages/dictionaries`.
