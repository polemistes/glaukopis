# The files of the library: a store of their own beside the pictures, in
# folders of their own, each file belonging to no reference, to one or to
# several. The view stands in the library's place.

files-title = File della biblioteca
files-all = Tutti i file
files-file = File
files-unread = I file della biblioteca non si sono potuti leggere
files-count = { $count ->
    [one] { $count } file
    [many] { $count } file
   *[other] { $count } file
}
files-shown-of = { $shown } di { $count ->
    [one] { $count } file
    [many] { $count } file
   *[other] { $count } file
}
files-selected-of = { $count ->
    [one] { $selected } di { $count } file selezionato
    [many] { $selected } di { $count } file selezionati
   *[other] { $selected } di { $count } file selezionati
}
files-selected = { $count ->
    [one] { $count } file selezionato
    [many] { $count } file selezionati
   *[other] { $count } file selezionati
}

## The kinds of files.

files-kind = Tipo
files-kind-pdf = PDF
files-kind-picture = Immagine
files-kind-document = Documento
files-kind-other = Altro file

## Taking in.

files-add = Aggiungi file…
files-add-title = Aggiungi file alla biblioteca
files-add-folder = Aggiungi una cartella…
files-add-folder-title = Aggiungi una cartella alla biblioteca
files-more = Altri modi di aggiungere
files-taking-in = { $count ->
    [one] Aggiunta di un file…
    [many] Aggiunta di { $count } file e cartelle…
   *[other] Aggiunta di { $count } file e cartelle…
}
files-taking-in-progress = Aggiunta di { $done } su { $count }: { $name }
files-taken-in = { $count ->
    [one] Un file aggiunto
    [many] { $count } file aggiunti
   *[other] { $count } file aggiunti
}
files-same = { $count ->
    [one] { $count } già presente
    [many] { $count } già presenti
   *[other] { $count } già presenti
}
files-folders-made = { $count ->
    [one] una cartella creata
    [many] { $count } cartelle create
   *[other] { $count } cartelle create
}
files-problems = { $count ->
    [one] uno non si è potuto leggere
    [many] { $count } non si sono potuti leggere
   *[other] { $count } non si sono potuti leggere
}
files-taken-none = Non è stato aggiunto nulla
files-take-in-failed = I file non si sono potuti aggiungere

## Empty, searched and filtered.

files-empty = Ancora nessun file
files-empty-text = Aggiungi dei file o una cartella, o lasciali cadere qui. Si tiene ogni tipo di file, nel deposito della biblioteca, e una cartella conserva le cartelle che contiene.
files-folder-empty = Nulla in questa cartella
files-folder-empty-text = Lascia cadere qui dei file, o trascinali qui da un'altra cartella.
files-search = Cerca tra i file
files-search-in = Cerca in { $name }
files-search-clear = Azzera la ricerca
files-nothing-found = Nulla di trovato
files-nothing-found-text = Nessun file ha queste parole nel suo nome, o nel suo riferimento.
files-nothing-passes = Nessun file qui passa i filtri.
files-filters = Filtra
files-filters-on = { $count ->
    [one] Filtri: uno attivo
    [many] Filtri: { $count } attivi
   *[other] Filtri: { $count } attivi
}
files-filter-kind = Tipo
files-filter-all = Tutti i tipi
files-filter-pdf = PDF
files-filter-picture = Immagini
files-filter-document = Documenti
files-filter-other = Altri file
files-filter-unassigned = Solo i non assegnati
files-filter-below = Con le cartelle sotto di essa
files-filter-search-all = Cerca in tutte le cartelle
files-filter-clear = Azzera i filtri
files-sort = Ordina
files-sort-name = Per nome
files-sort-reference = Per riferimento
files-sort-added = Per data di aggiunta
files-sort-size = Per dimensione
files-sort-descending = Decrescente

## The list.

files-no-reference = Nessun riferimento
files-missing = mancante
files-reveal = Mostra nel gestore dei file
files-move = Sposta…
files-move-to = Sposta in
files-move-failed = Il file non si è potuto spostare
files-at-top = In cima, in nessuna cartella

## Folders.

