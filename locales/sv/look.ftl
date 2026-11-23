## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utseende
look-between = Mellan sidorna och dokumentets utseende
look-whole = Det som avgör utseendet

look-scope = De här ändringarna gäller för
# The whole document, by the name of its element.
look-scope-document = Hela dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Bara { $name }

# Under a setting the document sets otherwise than its type.
look-changed-here = Ändrat i det här dokumentet
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Ändrat i ”{ $name }”
# Takes a change away.
look-reset = Återställ

look-search = Hitta en inställning: typsnitt, marginaler, sidnummer…
look-search-nothing = Ingen inställning har de här orden.
look-sections = Utseendets delar

look-section-page = Sida
look-section-type = Typografi
look-section-paragraphs = Stycken
look-section-headings = Rubriker
look-section-notes = Noter och källhänvisningar
look-section-figures = Figurer och tabeller
look-section-front = Framsida

look-kinds-in-use = I det här dokumentet
look-heading-levels = Rubriknivåer
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Teckenstorlek
look-first-page-size = Sidstorlek
look-first-headings-numbered = Rubrikerna numreras
look-at-citations = Källhänvisningar
look-at-bibliography = Litteraturförteckning


## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-parts-add = Lägg till
# Under the parts the type suggests: a menu of the other kinds there are.
look-parts-another = En annan del…
# Beside a part, while a document type of the writer's own is edited: takes it out of the parts the type suggests.
look-parts-take-out = Ta bort ur ”{ $name }”
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Bara det första används
look-contents-limit-words = Ord i texten, högst
look-contents-limit-abstract-words = Ord i sammanfattningen, högst
look-contents-limit-keywords = Nyckelord, högst
# What the limits count, as what the document is says it.
look-contents-requirements-note = Vad gränserna räknar: { $note }

# The look or the reference style a document has where its type brings none: the one from the settings, by its name.
look-your-default = { $name }, ditt förval
# The first choice of a look or a reference style: what the document type brings, by its name, and the type by its name.
look-from-type = { $name }, från { $type }
# The first choice where an element over this one has chosen: what it chose, and the element.
look-from-with = { $what }, från { $name }
look-style = Referensstil
look-style-change = Ändra den här referensstilen…


# The groups of the fonts to choose from.
look-fonts-document = I det här dokumentet
look-fonts-project = På andra ställen i projektet
look-fonts-all = Alla typsnitt

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Dokumenttyp…
look-hide = Dölj utseendet

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Radnummer
look-section-type-parts = Delar
look-at-quotations-warning = Citat
look-at-paragraph-kinds = Slag av stycken
look-at-words-kinds = Slag av ord
look-type-requirements = Dokumenttypens krav

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tangent
look-kind-key-none = Ingen
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, nu { $kind }

## One form (the plan of 2026-11-22, stage 2): the top of Look says what the
## document sets otherwise than its type, and the last part is the document type.

# How many changes the document has over its type, at the top of Look.
look-changes-here = { $count ->
    [one] { $count } ändring i det här dokumentet
   *[other] { $count } ändringar i det här dokumentet
}
# Puts what the document sets otherwise into its type, a type of the writer's own, by its name.
look-save-to = Spara i ”{ $name }”
# Makes a document type of the writer's own of the type in use and what the document sets otherwise.
look-save-as = Spara som dokumenttyp…
look-save = Spara
look-type-name = Dokumenttypens namn
# While a type of the writer's own is edited in Look: every change goes into it.
look-editing = Redigerar dokumenttypen ”{ $name }”
look-done = Klar
look-section-document-type = Dokumenttyp
# Where the look of the document is taken from: the type, the writer's default, or another document type's look.
look-taken-from = Utseendet tas från
# Over the list of what the document sets otherwise than its type.
look-changed-list = Ändrat i det här dokumentet

# What a document type of the writer's own is beside its look and its parts, under Document type in Look.
look-type-field-name = Namn
look-type-description = Beskrivning
look-type-passage-kinds = Slag av stycken och av ord som erbjuds först
look-type-exported-as = Exporteras som
look-type-delete = Radera den här dokumenttypen…
