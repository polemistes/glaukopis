# Dictionaries

The dictionaries that spelling is checked with, in the form of Hunspell: for
each language a file of rules, `.aff`, and a list of words, `.dic`. They are
taken from LibreOffice's repository of dictionaries,
<https://github.com/LibreOffice/dictionaries>, and are not part of the code
of Glaukopis: each has its own licence, which is said below and whose text
is beside it.

| Files | Language | From |
| --- | --- | --- |
| `en_US.aff`, `en_US.dic` | English (United States) | `en/`, version 2020.12.07 of the list, from SCOWL |
| `en_GB.aff`, `en_GB.dic` | English (Great Britain) | `en/`, the list of 2025 |
| `nb_NO.aff`, `nb_NO.dic` | Norwegian Bokmål | `no/`, version 3.0 (2026) |
| `nn_NO.aff`, `nn_NO.dic` | Norwegian Nynorsk | `no/`, version 3.0 (2026) |
| `extra/nb_NO.dic`, `extra/nn_NO.dic` | Norwegian Bokmål and Nynorsk | `no/`, version 2.2 (2018) |

Fetched 2026-09-28. `scripts/update-dictionaries.sh` fetches them anew.

## Why there are two lists of Norwegian words

Version 3.0 of the Norwegian dictionaries has lists of every form of every
word, taken from Norsk Ordbank, with the words of the revision of
Bokmålsordboka and Nynorskordboka (2018–2024). But its words carry none of
the marks by which the rules of the `.aff` file make more words of them, so
that none are made: not the genitive (*verdens*, *forfatterens*), and not
the words that Norwegian makes by putting words together
(*kaffemaskinreparatør*), which would all be called wrong. Version 2.2 has
those marks, and its rules are those of version 3.0, which differs from it
only in being written in UTF-8.

So a list in `extra/` is read together with the list of the same name, by
its rules: a word is right if either list has it or the rules make it of
the words of either. The lists of version 2.2 are here as they were in
LibreOffice's repository, made UTF-8 from ISO 8859-1 as the rest are. (Any
dictionary may have more words in a list of its name in `extra/` beside it,
written as its own list is.)

## Licences, and what they ask

**Norwegian, version 3.0** (`nb_NO.*`, `nn_NO.*`; see `README_NO.txt`):

- The words are from **Norsk Ordbank**, of the National Library of Norway
  (Nasjonalbiblioteket, Språkbanken), under
  [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
  (CC BY 4.0), which asks that Nasjonalbiblioteket is named as the source.
- The new words are from the lists made after the revision of
  Bokmålsordboka and Nynorskordboka (2018–2024), handed out by CLARINO
  Bergen (<http://hdl.handle.net/11509/152>, <http://hdl.handle.net/11509/151>),
  under the licence
  [CLARIN PUB +BY](https://www.kielipankki.fi/wp-content/uploads/CLARIN_PUB_BY_en.html),
  which asks that they are named as the source; with thanks to
  Kultur- og likestillingsdepartementet. Some words of the year are from
  Språkrådet.
- The rules (`.aff`) are from the **spell-norwegian** project, under the GNU
  General Public License, version 2 (`COPYING`).
- The lists were put together by Lars Bungum.

**Norwegian, version 2.2** (`extra/`): from the spell-norwegian project
(no.speling.org), under the GNU General Public License, version 2
(`COPYING`).

**American English** (`en_US.*`; see `README_en_US.txt`): the words are from
**SCOWL**, copyright 2000–2018 Kevin Atkinson and others, under a licence
that lets them be used, changed and passed on for any purpose, as long as
the copyright and the licence stand with them; the rules are made from those
of Ispell by Geoff Kuenning, under the licence of Ispell. Both are written
out in `README_en_US.txt`, which goes with the dictionary for that reason.

**British English** (`en_GB.*`; see `README_en_GB.txt`): the words were first
a part of Kevin Atkinson's list, and have been worked on by David Bartlett,
Brian Kelk, Andrew Brown and Marco A. G. Pinto; they and the rules, by David
Bartlett and Andrew Brown, are under the GNU Lesser General Public License
(the LGPL). Its text, version 2.1, is in `LGPL-2.1.txt`.

`license.txt` is the GNU General Public License, version 2, as it stands in
LibreOffice's English folder.

What the GNU licences ask of those who pass the dictionaries on is that
their text goes with them, which it does here, and that they can be had in
the form they are worked on in, which is the form they are in here.

## Where else dictionaries are found

Beside these, the application uses the dictionaries of the system
(`/usr/share/hunspell` and its like) for other languages, and those the
writer puts in the folder `dictionaries` of the data directory, which come
before both. See the guide, and `crates/core/src/spelling/`.
