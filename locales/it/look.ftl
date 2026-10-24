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
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Impaginazione: { $layout }

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } modifica
    [many] { $count } modifiche
   *[other] { $count } modifiche
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Modificato qui
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Modificato in «{ $name }»
look-take-again = riprendi quello di { $layout }

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

look-keep = Tieni queste modifiche come un'impaginazione mia…
look-keep-save = Tieni
# Where the layout is one of the writer's own.
look-put-into = Metti queste modifiche in «{ $name }»
look-delete-layout = Elimina questa mia impaginazione…

## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-contents-kinds-missing = Ancora nessuno
look-contents-kinds-make = Creane uno
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Si usa solo il primo
look-contents-limit-words = Parole del testo, al massimo
look-contents-limit-abstract-words = Parole dell'abstract, al massimo
look-contents-limit-keywords = Parole chiave, al massimo
# What the limits count, as what the document is says it.
look-contents-requirements-note = Che cosa contano i limiti: { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Il tuo solito ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Come vuole il modello ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Da { $name } ({ $what })
look-style = Stile di citazione
look-style-change = Modifica questo stile di citazione…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Un frontespizio

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
look-section-type-parts = Parti del tipo di documento
look-section-the-layout = Impaginazione
look-choose-layout = Scegli un'impaginazione
look-layout-modifications = Modifiche all'impaginazione
look-at-quotations-warning = Citazioni
look-at-paragraph-kinds = Tipi di paragrafo
look-at-words-kinds = Tipi di parole
look-type-requirements = Requisiti del tipo di documento

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tasto
look-kind-key-none = Nessuno
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, ora per { $kind }
