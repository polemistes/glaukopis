## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utsjånad
look-between = Mellom sidene og utsjånaden til dokumentet
look-whole = Det som gir utsjånaden

look-scope = Desse endringane gjeld for
# The whole document, by the name of its element.
look-scope-document = Heile dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Berre { $name }

# Under a setting the document sets otherwise than its type.
look-changed-here = Endra i dette dokumentet
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Endra i «{ $name }»
# Takes a change away.
look-reset = Tilbakestill

look-search = Finn ei innstilling: skrift, margar, sidetal …
look-search-nothing = Inga innstilling har desse orda.
look-sections = Delane av utsjånaden

look-section-page = Side
look-section-type = Skrift
look-section-paragraphs = Avsnitt
look-section-headings = Overskrifter
look-section-notes = Notar og kjeldetilvisingar
look-section-figures = Figurar og tabellar
look-section-front = Framsida

look-kinds-in-use = I dette dokumentet
look-heading-levels = Overskriftsnivå
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Skriftstorleik
look-first-page-size = Sidestorleik
look-first-headings-numbered = Overskriftene er nummererte
look-at-citations = Kjeldetilvisingar
look-at-bibliography = Litteraturliste


## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-parts-add = Legg til
# Under the parts the type suggests: a menu of the other kinds there are.
look-parts-another = Ein annan del …
# Beside a part, while a document type of the writer's own is edited: takes it out of the parts the type suggests.
look-parts-take-out = Ta ut av «{ $name }»
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Berre det første blir brukt
look-contents-limit-words = Ord i teksten, høgst
look-contents-limit-abstract-words = Ord i samandraget, høgst
look-contents-limit-keywords = Nøkkelord, høgst
# What the limits count, as what the document is says it.
look-contents-requirements-note = Kva grensene tel: { $note }

# The look or the reference style a document has where its type brings none: the one from the settings, by its name.
look-your-default = { $name }, standarden din
# The first choice of a look or a reference style: what the document type brings, by its name, and the type by its name.
look-from-type = { $name }, frå { $type }
# The first choice where an element over this one has chosen: what it chose, and the element.
look-from-with = { $what }, frå { $name }
look-style = Referansestil
look-style-change = Endre denne referansestilen …


# The groups of the fonts to choose from.
look-fonts-document = I dette dokumentet
look-fonts-project = Andre stader i prosjektet
look-fonts-all = Alle skrifter

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Dokumenttype …
look-hide = Skjul utsjånaden

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Linjenummer
look-section-type-parts = Delar
look-at-quotations-warning = Sitat
look-at-paragraph-kinds = Slag avsnitt
look-at-words-kinds = Slag ord
look-type-requirements = Krava til dokumenttypen

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tast
look-kind-key-none = Ingen
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, no { $kind }

## One form (the plan of 2026-11-22, stage 2): the top of Look says what the
## document sets otherwise than its type, and the last part is the document type.

# How many changes the document has over its type, at the top of Look.
look-changes-here = { $count ->
    [one] { $count } endring i dette dokumentet
   *[other] { $count } endringar i dette dokumentet
  }
# Puts what the document sets otherwise into its type, a type of the writer's own, by its name.
look-save-to = Lagre i «{ $name }»
# Makes a document type of the writer's own of the type in use and what the document sets otherwise.
look-save-as = Lagre som dokumenttype …
look-save = Lagre
look-type-name = Namnet på dokumenttypen
# While a type of the writer's own is edited in Look: every change goes into it.
look-editing = Redigerer dokumenttypen «{ $name }»
look-done = Ferdig
look-section-document-type = Dokumenttype
# Where the look of the document is taken from: the type, the writer's default, or another document type's look.
look-taken-from = Utsjånad henta frå
# Over the list of what the document sets otherwise than its type.
look-changed-list = Endra i dette dokumentet

# What a document type of the writer's own is beside its look and its parts, under Document type in Look.
look-type-field-name = Namn
look-type-description = Skildring
look-type-passage-kinds = Slag avsnitt og ord som blir viste først
look-type-exported-as = Eksportert som
look-type-delete = Slett denne dokumenttypen …
