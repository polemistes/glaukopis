# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = I tuoi
template-group-plain = Per cominciare
template-group-article = Articoli e saggi
template-group-book = Libri e tesi
template-group-fiction = Narrativa
template-group-stage = Teatro e cinema
template-group-poetry = Poesia
template-group-other = Altro
template-group-journal = Riviste
template-group-publisher = Editori
template-group-style-guide = Manuali di stile

## Where a kind of element stands in the document.


## The parts of a document the application makes itself.

template-generated-half-title = Occhietto
template-generated-title-page = Frontespizio
template-generated-keywords = Parole chiave
template-generated-contents = Indice
template-generated-list-of-figures = Indice delle figure
template-generated-list-of-tables = Indice delle tabelle
template-generated-body = Il testo
template-generated-notes = Note
template-generated-bibliography = Bibliografia

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, composto da LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Pagina web
template-target-epub = E-book

## The template editor.

template-editor = Modello
template-name = Nome del modello
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, modificato
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, mio
template-sections = Parti del modello
template-delete = Elimina questo modello
template-save-own = Salva come mio
template-saved = «{ $name }» è salvato tra i tuoi modelli
template-read-failed = Il modello non si è potuto leggere.
template-save-failed = Il modello non si è potuto salvare.
template-delete-failed = Il modello non si è potuto eliminare.
template-keep-failed = Il modello non si è potuto tenere nel progetto. Su un altro computer, e in un file del progetto, il documento avrà invece il modello solito.
template-delete-title = Eliminare il modello «{ $name }»?
template-delete-message = Gli elementi che lo usano useranno invece il modello da cui è stato fatto.
template-delete-confirm = Elimina il modello
template-leave-title = Uscire senza salvare?
template-leave-message = Le modifiche che hai fatto al modello andranno perdute.
template-leave-confirm = Esci
template-leave-cancel = Continua a modificare

## The parts of the editor, as they are chosen at the left.

template-section-about = Su questo modello
template-section-looks = Impaginazione e stile di citazione
template-section-contents = Contenuto
template-section-kinds = Tipi di elementi
template-section-passage-kinds = Tipi di paragrafo e di parole
template-section-requirements = Requisiti
template-section-outputs = File

## About the template.

template-description = Descrizione
template-group = Gruppo
template-based-on = Basato su
template-based-on-none = Nulla in particolare

## The layout and the reference style it brings.

template-layout = Impaginazione
template-style = Stile di citazione
# The layout or style the writer has chosen in the settings.
template-usual = Il tuo solito, dalle impostazioni

## The contents: the order of the document.

# An item of the contents that places every element of a kind.
template-contents-kind = Ogni { $name }
template-contents-add-part = Una parte…
template-contents-add-kind = Un tipo di elemento…
template-contents-up = Su
template-contents-down = Giù

## The kinds in hand.

template-kinds-in-contents = Nel contenuto

## The requirements.

template-requirement-words = Parole del testo
template-requirement-abstract-words = Parole dell'abstract
template-requirement-keywords = Parole chiave
template-requirement-note = Che cosa contano i limiti
# Beside a number of 0, in the place of its unit.
template-no-limit = nessun limite

## The files the template makes.

template-output-document = Il documento
template-output-cover = La copertina

## The names of the kinds of text that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Documento semplice
template-called-paper = Saggio
template-called-article = Articolo di rivista
template-called-report = Rapporto
template-called-book = Monografia
template-called-thesis = Tesi
template-called-novel = Romanzo
template-called-novel-manuscript = Manoscritto di romanzo
template-called-short-story = Racconto
template-called-story-collection = Raccolta di racconti
template-called-poems = Poesie
template-called-play = Opera teatrale
template-called-screenplay = Sceneggiatura
template-called-letter = Lettera
template-called-blog-post = Articolo di blog
template-called-news-article = Articolo di giornale

## Fewer words, stage 3: the requirement of anonymity, in Look and in the editor of a document type.

template-requirement-anonymity = Anonimo

## Stage 4 of the settings, the zoom and the keys of the kinds: the kinds Ctrl+Alt and a digit gives.
template-kind-keys = Tasti

template-described-plain = Testo generico.
