Norwegian (Bokmål and Nynorsk) spelling dictionaries for Glaukopis
==================================================================

Made 2026-10-01, from the word lists fetched that day.
Made by: scripts/make-norwegian-dictionaries.py (in the tree of Glaukopis)

These are Hunspell dictionaries of full forms for Norwegian Bokmål
(nb_NO) and Norwegian Nynorsk (nn_NO). The word lists are made from the
official word lists of Bokmålsordboka and Nynorskordboka; the affix files
are those of the spell-norwegian project, recoded to UTF-8, as LibreOffice
has them.


Spell-check word lists
----------------------

nb_NO.dic  455277 entries  (Norwegian Bokmål)
nn_NO.dic  460564 entries  (Norwegian Nynorsk)

Encoding: UTF-8 (SET UTF-8 in the corresponding .aff files).

Sizes before, for comparison: LibreOffice's version 3.0 of the Norwegian
dictionaries had 708615 and 540664 entries, 9.3 MB and 6.5 MB, and
Glaukopis read the lists of version 2.2 beside them, 5.3 MB and 3.3 MB,
for their flags of compounding; these lists are 6.6 MB and 6.5 MB and
replace both.


Source
------

The University of Bergen publishes the word lists of the two dictionaries
at https://ord.uib.no/ord_1_Ordlister.html. The file used is, for each
language, lemma_expanded.json:

  https://ord.uib.no/bm/fil/lemma_expanded.json   (Bokmål, 16 MB)
  https://ord.uib.no/nn/fil/lemma_expanded.json   (Nynorsk, 15 MB)

with, for each headword, its article id, word class, sub class, paradigm
codes, and a list of inflected forms for each paradigm; and
inflection_tags.json, which says what each form is (the headword itself
is the first tagged form and is not repeated in the lists). The word
classes are those of Universal Dependencies (word_class.json,
sub_word_class.json). Bokmål has 107167 lemmas, Nynorsk 122656.


How the lists are made
----------------------

Every inflected form of every paradigm of every headword, and the headword
itself, is an entry, once; a form that several headwords or word classes
share has the union of their flags. Forms with a space in them
(expressions, "17. mai") and bare affixes ("-ere") are left out. A slash
in a word is written "\/". The entries are sorted, and the first line is
their number, as Hunspell wants.

The flags are those the affix files define: COMPOUNDFLAG z, with which a
word may begin, continue or end a compound, and SFX J, which adds the
genitive -s to a word not ending in s. COMPOUNDMIN is 4, and Bokmål has
CHECKCOMPOUNDTRIPLE. By word class:

  NOUN       every form: z J; and the headword + "s" as an entry with z,
             for the s that links the parts of a compound (bærekraftsmål,
             språkrådsdirektør). The affix files have no ONLYINCOMPOUND
             flag, so that entry also passes on its own, as the genitive
             that it is.
  PROPN      every form: J
  ADJ        every form: z (storbonde, iskaldt, steinrike)
  VERB       the infinitive and the imperative: z (skrivebord);
             the other forms: no flags
  PFX,       prefixes of compounds, written "alpe-", "anti-": without the
  COMPPFX    hyphen, with z, when at least four letters long
  the rest   no flags (adverbs, prepositions, determiners, pronouns,
             conjunctions, interjections, abbreviations, symbols)

With one flag for compounding, any form of a noun may begin a compound,
so a word such as "husenebil" passes, as it did with the earlier lists.
The linking -e of compounds (barnehage) has no rule: such compounds pass
where the dictionaries have them as words.


Licence and attribution
-----------------------

1. The word lists: Bokmålsordboka and Nynorskordboka

   Published by the University of Bergen (Universitetet i Bergen) and the
   Language Council of Norway (Språkrådet), at ordbøkene.no and
   ord.uib.no.

   Licence: Creative Commons Attribution 4.0 International (CC BY 4.0),
   https://creativecommons.org/licenses/by/4.0/

   Attribution, as the dictionaries ask for it:

     Bokmålsordboka/Nynorskordboka, Universitetet i Bergen og Språkrådet,
     ordbøkene.no, CC-BY 4.0.

   What was found, 2026-10-01:

   - https://ordbokene.no/nno/about/open-data says that the two
     dictionaries are open resources that may be used, shared and built
     on by anyone, for commercial purposes too; that they are published
     under CC BY 4.0, which holds for the content and for the data got
     through the API at ord.uib.no alike; and that the source is to be
     given in the product or service that presents the content, in the
     words above. It links the licence at
     https://creativecommons.org/licenses/by/4.0/deed.no.
   - https://ordbokene.no/nob/about/open-data (the Bokmål page) says that
     the content may be used for any purpose, commercial included, under
     the given terms, and links "the open licence" at
     https://w3.uib.no/nb/ub/spesialsamlingene/182212/lisens, which is
     reachable only within the university's network (HTTP 403); the
     address https://www.uib.no/ub/spesialsamlingene/182212/lisens that
     the site gave earlier redirects to the front page of the Special
     Collections. So the terms were read from the Nynorsk page, which is
     the same page in the other language. To ask: ord@uib.no.
   - https://ord.uib.no/ord_2_API.html, the page of the API, says nothing
     of the licence.

2. The inflections: Norsk ordbank

   The inflections in the word lists are those of Norsk ordbank, the
   lexical database of Bokmål and Nynorsk, which the National Library of
   Norway (Nasjonalbiblioteket, Språkbanken) publishes under CC BY 4.0,
   with Nasjonalbiblioteket as the holder of the rights:

     https://www.nb.no/sprakbanken/ressurskatalog/oai-nb-no-sbr-5/
       (Bokmål, hdl:21.11146/5, licence CC BY)
     https://www.nb.no/sprakbanken/ressurskatalog/oai-nb-no-sbr-41/
       (Nynorsk, hdl:21.11146/41, licence CC BY)

   Attribution: Norsk ordbank, Nasjonalbiblioteket (Språkbanken), CC BY 4.0.

3. The affix files

   nb_NO.aff and nn_NO.aff are from the spell-norwegian project, and are
   the ones LibreOffice's dictionaries (dictionaries/no in its repository,
   version 3.0) have, recoded from ISO 8859-1 to UTF-8 and not changed
   otherwise.

     Copyright: The spell-norwegian project
     Licence: GNU GPL version 2 (see COPYING)

The lists are not the dictionaries as published: they are the inflected
forms picked out of them, with flags added, as said above.


Attribution summary
-------------------

  Bokmålsordboka/Nynorskordboka, Universitetet i Bergen og Språkrådet,
      ordbøkene.no, CC-BY 4.0 — the words and their forms
  Norsk ordbank, Nasjonalbiblioteket (Språkbanken) — the inflections
      (CC BY 4.0)
  The spell-norwegian project — the affix files (GNU GPL v2)
