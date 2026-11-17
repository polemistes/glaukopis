# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Taccuino
notebook-notes = Note
notebook-note = Nota
notebook-search = Cerca nelle note
notebook-search-clear = Azzera la ricerca
notebook-new-note = Nuova nota
notebook-add-files = Aggiungi file…
notebook-add-files-title = Aggiungi file al taccuino
notebook-empty = Il taccuino è vuoto
    .text = Raccogli qui ciò che capita, fuori da tutti i progetti: parole, immagini e file, ciascuno una nota che ricorda da dove viene.
notebook-unreadable = Il taccuino non si è potuto leggere
notebook-nothing-found = Nessuna nota trovata
notebook-empty-note = Nota vuota
notebook-holds-picture = Un'immagine
notebook-holds-file = Un file
notebook-holds-passage = Parole prese da altrove
notebook-resize-list = Larghezza dell'elenco delle note
notebook-choose = Scegli una nota, o creane una nuova
notebook-selected = { $count ->
    [one] { $count } nota selezionata
    [many] { $count } note selezionate
   *[other] { $count } note selezionate
}
notebook-deleted = { $count ->
    [one] Nota eliminata
    [many] { $count } note eliminate
   *[other] { $count } note eliminate
}
notebook-redo = Ripeti
notebook-name = Nome
notebook-write = Scrivi, o incolla ciò che hai trovato
# What became of a note: "Used in ‹project› · quotation".
notebook-went = Che cosa ne è stato
notebook-used-in = Usata in
notebook-went-text = testo
notebook-went-quotation = citazione
notebook-went-figure = immagine
notebook-went-reference = riferimento
notebook-went-file = file
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Mostrata come
notebook-surface = Tavolo
notebook-list = Elenco
notebook-close-note = Chiudi la nota
notebook-resize-column = Larghezza delle scatole
notebook-resize-note = Larghezza della nota
notebook-box-empty = Nessuna nota in questa scatola
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Aggiunto al taccuino
notebook-arrived-from = Aggiunto al taccuino: { $title }
notebook-arrived-many = { $count ->
    [one] Una cosa aggiunta al taccuino
    [many] { $count } cose aggiunte al taccuino
   *[other] { $count } cose aggiunte al taccuino
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Da ordinare

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = Apri { $name }
notebook-file-not-here = Il file non è su questo computer

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Alcuni file non si sono potuti aggiungere

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Aggiunto al taccuino
notebook-from-file-not-added = Non si è potuto aggiungere al taccuino

## Sources

notebook-source-none = Nessuna fonte
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° E
notebook-source-west = { $degrees }° O

notebook-sources = Fonti
notebook-source = Fonte
notebook-source-sort = Che cos'è
notebook-source-web = Pagina web
notebook-source-reference = Riferimento
notebook-source-other = Altro
notebook-source-url = Indirizzo
notebook-source-page-title = Titolo
notebook-source-choose-reference = Scegli un riferimento…
notebook-source-place = Luogo
notebook-source-words = Da dove viene
notebook-source-file-name = Nome
notebook-source-file-changed = Ultima modifica
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = Scattata
notebook-source-file-where = Dove
notebook-source-make-reference = Crea un riferimento
notebook-source-in-library = Nella biblioteca:
notebook-source-passages = Passi presi da qui
notebook-source-changed = Cambiato da quando è stato preso. Diceva:
notebook-source-bring-back = Riporta indietro
notebook-source-own-words = Parole mie

## Boxes and tags

notebook-all-notes = Tutte le note
notebook-boxes = Scatole
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Da ordinare
notebook-box-new = Nuova scatola
notebook-box-name = Nome della scatola
notebook-box-receives = Le note dall'esterno arrivano qui
notebook-box-delete-title = Eliminare «{ $name }»?
notebook-box-delete-message = { $count ->
    [one] La nota che contiene va in «{ $first }».
    [many] Le { $count } note che contiene vanno in «{ $first }».
   *[other] Le { $count } note che contiene vanno in «{ $first }».
}
notebook-move-to = Sposta in
notebook-tags = Tag
notebook-tag-name = Nome del tag
notebook-tag-remove = Rimuovi da tutte le note
notebook-tag-remove-title = Rimuovere «{ $tag }» da tutte le note?
notebook-tag-remove-message = { $count ->
    [one] Una nota ce l'ha.
    [many] { $count } note ce l'hanno.
   *[other] { $count } note ce l'hanno.
}
notebook-tag-merge-title = Rinominare «{ $from }» in «{ $to }»?
notebook-tag-merge-message = «{ $from }» e «{ $to }» diventeranno un solo tag.
notebook-tags-off = Mostra tutte, qualunque siano i loro tag
# The field under the name of a note, where a tag is added.
notebook-tag-add = Aggiungi un tag
notebook-tag-take-away = Rimuovi «{ $tag }»
notebook-tags-offered = Tag
notebook-join = Unisci
notebook-joined = { $count ->
    [one] { $count } nota unita
    [many] { $count } note unite
   *[other] { $count } note unite
}
notebook-divide = Dividi

## The surface

notebook-surface-of-box = Tavolo della scatola
notebook-surface-not-placed = Non ancora collocate
notebook-surface-empty-note = Nota vuota
notebook-surface-new-note-here = Nuova nota qui
notebook-surface-show-all = Mostra tutto
notebook-surface-link-handle = Trascina su un'altra nota per collegarle

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filtra
notebook-filters-on = { $count ->
    [one] Filtri: { $count } attivo
    [many] Filtri: { $count } attivi
   *[other] Filtri: { $count } attivi
}
notebook-filter-holds = Contiene
notebook-filter-picture = Un'immagine
notebook-filter-file = Un file
notebook-filter-passage = Parole prese da altrove
notebook-filter-link = Un collegamento a un'altra nota
notebook-filter-collected = Raccolta
notebook-filter-from = Da
notebook-filter-to = A
notebook-filter-came = Da
notebook-filter-web = Una pagina web
notebook-filter-reference = Un riferimento
notebook-filter-file-source = Un file
notebook-filter-other = Altro
notebook-filter-no-source = Nessuna fonte
notebook-filter-unseen = Non ancora guardata
notebook-filter-use = Usata
notebook-filter-use-all = Tutte
notebook-filter-used = Usata in un progetto
notebook-filter-unused = Non usata
notebook-filter-clear = Azzera i filtri
notebook-nothing-passes = Nessuna nota in vista passa i filtri.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Non ancora guardata
# Words read in the images of notes, kept for finding.
notebook-read-text = Leggi il testo
notebook-read-again = Leggi di nuovo
notebook-text-read = Testo letto
notebook-reading = { $count ->
    [one] Lettura di { $name }…
    [many] Lettura di { $name } ({ $done } di { $count })…
   *[other] Lettura di { $name } ({ $done } di { $count })…
}
notebook-reading-stop = Ferma
notebook-read-done = { $count ->
    [one] Il testo dell'immagine è stato letto
    [many] Il testo di { $count } immagini è stato letto
   *[other] Il testo di { $count } immagini è stato letto
}
notebook-read-failed = Il testo di { $name } non si è potuto leggere
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = Nuova nota da un testo di partenza
notebook-starts = Testi di partenza…
notebook-starts-title = Testi di partenza
notebook-start-new = Nuovo
notebook-start-unnamed = Senza nome
notebook-start-name = Nome
notebook-start-lines = Righe
notebook-start-kind = Le sue righe sono
notebook-start-up = Sposta su
notebook-start-down = Sposta giù
notebook-start-none = Ancora nessun testo di partenza.
notebook-start-delete-title = Eliminare «{ $name }»?
notebook-start-delete-message = Le note cominciate da esso restano come sono.

## Notes from other programs

notebook-import = Importa note…
notebook-import-title = Importa note
notebook-import-folder = Una cartella…
notebook-import-file = Un file…
notebook-import-programs = Una cartella di Obsidian, Joplin, Notion, Bear, Google Keep o OneNote, o con Markdown e testo; un file di Evernote (.enex) o di OneNote (.one), o un solo file Markdown.
notebook-import-choose-folder = Scegli una cartella di note
notebook-import-choose-file = Scegli un file di note
notebook-import-filter = Note
notebook-import-kind = { $kind ->
    [obsidian] Note di Obsidian
    [joplin] Note di Joplin
    [notion] Note di Notion
    [bear] Note di Bear
    [evernote] Note di Evernote
    [keep] Note di Google Keep
    [onenote] Note di OneNote
   *[markdown] File Markdown e di testo
}
notebook-import-count = { $count ->
    [one] Una nota
    [many] { $count } note
   *[other] { $count } note
}
notebook-import-files = { $count ->
    [0] nessuna immagine né file
    [one] un'immagine o un file
    [many] { $count } immagini e file
   *[other] { $count } immagini e file
}
notebook-import-none = Qui non si sono trovate note.
notebook-import-to-know = Da sapere
notebook-import-unread = Questo non si è potuto leggere come note.
notebook-import-do = Importa
notebook-import-reading = Lettura { $done } di { $count }: { $name }
notebook-import-stop = Ferma
notebook-import-done = { $count ->
    [one] Una nota importata in «{ $box }»
    [many] { $count } note importate in «{ $box }»
   *[other] { $count } note importate in «{ $box }»
}
notebook-import-nothing = Non si è trovato nulla da importare
notebook-import-problems = { $count ->
    [one] Una cosa non si è potuta leggere: { $first }
    [many] { $count } cose non si sono potute leggere: { $first }
   *[other] { $count } cose non si sono potute leggere: { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Tra i lati e le note
notebook-pane-find = Trova una nota
notebook-pane-open = Apri il taccuino
notebook-pane-unread = Il taccuino non si è potuto leggere
notebook-pane-empty = Il taccuino è vuoto
notebook-pane-nothing-found = Nessuna nota contiene queste parole
notebook-pane-drag = Trascina una nota, o una parte di una, nel testo.
notebook-pane-show-all = Mostra tutto
notebook-pane-show-less = Mostra meno
notebook-pane-used = Usata in questo progetto
notebook-pane-put-into-text = Metti nel testo
notebook-pane-open-note = Apri nel taccuino
notebook-pane-a-picture = Un'immagine
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Aggiunto alla biblioteca: { $title }
notebook-pane-reference-not-made = { $source } non si è potuto aggiungere alla biblioteca
notebook-pane-picture-not-moved = { $name } non si è potuto mettere fra i file della biblioteca
notebook-pane-file-not-into-text = Un file non va in un testo
notebook-pane-not-into-text = La nota non si è potuta mettere nel testo

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = Scrivi una nota
notebook-note-window-send = Al taccuino
notebook-note-window-add-file = Aggiungi un file…
notebook-note-window-not-sent = La nota non si è potuta scrivere nel taccuino