files-folders = Cartelle
files-folders-hint = Le cartelle tengono in ordine i file: un posto per ogni file. Una cartella che si aggiunge conserva le cartelle che contiene.
files-folder = Cartella
files-folder-new = Nuova cartella
files-folder-new-in = Nuova cartella in { $name }
files-folder-new-inside = Nuova cartella dentro
files-folder-name = Nome della cartella
files-folder-name-failed = Non si è potuto dare il nome alla cartella
files-folder-move-to = Sposta in
files-folder-to-top = In cima
files-folder-move-failed = La cartella non si è potuta spostare
files-folder-expand = Apri
files-folder-collapse = Chiudi
files-folder-delete = Elimina la cartella
files-folder-delete-title = Eliminare la cartella «{ $name }»?
files-folder-delete-empty = La cartella è vuota.
files-folder-delete-subfolders = { $count ->
    [one] La cartella contiene una sottocartella. Che cosa farne?
    [many] La cartella contiene { $count } sottocartelle. Che cosa farne?
   *[other] La cartella contiene { $count } sottocartelle. Che cosa farne?
}
files-folder-move-up = Sposta su di un livello
files-folder-delete-all-under = Elimina tutte le cartelle sotto questa
files-folder-delete-files = { $count ->
    [one] La cartella contiene un file. Che cosa farne?
    [many] La cartella contiene { $count } file. Che cosa farne?
   *[other] La cartella contiene { $count } file. Che cosa farne?
}
files-folder-delete-files-under = { $count ->
    [one] La cartella e le cartelle sotto di essa contengono un file. Che cosa farne?
    [many] La cartella e le cartelle sotto di essa contengono { $count } file. Che cosa farne?
   *[other] La cartella e le cartelle sotto di essa contengono { $count } file. Che cosa farne?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] Uno di essi appartiene a un riferimento, che lo perderebbe.
    [many] { $count } di essi appartengono a riferimenti, che li perderebbero.
   *[other] { $count } di essi appartengono a riferimenti, che li perderebbero.
}
files-folder-files-to-parent = Metti nella cartella superiore
files-folder-files-delete = Elimina
files-folder-delete-failed = La cartella non si è potuta eliminare

## The pane of a file.

files-name = Nome
files-references = Riferimenti
files-unassigned = Non assegnato: il file non appartiene a nessun riferimento.
files-assign = Assegna a un riferimento…
files-assign-title = Assegna «{ $name }» a un riferimento
files-assign-failed = Il file non si è potuto assegnare
files-unassign = Togli da «{ $name }»
files-unassign-failed = Il file non si è potuto togliere dal riferimento
files-about = Informazioni sul file
files-size = Dimensione
files-pages = Pagine
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } pagina · { $text }
    [many] { $count } pagine · { $text }
   *[other] { $count } pagine · { $text }
}
files-pdf-has-text = ha testo
files-pdf-no-text = senza testo
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = non si è potuto leggere: { $reason }
files-pdf-some-text = { $count ->
    [one] una pagina senza testo
    [many] { $count } pagine senza testo
   *[other] { $count } pagine senza testo
}
files-added = Aggiunto
files-origin = Provenienza
files-searchable = Rendi ricercabile…
files-read-into = Importa il testo come mappa…
files-read-text = Leggi il testo…
files-to-pictures = Metti tra le immagini
files-to-pictures-done = «{ $name }» ora è tra le immagini
files-to-pictures-show = Mostra
files-to-pictures-failed = L'immagine non si è potuta mettere tra le immagini
files-bring-in = Porta dentro come elementi…
files-rename-failed = Il file non si è potuto rinominare

## Removing.

