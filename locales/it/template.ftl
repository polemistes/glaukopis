# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = I tuoi
template-group-plain = Semplici
template-group-article = Articoli e saggi
template-group-book = Libri e tesi
template-group-fiction = Narrativa
template-group-stage = Teatro e cinema
template-group-poetry = Poesia
template-group-other = Altri generi di testo
template-group-journal = Riviste
template-group-publisher = Editori
template-group-style-guide = Manuali di stile

## Where a kind of element stands in the document.

template-part-group-front = Parti iniziali
template-part-group-back = Parti finali
template-part-group-cover = Copertina

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
template-sections = Parti del modello
template-bundled = I modelli che vengono con Glaukopis restano come sono. Le tue modifiche si salvano come un modello tuo.
template-delete = Elimina questo modello
template-save-own = Salva come mio
template-saved = «{ $name }» è salvato tra i tuoi modelli
template-read-failed = Il modello non si è potuto leggere.
template-save-failed = Il modello non si è potuto salvare.
template-delete-failed = Il modello non si è potuto eliminare.
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
template-source-changed = Hai modificato questo modello; la fonte descrive ciò da cui è stato fatto.
template-source-none = Questo modello non segue i requisiti di nessun editore in particolare.

## The layout and the reference style it brings.

template-layout = Impaginazione
template-layout-hint = Come appare la pagina, per ogni documento di questo modello
template-style = Stile di citazione
template-style-hint = Come si scrivono le citazioni e la bibliografia; se vuoto, vale quello dell'impaginazione
# The layout or style the writer has chosen in the settings.
template-usual = Il tuo solito, dalle impostazioni

## The contents: the order of the document.

template-contents-hint = L'ordine del documento: le parti che l'applicazione fa da sé, e ogni elemento di un tipo, nell'ordine dell'albero. Un tipo elencato prima del testo è tra le parti iniziali, uno elencato dopo tra le parti finali.
# An item of the contents that places every element of a kind.
template-contents-kind = Ogni { $name }
template-contents-add-part = Una parte…
template-contents-add-kind = Un tipo di elemento…
template-contents-up = Su
template-contents-down = Giù

## The kinds in hand.

template-kinds-hint = I tipi di elementi che il modello mette a portata di mano: sono offerti nel menu dei tipi. Quelli del contenuto sono a portata di mano, scelti qui o no.
template-kinds-in-contents = Nel contenuto
template-passage-kinds-hint = I tipi di paragrafo e di parole che il modello mette a portata di mano: sono offerti per primi negli strumenti di scrittura.

## The requirements.

template-requirements-hint = Ciò che un documento di questo modello deve rispettare. La lista di controllo e l'anteprima contano rispetto a questi; nulla viene tagliato.
template-requirement-words = Parole del testo
template-requirement-abstract-words = Parole dell'abstract
template-requirement-keywords = Parole chiave
template-requirement-anonymous = Senza i nomi degli autori
template-requirement-anonymous-hint = Per la revisione: la lista di controllo lo dice, e un'impaginazione per la revisione li lascia fuori
template-requirement-note = Che cosa contano i limiti
template-requirement-note-placeholder = Note comprese; bibliografia no
# Beside a number of 0, in the place of its unit.
template-no-limit = nessun limite

## The files the template makes.

template-outputs-hint = I tipi di file in cui il documento è offerto quando si esporta.
template-output-document = Il documento
template-output-cover = La copertina
template-output-cover-note = Una copertina a sé la farà una versione futura; ciò che il modello ne dice è tenuto com'è.
