## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspetto
look-whole = Ciò che determina l'aspetto

# Under the button at the top of Look that names what the document is.
look-what-hint = Ciò che stai scrivendo decide le parti, le pagine e le citazioni; ognuna si può cambiare qui sotto.
look-scope = Queste modifiche valgono per
# The whole document, by the name of its element.
look-scope-document = Tutto il documento: { $name }
# Only one element under the document, by its name.
look-scope-only = Solo { $name }
look-scope-hint = Le modifiche fatte qui valgono per { $name }, dovunque sia stampato. Le impostazioni della pagina lo fanno cominciare su una nuova pagina.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Impaginazione: { $layout }
look-layout-hint = Come appaiono le pagine: la pagina, i caratteri, la spaziatura, i titoli, gli aspetti dei tipi
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

look-search = Trova un'impostazione: font, margini, numeri di pagina…
look-search-nothing = Nessuna impostazione ha queste parole.
look-sections = Parti dell'aspetto

look-section-page = Pagina
look-section-type = Caratteri
look-section-paragraphs = Paragrafi
look-section-headings = Titoli
look-section-numbers = Numeri
look-section-notes = Note e citazioni
look-section-figures = Figure e tabelle
look-section-front = Prima pagina
look-section-contents = Che cosa contiene il documento
look-section-layout = L'impaginazione

look-kinds-in-use = In questo documento
look-heading-levels = Livelli dei titoli
look-quotations-hint = Le citazioni staccate dal testo per la loro lunghezza, dovunque non siano segnate esse stesse come citazioni. Il tipo Citazione si imposta più sotto, fra i tipi di paragrafo e di parole.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Dimensione dei caratteri
look-first-page-size = Dimensione della pagina
look-first-headings-numbered = I titoli sono numerati
# Headings within the parts of Look.
look-at-quotations = Citazioni lunghe
look-at-kinds = Tipi di paragrafo e di parole
look-at-citations = Citazioni
look-at-bibliography = Bibliografia
look-layout-changes = Ciò che questo documento cambia

look-keep = Tieni queste modifiche come un'impaginazione mia…
look-keep-save = Tieni
# Where the layout is one of the writer's own.
look-put-into = Metti queste modifiche in «{ $name }»
look-delete-layout = Elimina questa mia impaginazione…
look-bundled = Le impaginazioni che vengono con Glaukopis restano come sono. Ciò che cambi qui è tenuto con il documento, o, se scegli, come un'impaginazione tua.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Le parti del documento
look-contents-parts-hint = Come le ha «{ $template }». Una parte accesa o spenta qui cambia per questo documento e per quelli sotto, e in nessun altro luogo.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Sempre nel documento
look-contents-part-notes = Dovunque il testo abbia note
look-contents-part-bibliography = Dovunque il testo citi un'opera
look-contents-part-keywords = Stampate dove il documento ha parole chiave
look-contents-kinds = Elementi con un posto proprio
look-contents-kinds-hint = I tipi di elemento a cui «{ $template }» dà un posto, e gli elementi sotto questo che riempiono ciascuno. Ognuno è un elemento come gli altri: il suo testo si scrive nell'albero.
look-contents-kinds-none = «{ $template }» non dà un posto proprio a nessun tipo di elemento.
look-contents-kinds-missing = Ancora nessuno
look-contents-kinds-make = Creane uno
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Si usa solo il primo
look-contents-requirements = Che cosa si chiede
look-contents-requirements-hint = Come chiede «{ $template }», se non lo si cambia qui. La lista di controllo e l'anteprima contano rispetto a questi limiti; nulla viene tagliato.
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
look-layout = Impaginazione
look-style = Stile di citazione
look-style-change = Modifica questo stile di citazione…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Un frontespizio
look-front-title-page-hint = Se il documento ne ha uno; lo stesso interruttore che sotto Che cosa contiene il documento

# The groups of the fonts to choose from.
look-fonts-document = In questo documento
look-fonts-project = Altrove in questo progetto
look-fonts-all = Tutti i font
