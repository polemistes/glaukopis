## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspetto
look-between = Tra il testo e l'aspetto del documento
look-whole = Ciò che determina l'aspetto

look-layout-hint = Come appare la pagina: pagina, caratteri, spaziatura, titoli, gli aspetti dei tipi
look-citations-hint = Come si scrivono le citazioni e la bibliografia

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

look-open-preview = Apri l'anteprima per vedere le modifiche mentre le fai.
look-open-preview-button = Apri l'anteprima
look-search = Trova un'impostazione: font, margini, numeri di pagina…
look-search-nothing = Nessuna impostazione ha queste parole.
look-sections = Parti dell'aspetto

look-section-type = Caratteri
look-section-page = Pagina
look-section-paragraphs = Paragrafi
look-section-headings = Titoli
look-section-numbers = Numeri
look-section-notes = Note
look-section-figures = Figure e tabelle

look-kinds-in-use = In questo documento
look-heading-levels = Livelli dei titoli
look-quotations-hint = Le citazioni staccate dal testo per la loro lunghezza, dovunque non siano segnate esse stesse come citazioni. Il tipo Citazione si imposta nella parte dei tipi.

look-keep = Tieni queste modifiche come un'impaginazione mia…
look-keep-save = Tieni
# Where the layout is one of the writer's own.
look-put-into = Metti queste modifiche in «{ $name }»
look-delete-layout = Elimina questa mia impaginazione…
look-bundled = Le impaginazioni che vengono con Glaukopis restano come sono. Ciò che cambi qui è tenuto con il documento, o, se scegli, come un'impaginazione tua.

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Il tuo solito ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Come vuole il modello ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Da { $name } ({ $what })
look-layout = Impaginazione
look-style = Stile di citazione
look-style-change = Modifica questo stile di citazione…