files-remove = Togli
files-remove-title = Togliere «{ $name }» dalla biblioteca?
files-remove-message = Il file viene eliminato dal deposito della biblioteca.
files-remove-message-assigned = { $count ->
    [one] Il file appartiene a { $names }, che lo perde. Viene eliminato dal deposito della biblioteca.
    [many] Il file appartiene a { $count } riferimenti, { $names }, che lo perdono. Viene eliminato dal deposito della biblioteca.
   *[other] Il file appartiene a { $count } riferimenti, { $names }, che lo perdono. Viene eliminato dal deposito della biblioteca.
}
files-remove-many-title = Togliere { $count } file dalla biblioteca?
files-remove-many-message = I file vengono eliminati dal deposito della biblioteca.
files-remove-many-assigned = { $count ->
    [one] Uno di essi appartiene a un riferimento, che lo perde. Vengono eliminati dal deposito della biblioteca.
    [many] { $count } di essi appartengono a riferimenti, che li perdono. Vengono eliminati dal deposito della biblioteca.
   *[other] { $count } di essi appartengono a riferimenti, che li perdono. Vengono eliminati dal deposito della biblioteca.
}
files-remove-failed = Il file non si è potuto togliere
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] Una cartella ne resta vuota.
    [many] { $count } cartelle ne restano vuote.
   *[other] { $count } cartelle ne restano vuote.
}
files-remove-with-folders = Togli, con le cartelle vuote
files-remove-keep-folders = Togli, tieni le cartelle
files-removing = Rimozione di { $count } file…
files-removed = { $count ->
    [0] Nessun file tolto
    [one] Un file tolto
    [many] { $count } file tolti
   *[other] { $count } file tolti
}
files-removed-folders = { $count ->
    [one] con loro una cartella vuota
    [many] con loro { $count } cartelle vuote
   *[other] con loro { $count } cartelle vuote
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Elimina con i file

## Choosing a reference.

files-choose-reference = Scegli un riferimento
files-choose-search = Cerca per autore, titolo o anno
files-choose-references = Riferimenti
files-choose-none = Nessun riferimento ha queste parole.
files-choose-empty = La biblioteca non ha ancora riferimenti.
files-choose-more = … e altri { $count }: cerca per trovarli
files-choose-files = File della biblioteca
files-choose-files-search = Cerca per nome, o per l'opera a cui un file appartiene
files-choose-files-none = Nessun file risponde a questa ricerca.
files-choose-add = { $count ->
    [0] Aggiungi file
    [one] Aggiungi un file
    [many] Aggiungi { $count } file
   *[other] Aggiungi { $count } file
}
files-added-to = { $count ->
    [one] Un file aggiunto a «{ $title }»
    [many] { $count } file aggiunti a «{ $title }»
   *[other] { $count } file aggiunti a «{ $title }»
}
files-choose-new = Nuovo riferimento…
files-choose = Scegli

## Nothing selected.

files-none-selected = Nessun file selezionato
files-none-selected-text = Seleziona un file per vedere che cosa se ne sa e che cosa se ne può fare.
# $name is the folder in view, or “All files”.
files-tally = { $name }: { $count ->
    [one] un file
    [many] { $count } file
   *[other] { $count } file
}, { $unassigned } senza riferimento

## The going-through: files given to their references.

files-go-through-head = Passa in rassegna i file, per darli ai loro riferimenti…
files-go-through-chosen = { $count ->
    [one] Passalo in rassegna…
    [many] Passa in rassegna questi { $count }…
   *[other] Passa in rassegna questi { $count }…
}
files-go-through-nothing = Ogni file qui appartiene a un riferimento
files-folder-go-through = Passa in rassegna i file non assegnati…
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] Un file qui non appartiene a nessun riferimento.
    [many] { $count } file qui non appartengono a nessun riferimento.
   *[other] { $count } file qui non appartengono a nessun riferimento.
}
files-unassigned-go = Passali in rassegna…
files-unassigned-hide = Nascondi
files-going-title = Dai i file ai loro riferimenti
files-going-subtitle = { $count ->
    [one] Un file
    [many] { $count } file
   *[other] { $count } file
}
files-going-finding = { $count ->
    [one] Si cerca di capire che cos'è il file…
    [many] Si cerca di capire che cosa sono i { $count } file…
   *[other] Si cerca di capire che cosa sono i { $count } file…
}
files-going-progress = { $done } di { $count }: { $name }
files-going-finding-hint = Di ogni file si cercano un identificativo e un titolo, se ne legge il nome, e la prima pagina si confronta con la biblioteca. Ciò che si scopre resta finché l'applicazione è aperta.
files-going-stop = Ferma
files-going-failed = Non si è potuto capire che cosa sono i file
files-going-all-certain = { $count ->
    [one] Quello trovato con certezza:
    [many] Tutti i { $count } trovati con certezza:
   *[other] Tutti i { $count } trovati con certezza:
}
files-going-all-probable = { $count ->
    [one] Quello trovato come probabile:
    [many] Tutti i { $count } trovati come probabili:
   *[other] Tutti i { $count } trovati come probabili:
}
files-going-all-new = { $count ->
    [one] Quello nuovo, dai servizi:
    [many] Tutti i { $count } nuovi, dai servizi:
   *[other] Tutti i { $count } nuovi, dai servizi:
}
files-going-all-nothing = { $count ->
    [one] Quello per cui non si è trovato nulla:
    [many] I { $count } per cui non si è trovato nulla:
   *[other] I { $count } per cui non si è trovato nulla:
}
files-going-this-new = Nuovo riferimento
files-going-show-all = Mostra tutti i { $count }
files-going-what = Che cosa diventa { $name }
files-going-this = Questo
files-going-other = Un altro…
files-going-new = Nuovo riferimento…
files-going-later = Più tardi
files-going-certain = certo
files-going-probable = probabile
files-going-which = Quale opera
# $origin is where the description comes from: a service, or the file.
files-going-lookup = Un nuovo riferimento · da { $origin }
files-going-nothing = Nulla di trovato
files-going-chosen = Scelto
files-going-made-here = Fatto qui
files-going-none = Nessuno dei file si è potuto passare in rassegna.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] Un file non è stato guardato. Resta com'è, per un'altra volta.
    [many] { $count } file non sono stati guardati. Restano come sono, per un'altra volta.
   *[other] { $count } file non sono stati guardati. Restano come sono, per un'altra volta.
}
files-going-counts = { $assign } da assegnare, { $later } per dopo
files-going-done = { $count ->
    [0] Nulla da dare
    [one] Dai un file al suo riferimento
    [many] Dai { $count } file ai loro riferimenti
   *[other] Dai { $count } file ai loro riferimenti
}
files-going-applying = Si danno i file ai loro riferimenti…
files-going-source = I file della biblioteca
files-going-assigned = { $count ->
    [0] Nessun file assegnato
    [one] Un file assegnato
    [many] { $count } file assegnati
   *[other] { $count } file assegnati
}
files-going-made = { $count ->
    [one] un nuovo riferimento
    [many] { $count } nuovi riferimenti
   *[other] { $count } nuovi riferimenti
}
files-going-later-count = { $count ->
    [one] { $count } lasciato per dopo
    [many] { $count } lasciati per dopo
   *[other] { $count } lasciati per dopo
}
files-going-undo = Annulla
files-going-undone = { $count ->
    [0] Nessun file ripreso
    [one] Un file ripreso
    [many] { $count } file ripresi
   *[other] { $count } file ripresi
}
files-going-undone-made = { $count ->
    [one] un nuovo riferimento tolto
    [many] { $count } nuovi riferimenti tolti
   *[other] { $count } nuovi riferimenti tolti
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Annulla: un file dato al suo riferimento
    [many] Annulla: { $count } file dati ai loro riferimenti
   *[other] Annulla: { $count } file dati ai loro riferimenti
}

