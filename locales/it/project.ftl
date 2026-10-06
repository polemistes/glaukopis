# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = I progetti non si sono potuti leggere

## The view of a project

project-open-failed = Il progetto non si è potuto aprire
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Il progetto non si è potuto aprire.
project-back = Torna ai progetti
project-fetching = Recupero del progetto
project-fetching-offline = Il server non è raggiungibile. Il progetto sarà recuperato quando si potrà.
project-fetching-on-the-way = Sta arrivando dal server.
project-all-projects = Tutti i progetti
project-name = Nome del progetto
project-rename = Rinomina il progetto
project-not-saved = Non salvato
project-redo = Ripeti
project-view = Vista della mappa
project-view-this = Vista di questa mappa
project-diagram = Diagramma
project-text = Testo
project-one-at-a-time = Una alla volta
project-side-by-side = Due affiancate
project-close-side = Chiudi questo lato
project-references = Riferimenti
project-pictures = Immagini
project-side = Riferimenti, immagini, cronologia e modifiche
project-side-tabs = Che cosa mostra il pannello laterale
project-side-map = Mappa
project-preview = Anteprima ed esportazione
project-share = Condividi
project-shared = Condiviso
project-shared-offline = Condiviso · il server non è raggiungibile
project-shared-too-large = Condiviso · il server non accetta le ultime modifiche
project-between-maps = Tra le due mappe
project-between-preview = Tra la mappa e l'anteprima
project-between-pictures = Tra la mappa e le immagini
project-between-references = Tra la mappa e i riferimenti

## When the sharing ends from the other side

project-unshared = Il progetto non è più condiviso
project-unshared-this = Questo progetto non è più condiviso
project-left-out = Non sei più tra i collaboratori
project-unshared-unfetched = Non era stato recuperato, perciò su questo computer non ce n'è nulla.
project-unshared-kept = Chi lo condivideva lo ha tolto dal server. Tieni il progetto com'è ora, e puoi continuare a lavorarci per conto tuo.
project-left-out-kept = Tieni il progetto com'è ora, e puoi continuare a lavorarci per conto tuo. Ciò che gli altri scrivono d'ora in poi non ti arriva.
project-understood = Ho capito

## Files dropped on the project

project-drop-picture = Lascia cadere un'immagine sull'elemento a cui appartiene
project-cited-in = { $count ->
    [one] Il riferimento è citato in «{ $name }»
    [many] { $count } riferimenti sono citati in «{ $name }»
   *[other] { $count } riferimenti sono citati in «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Il riferimento è citato nell'elemento
    [many] { $count } riferimenti sono citati nell'elemento
   *[other] { $count } riferimenti sono citati nell'elemento
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Senza titolo
# The name of a copy of a map.
project-map-copy = { $name }, copia
project-maps = Mappe
project-map-name = Nome della mappa
project-new-map = Nuova mappa
project-map-from-document = Una mappa da un documento…
project-drop-on-map = Lascia cadere su una mappa per spostare lì · tieni premuto Ctrl per copiare
project-duplicate = Duplica
project-duplicate-hint = Una copia su cui lavorare; questa resta com'è
project-open-beside = Apri accanto
project-open-beside-hint = Due mappe affiancate, per spostare elementi dall'una all'altra
project-this-map-actions = Questa mappa, e le mappe
project-maps-hint = Le mappe del progetto: scegline una per aprirla
project-map-beside = accanto a questa
project-side-by-side-short = Affiancate
project-preview-short = Anteprima
project-found = Citazioni trovate…
# The count is of those found in the map.
project-found-hint = { $count } da passare in rassegna, e di cui fare citazioni
project-found-none = E testo che sembra una citazione
project-delete-map = Elimina la mappa
project-delete-map-title = Eliminare la mappa «{ $name }»?
project-delete-map-message = { $count ->
    [one] { $count } elemento e il testo che contiene se ne andranno. Si può annullare finché il progetto è aperto.
    [many] { $count } elementi e il testo che contengono se ne andranno. Si può annullare finché il progetto è aperto.
   *[other] { $count } elementi e il testo che contengono se ne andranno. Si può annullare finché il progetto è aperto.
}
project-copied-to = Copiato in «{ $name }»
project-moved-to = Spostato in «{ $name }»

## What is done to elements, in the diagram and in the text

project-add-under = Aggiungi un elemento sotto
project-add = Aggiungi un elemento
project-add-after = Aggiungi un elemento dopo
project-write-text = Scrivi il suo testo
project-double-click = Doppio clic
project-associate = Associa a…
project-associate-hint = Poi fai clic sull'altro elemento
project-heading = Stampa il nome come titolo
project-heading-hint = Spento: il nome è un'etichetta per te; si stampa solo il testo
project-leave-out = Lascia fuori dal documento
project-leave-out-hint = Con tutto ciò che ha sotto
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Sta per «{ $name }»
project-stand-for = Sta per un'altra mappa
project-stand-for-heading = Nel documento, questa mappa prende il suo posto
project-stand-for-none = Nessuna
project-copy-to-map = Copia nella mappa
project-copy = Copia
# Pasting what was copied under the element the menu is of.
project-paste-under = Incolla sotto
project-move-to-map = Sposta nella mappa
project-map-from-branch = Nuova mappa da questo ramo
project-map-from-branch-hint = Una copia su cui lavorare; questo resta
project-detach = Stacca dal genitore
project-detach-hint = Un elemento sciolto, da collocare più tardi
project-tidy-branch = Riordina questo ramo
project-place-automatically = Colloca automaticamente
project-delete-keeping = Elimina, tenendo ciò che ha sotto
project-centre-stays = Il centro di una mappa resta
project-centre-stays-detail = Elimina la mappa stessa dalla sua scheda.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] «{ $name }» è stato eliminato
    [one] «{ $name }» è stato eliminato, con { $under } elemento sotto
    [many] «{ $name }» è stato eliminato, con { $under } elementi sotto
   *[other] «{ $name }» è stato eliminato, con { $under } elementi sotto
}
project-deleted-many = { $count ->
    [one] { $count } elemento eliminato
    [many] { $count } elementi eliminati
   *[other] { $count } elementi eliminati
}

