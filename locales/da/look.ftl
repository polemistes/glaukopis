## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Udseende
look-between = Mellem siderne og dokumentets udseende
look-whole = Det, der giver udseendet

look-scope = Disse ændringer gælder for
# The whole document, by the name of its element.
look-scope-document = Hele dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Kun { $name }

# Under a setting the document sets otherwise than its type.
look-changed-here = Ændret i dette dokument
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Ændret i »{ $name }«
# Takes a change away.
look-reset = Nulstil

look-search = Find en indstilling: skrift, margener, sidetal…
look-search-nothing = Ingen indstilling har disse ord.
look-sections = Udseendets dele

look-section-page = Side
look-section-type = Skrift
look-section-paragraphs = Afsnit
look-section-headings = Overskrifter
look-section-notes = Noter og kildehenvisninger
look-section-figures = Figurer og tabeller
look-section-front = Forside

look-kinds-in-use = I dette dokument
look-heading-levels = Overskriftsniveauer
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Skriftstørrelse
look-first-page-size = Sidestørrelse
look-first-headings-numbered = Overskrifterne nummereres
look-at-citations = Kildehenvisninger
look-at-bibliography = Litteraturliste


## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-parts-add = Tilføj
# Under the parts the type suggests: a menu of the other kinds there are.
look-parts-another = En anden del…
# Beside a part, while a document type of the writer's own is edited: takes it out of the parts the type suggests.
look-parts-take-out = Tag ud af »{ $name }«
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Kun det første bruges
look-contents-limit-words = Ord i teksten, højst
look-contents-limit-abstract-words = Ord i resuméet, højst
look-contents-limit-keywords = Nøgleord, højst
# What the limits count, as what the document is says it.
look-contents-requirements-note = Hvad grænserne tæller: { $note }

# The look or the reference style a document has where its type brings none: the one from the settings, by its name.
look-your-default = { $name }, din standard
# The first choice of a look or a reference style: what the document type brings, by its name, and the type by its name.
look-from-type = { $name }, fra { $type }
# The first choice where an element over this one has chosen: what it chose, and the element.
look-from-with = { $what }, fra { $name }
look-style = Referencestil
look-style-change = Ændr denne referencestil…


# The groups of the fonts to choose from.
look-fonts-document = I dette dokument
look-fonts-project = Andre steder i dette projekt
look-fonts-all = Alle skrifter

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Dokumenttype…
look-hide = Skjul udseendet

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Linjenumre
look-section-type-parts = Dele
look-at-quotations-warning = Citater
look-at-paragraph-kinds = Arter af afsnit
look-at-words-kinds = Arter af ord
look-type-requirements = Dokumenttypens krav

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tast
look-kind-key-none = Ingen
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, nu { $kind }

## One form (the plan of 2026-11-22, stage 2): the top of Look says what the
## document sets otherwise than its type, and the last part is the document type.

# How many changes the document has over its type, at the top of Look.
look-changes-here = { $count ->
    [one] { $count } ændring i dette dokument
   *[other] { $count } ændringer i dette dokument
  }
# Puts what the document sets otherwise into its type, a type of the writer's own, by its name.
look-save-to = Gem i »{ $name }«
# Makes a document type of the writer's own of the type in use and what the document sets otherwise.
look-save-as = Gem som dokumenttype…
look-save = Gem
look-type-name = Dokumenttypens navn
# While a type of the writer's own is edited in Look: every change goes into it.
look-editing = Redigerer dokumenttypen »{ $name }«
look-done = Færdig
look-section-document-type = Dokumenttype
# Where the look of the document is taken from: the type, the writer's default, or another document type's look.
look-taken-from = Udseende hentet fra
# Over the list of what the document sets otherwise than its type.
look-changed-list = Ændret i dette dokument

# What a document type of the writer's own is beside its look and its parts, under Document type in Look.
look-type-field-name = Navn
look-type-description = Beskrivelse
look-type-passage-kinds = Arter af afsnit og ord, der tilbydes først
look-type-exported-as = Eksporteres som
look-type-delete = Slet denne dokumenttype…
