## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspetto
look-between = Tra le pagine e l'aspetto del documento
look-whole = Ciò che determina l'aspetto

look-scope = Queste modifiche valgono per
# The whole document, by the name of its element.
look-scope-document = Tutto il documento: { $name }
# Only one element under the document, by its name.
look-scope-only = Solo { $name }

# Under a setting the document sets otherwise than its type.
look-changed-here = Modificato in questo documento
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Modificato in «{ $name }»
# Takes a change away.
look-reset = Ripristina

look-search = Trova un'impostazione: font, margini, numeri di pagina…
look-search-nothing = Nessuna impostazione ha queste parole.
look-sections = Parti dell'aspetto

look-section-page = Pagina
look-section-type = Caratteri
look-section-paragraphs = Paragrafi
look-section-headings = Titoli
look-section-notes = Note e citazioni
look-section-figures = Figure e tabelle
look-section-front = Prima pagina

look-kinds-in-use = In questo documento
look-heading-levels = Livelli dei titoli
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Dimensione dei caratteri
look-first-page-size = Dimensione della pagina
look-first-headings-numbered = I titoli sono numerati
look-at-citations = Citazioni
look-at-bibliography = Bibliografia

## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-parts-add = Aggiungi
# Under the parts the type suggests: a menu of the other kinds there are.
look-parts-another = Un'altra parte…
# Beside a part, while a document type of the writer's own is edited: takes it out of the parts the type suggests.
look-parts-take-out = Togli da «{ $name }»
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Si usa solo il primo
look-contents-limit-words = Parole del testo, al massimo
look-contents-limit-abstract-words = Parole dell'abstract, al massimo
look-contents-limit-keywords = Parole chiave, al massimo
# What the limits count, as what the document is says it.
look-contents-requirements-note = Che cosa contano i limiti: { $note }

# The look or the reference style a document has where its type brings none: the one from the settings, by its name.
look-your-default = { $name }, il tuo predefinito
# The first choice of a look or a reference style: what the document type brings, by its name, and the type by its name.
look-from-type = { $name }, da { $type }
# The first choice where an element over this one has chosen: what it chose, and the element.
look-from-with = { $what }, da { $name }
look-style = Stile di citazione
look-style-change = Modifica questo stile di citazione…

# The groups of the fonts to choose from.
look-fonts-document = In questo documento
look-fonts-project = Altrove in questo progetto
look-fonts-all = Tutti i font

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Tipo di documento…
look-hide = Nascondi l'aspetto

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Numeri di riga
look-section-type-parts = Parti
look-at-quotations-warning = Citazioni
look-at-paragraph-kinds = Tipi di paragrafo
look-at-words-kinds = Tipi di parole
look-type-requirements = Requisiti del tipo di documento

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tasto
look-kind-key-none = Nessuno
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, ora per { $kind }

## One form (the plan of 2026-11-22, stage 2): the top of Look says what the
## document sets otherwise than its type, and the last part is the document type.

# How many changes the document has over its type, at the top of Look.
look-changes-here = { $count ->
    [one] { $count } modifica in questo documento
    [many] { $count } modifiche in questo documento
   *[other] { $count } modifiche in questo documento
}
# Puts what the document sets otherwise into its type, a type of the writer's own, by its name.
look-save-to = Salva in «{ $name }»
# Makes a document type of the writer's own of the type in use and what the document sets otherwise.
look-save-as = Salva come tipo di documento…
look-save = Salva
look-type-name = Nome del tipo di documento
# While a type of the writer's own is edited in Look: every change goes into it.
look-editing = Modifica del tipo di documento «{ $name }»
look-done = Fatto
look-section-document-type = Tipo di documento
# Where the look of the document is taken from: the type, the writer's default, or another document type's look.
look-taken-from = Aspetto preso da
# Over the list of what the document sets otherwise than its type.
look-changed-list = Modificato in questo documento

# What a document type of the writer's own is beside its look and its parts, under Document type in Look.
look-type-field-name = Nome
look-type-description = Descrizione
look-type-passage-kinds = Tipi di paragrafo e di parole offerti per primi
look-type-exported-as = Esportato come
look-type-delete = Elimina questo tipo di documento…