## Exporting.

files-export-folder-title = Scegli la cartella in cui esportare
files-export-title = { $count ->
    [one] Esporta un file
    [many] Esporta { $count } file
   *[other] Esporta { $count } file
}
files-export-all-what = Ogni file viene scritto nella cartella che sceglierai dopo, con il nome del suo riferimento, Autore Anno - Titolo, o con il suo dove non ne ha; le cartelle della biblioteca vi diventano cartelle.
files-export-folder-what = I file della cartella vengono scritti in quella che sceglierai dopo, con i nomi dei loro riferimenti, o con il loro dove non ne hanno; le cartelle sotto di essa vi diventano cartelle.
files-export-files-what = { $count ->
    [one] Il file viene scritto nella cartella che sceglierai dopo, con il nome del suo riferimento, o con il suo dove non ne ha.
    [many] I file vengono scritti nella cartella che sceglierai dopo, con i nomi dei loro riferimenti, o con il loro dove non ne hanno.
   *[other] I file vengono scritti nella cartella che sceglierai dopo, con i nomi dei loro riferimenti, o con il loro dove non ne hanno.
}
files-export-bib = Con un references.bib
files-export-bib-hint = Le opere a cui i file appartengono, ciascuna con i nomi dei suoi file là dove vengono scritti, perché Zotero o JabRef leggano la cartella intera.
files-export-go = Scegli la cartella…
files-exporting = { $count ->
    [one] Esportazione di un file…
    [many] Esportazione di { $count } file…
   *[other] Esportazione di { $count } file…
}
files-exporting-progress = Esportazione di { $done } su { $count }: { $name }
files-exported = { $count ->
    [0] Nessun file esportato
    [one] Un file esportato
    [many] { $count } file esportati
   *[other] { $count } file esportati
}
files-exported-folders = { $count ->
    [one] una cartella
    [many] { $count } cartelle
   *[other] { $count } cartelle
}
files-exported-bib = con un references.bib
files-exported-stopped = { $count ->
    [one] interrotto quando ne restava uno
    [many] interrotto quando ne restavano { $count }
   *[other] interrotto quando ne restavano { $count }
}
files-exported-show = Mostra
files-export-failed = I file non si sono potuti esportare
files-reveal-failed = La cartella non si è potuta mostrare
files-export = Esporta…
files-export-chosen = Esporta questi { $count }…
files-export-all = Esporta tutti i file…
