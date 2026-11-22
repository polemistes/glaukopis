## Utseendet til et dokument, på ett sted: kolonnen i ombrekkingspanelet
## der alt som avgjør hvordan sidene ser ut, stilles inn.

look-title = Utseende
look-between = Mellom sidene og utseendet til dokumentet
look-whole = Det som gir utseendet

look-scope = Disse endringene gjelder for
# Hele dokumentet, ved navnet på elementet.
look-scope-document = Hele dokumentet: { $name }
# Bare ett element under dokumentet, ved navnet.
look-scope-only = Bare { $name }

look-changed-here = Endret i dette dokumentet
look-changed-in = Endret i «{ $name }»
look-reset = Tilbakestill

look-search = Finn en innstilling: skrift, marger, sidetall …
look-search-nothing = Ingen innstilling har disse ordene.
look-sections = Delene av utseendet

look-section-page = Side
look-section-type = Skrift
look-section-paragraphs = Avsnitt
look-section-headings = Overskrifter
look-section-notes = Noter og kildehenvisninger
look-section-figures = Figurer og tabeller
look-section-front = Forsiden

look-kinds-in-use = I dette dokumentet
look-heading-levels = Overskriftsnivåer
look-first-type-size = Skriftstørrelse
look-first-page-size = Sidestørrelse
look-first-headings-numbered = Overskriftene er nummerert
look-at-citations = Kildehenvisninger
look-at-bibliography = Litteraturliste

## Dokumenttypens deler, en del av Utseende: delene programmet lager selv og
## slagene elementer som får en egen plass, i én liste i den rekkefølgen de
## skrives ut, og hva som kreves. Det som endres der, holdes som dokumentets
## egne endringer.

look-parts-add = Legg til
look-parts-another = En annen del …
look-contents-kinds-doubled = Bare det første brukes
look-contents-limit-words = Ord i teksten, høyst
look-contents-limit-abstract-words = Ord i sammendraget, høyst
look-contents-limit-keywords = Nøkkelord, høyst
look-contents-requirements-note = Hva grensene teller: { $note }

# Utseendet eller referansestilen et dokument har der typen ikke har noen: den fra innstillingene, med navn.
look-your-default = { $name }, din standard
# Det første valget av utseende eller stil: det dokumenttypen har med seg, og typen, med navn.
look-from-type = { $name }, fra { $type }
# Det første valget der et element over dette har valgt: det det valgte, og elementet.
look-from-with = { $what }, fra { $name }
look-style = Referansestil
look-style-change = Endre denne referansestilen …

# The groups of the fonts to choose from.
look-fonts-document = I dette dokumentet
look-fonts-project = Andre steder i prosjektet
look-fonts-all = Alle skrifter

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

look-document-type = Dokumenttype …
look-hide = Skjul utseendet

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Linjenummer
look-section-type-parts = Deler
look-at-quotations-warning = Sitater
look-at-paragraph-kinds = Avsnittstyper
look-at-words-kinds = Ordtyper
look-type-requirements = Dokumenttypens krav

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tast
look-kind-key-none = Ingen
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, nå { $kind }

## Ett skjema (planen fra 2026-11-22, trinn 2): øverst i Utseende står det dokumentet
## setter annerledes enn typen, og den siste delen er dokumenttypen.

look-changes-here = { $count ->
    [one] { $count } endring i dette dokumentet
   *[other] { $count } endringer i dette dokumentet
  }
look-save-to = Lagre i «{ $name }»
look-save-as = Lagre som dokumenttype …
look-save = Lagre
look-type-name = Navnet på dokumenttypen
look-editing = Redigerer dokumenttypen «{ $name }»
look-done = Ferdig
look-section-document-type = Dokumenttype
look-taken-from = Utseende hentet fra
look-changed-list = Endret i dette dokumentet

look-type-field-name = Navn
look-type-description = Beskrivelse
look-type-passage-kinds = Avsnitts- og ordslag som tilbys først
look-type-exported-as = Eksporteres som
look-type-delete = Slett denne dokumenttypen …
