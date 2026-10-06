# Dictionaries

The dictionaries that the language packages of Norwegian are made of, and
copies of LibreOffice's English, which the tests of spelling check with
(ADR 0032; the packages themselves are made by
`scripts/make-language-packages.py`, see `../README.md`). They are in the
form of Hunspell: for each language a file of rules, `.aff`, and a list of
words, `.dic`. They are not part of the code of Glaukopis: each has its own
licence, which is said below and whose text is beside it. The English ones
are taken from LibreOffice's repository of dictionaries,
<https://github.com/LibreOffice/dictionaries>; the Norwegian ones are made
here, from the word lists of Bokmålsordboka and Nynorskordboka.

| Files | Language | From |
| --- | --- | --- |
| `en_US.aff`, `en_US.dic` | English (United States) | `en/`, version 2020.12.07 of the list, from SCOWL |
| `en_GB.aff`, `en_GB.dic` | English (Great Britain) | `en/`, the list of 2025 |
| `nb_NO.dic` | Norwegian Bokmål | the word list of Bokmålsordboka, <https://ord.uib.no/bm/fil/lemma_expanded.json> |
| `nn_NO.dic` | Norwegian Nynorsk | the word list of Nynorskordboka, <https://ord.uib.no/nn/fil/lemma_expanded.json> |
| `nb_NO.aff`, `nn_NO.aff` | Norwegian Bokmål and Nynorsk | `no/`, the rules of spell-norwegian, as LibreOffice has them in UTF-8 |

The English dictionaries and the Norwegian rules were fetched 2026-09-28,
the Norwegian word lists 2026-10-01. `scripts/update-norwegian-dictionaries.sh`
fetches them anew, and makes the Norwegian lists by
`scripts/make-norwegian-dictionaries.py`; see `README_NO.txt`.

## How the Norwegian lists are made

Bokmålsordboka and Nynorskordboka, the dictionaries of Norwegian as it is
written, are published by the University of Bergen and Språkrådet, and their
word lists are open: for each language, every headword with its word class
and every inflected form of every way it may be inflected
(<https://ord.uib.no/ord_1_Ordlister.html>). The script reads the list and
writes every form, once, as an entry of the `.dic` file: the lists are of
full forms, so that the rules of the `.aff` file have no inflecting to do.
What the rules do is let words be put together, and make the genitive; for
which every entry gets flags by its word class:

- a noun, in every form, gets `z` (COMPOUNDFLAG: it may begin, continue or
  end a compound, *kaffe·maskin·reparatør*, *hjemme·kontoret*) and `J` (the
  genitive *-s*, *verdens*, *forfatterens*); and its headword with an *s*
  on it is an entry with `z`, for the *s* that links the parts of a compound
  (*bærekrafts·mål*, *språkråds·direktør*), which stands on its own too, as
  the genitive it is;
- an adjective, in every form, gets `z` (*stor·bonde*, *is·kaldt*);
- a verb gets `z` on its infinitive and imperative, the forms that begin
  compounds (*skrive·bord*), and nothing on the others;
- a proper noun gets `J`;
- a prefix of compounds (`alpe-`, `anti-`), when it is long enough to be
  a part of one, is an entry without its hyphen, with `z`;
- adverbs, prepositions, determiners, pronouns, conjunctions,
  interjections, abbreviations and symbols get no flags.

Nothing shorter than four letters is a part of a compound (COMPOUNDMIN 4),
and a compound that would put three of the same letter together is wrong
(CHECKCOMPOUNDTRIPLE, in Bokmål). Forms with a space in them (expressions,
*17. mai*) are left out, since the words of a text are checked one at a
time. The affix files are those of spell-norwegian, as they stand; the
flags above are the ones they define.

## Licences, and what they ask

**Norwegian** (`nb_NO.*`, `nn_NO.*`; see `README_NO.txt`):

- The words are those of **Bokmålsordboka** and **Nynorskordboka**, of the
  University of Bergen and Språkrådet, under
  [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
  (CC BY 4.0), to be named thus:
  *Bokmålsordboka/Nynorskordboka, Universitetet i Bergen og Språkrådet,
  ordbøkene.no, CC-BY 4.0.* Their inflections come from **Norsk ordbank**,
  of the National Library of Norway (Nasjonalbiblioteket, Språkbanken),
  under CC BY 4.0 as well. What was found of the licence, and where, is
  written out in `README_NO.txt`; the page of the licence that the
  dictionaries' site links to could not be reached on the day the lists
  were fetched, and ord@uib.no is where to ask.
- The rules (`.aff`) are from the **spell-norwegian** project, under the GNU
  General Public License, version 2 (`COPYING`).

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
the form they are worked on in, which is the form they are in here. What
CC BY asks is that the source is named, with the licence and what was
changed: the guide names it under *Spelling*, and `README_NO.txt` says
what was done to the lists.

## Where else dictionaries are found

Beside these, the application uses the dictionaries of the system
(`/usr/share/hunspell` and its like) for other languages, and those the
writer puts in the folder `dictionaries` of the data directory, which come
before both. See the guide, and `crates/core/src/spelling/`.