project-delete-busy-title = Qualcuno sta scrivendo qui
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] sta
    [many] stanno
   *[other] stanno
} lavorando in ciò che verrebbe eliminato. Ciò che vi si scrive ora andrebbe perduto, e non si potrebbe riportare indietro.
project-delete-busy-confirm = Elimina comunque

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Elemento
project-name-placeholder = Nome
project-write-here = Scrivi qui. Digita @ per citare.
project-words = { $count ->
    [one] { $count } parola
    [many] { $count } parole
   *[other] { $count } parole
}
project-read-on = Doppio clic per continuare a leggere
project-stands-for-map = Sta per la mappa «{ $name }»
project-name-not-printed = Il nome non è stampato
project-left-out-of-document = Lasciato fuori dal documento

## The panels at the side: the references and the pictures

project-this-map = Questa mappa
project-project = Progetto
project-library = Biblioteca
project-nothing-found = Nulla di trovato
project-edit-reference = Modifica il riferimento…
project-new-reference = Nuovo riferimento
project-import-file = Importa un file
project-which-references = Quali riferimenti
project-search-references = Cerca riferimenti
project-library-empty = La tua biblioteca è vuota
project-library-empty-hint = Aggiungi un riferimento, o importa quelli che hai.
project-no-references = Ancora nessun riferimento
project-no-references-hint = Ciò che citi scrivendo è elencato qui. Per citare, scegli Cita sopra il testo, o digita @.
project-cited-in-heading = Citato in
project-not-cited = Non citato in questo progetto.
project-references-drag = Trascina un riferimento in un testo per citarlo lì, o su un elemento per citarlo alla fine del suo testo.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } in questo progetto non è nella tua biblioteca.
    [many] { $count } in questo progetto non sono nella tua biblioteca.
   *[other] { $count } in questo progetto non sono nella tua biblioteca.
}
# The store of pictures.
project-store = Deposito
project-open-picture = Apri…
project-put-into-text = Mettila nel testo
project-add-pictures = Aggiungi immagini da file
project-which-pictures = Quali immagini
project-search-pictures = Cerca immagini
project-a-picture = Un'immagine
project-with-notes = Con note
project-not-on-computer = Non su questo computer
project-nothing-said = Non se ne dice ancora nulla
project-store-empty = Il deposito è vuoto
project-store-empty-hint = Aggiungi immagini da file, o lasciale cadere su un testo.
project-no-pictures = Ancora nessuna immagine
project-no-pictures-map = Le immagini delle figure di questa mappa sono elencate qui. Quelle del deposito sono sotto Deposito.
project-no-pictures-project = Le immagini delle figure del progetto sono elencate qui. Quelle del deposito sono sotto Deposito.
project-pictures-drag = Trascina un'immagine in un testo per farne una figura lì, o su un elemento per metterla alla fine del suo testo.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } in questa mappa non è su questo computer.
    [many] { $count } in questa mappa non sono su questo computer.
   *[other] { $count } in questa mappa non sono su questo computer.
}
project-pictures-absent-project = { $count ->
    [one] { $count } in questo progetto non è su questo computer.
    [many] { $count } in questo progetto non sono su questo computer.
   *[other] { $count } in questo progetto non sono su questo computer.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementi
   *[other] { $count } elementi
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } è qui
project-link-placeholder = Come sono legati
project-link-label = Etichetta dell'associazione

## A copy and its original, in another map.
copy-title = La copia e il suo originale
copy-from = Copiato da «{ $name }» nella mappa «{ $map }»
copy-original-changed = L'originale è cambiato da quando è stato copiato, o da quando lo si è visto l'ultima volta.
copy-original-same = L'originale è com'era quando è stato copiato.
copy-original-unknown = Se l'originale sia cambiato da quando è stato copiato non si sa: la copia è stata fatta prima che questo si tenesse.
copy-original-gone = L'originale non c'è più.
copy-how-shown = Qui sotto, barrato, c'è ciò che ha solo l'originale, e segnato, ciò che ha solo questa copia.
copy-alike = I loro nomi e testi sono uguali. Possono differire in ciò che non è parola: citazioni, immagini, segni.
copy-only-original = Solo nell'originale
copy-only-copy = Solo in questa copia
copy-go = Vai all'originale
copy-seen = Tieni questa copia com'è
copy-take = Prendi il nome e il testo dell'originale
copy-changed-mark = L'originale è cambiato da quando questo è stato copiato
copy-compare = Confronta con l'originale…
copy-copied-from = Copiato da «{ $name }» in «{ $map }»
copy-copied-from-changed = Copiato da «{ $name }» in «{ $map }», che da allora è cambiato

## How far the writing of an element has come, as its writer says.
status = Stato
status-idea = Idea
status-draft = Bozza
status-done = Finito
status-none = Nessuno stato
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } parola
    [many] { $count } parole
   *[other] { $count } parole
}
status-count-idea = { $count ->
    [one] { $count } idea
    [many] { $count } idee
   *[other] { $count } idee
}
status-count-draft = { $count ->
    [one] { $count } bozza
    [many] { $count } bozze
   *[other] { $count } bozze
}
status-count-done = { $count } finiti
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } parola scritta
    [many] { $count } parole scritte
   *[other] { $count } parole scritte
}
status-progress = A che punto è la mappa
