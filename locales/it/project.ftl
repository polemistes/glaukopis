# A project: its view, the bar over the map, what is done to elements, and
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
project-name = Nome del progetto
project-rename = Rinomina il progetto
project-not-saved = Non salvato
project-redo = Ripeti
project-view-this = Vista di questa mappa
project-diagram = Diagramma
project-text = Testo
project-one-at-a-time = Una alla volta
project-side-by-side = Due affiancate
project-close-side = Chiudi questo lato
project-references = Riferimenti
project-pictures = Immagini
project-side-tabs = Che cosa mostra il pannello laterale
project-side-map = Mappa
project-between-maps = Tra le due mappe
project-between-preview = Tra la mappa e l'anteprima
project-between-pictures = Tra la mappa e le immagini
project-between-references = Tra la mappa e i riferimenti

## When the sharing ends from the other side

project-unshared = Il progetto non è più condiviso
project-unshared-this = Questo progetto non è più condiviso
project-left-out = Non sei più tra i collaboratori
project-unshared-unfetched = Non era stato recuperato, perciò su questo computer non ce n'è nulla.
project-unshared-not-removed = Il progetto non era stato recuperato, e non si è potuto togliere dall'elenco dei progetti
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

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Senza titolo
project-where = Dove sei
# The tooltip of the crumb of the parent of the element in view, in the path over a side.
project-up-hint = Risali a «{ $name }» · Alt+Maiusc+↑
# The small round button by the element in view, in the diagram and the text: up to the element over it.
project-leave-map = Risali a «{ $name }»
# The owl before the name of the project itself, in the first pane: up to all the projects.
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, condiviso da te
project-badge-joined = { $name }, a cui partecipi
# Two projects side by side.
project-beside-failed = Il progetto non si è potuto aprire accanto a questo
project-beside-no-comments = I commenti sono quelli del progetto che hai aperto: apri l'altro da solo per commentarvi
# A template of the writer's own was saved anew, and the copy of it the project carries could not be made afresh.
project-template-not-renewed = La copia del modello che il progetto tiene non si è potuta aggiornare
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Copia in «{ $name }»
project-move-to-project = Sposta in «{ $name }»
project-document-into = Un documento al suo interno…
project-drop-on-map = Lascia cadere su una mappa per spostare lì · tieni premuto Ctrl per copiare
project-open-beside = Apri accanto
project-open-beside-hint = Due mappe affiancate, per spostare elementi dall'una all'altra
project-side-by-side-short = Affiancate
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } da passare in rassegna, e di cui fare citazioni
project-copied-to = Copiato in «{ $name }»
project-moved-to = Spostato in «{ $name }»
project-other-projects = Altri progetti
project-send-failed = Non si è potuto scrivere in «{ $project }». Qui non è cambiato nulla.
project-send-no-element = L'elemento non è più in quel progetto.

## What is done to elements, in the diagram and in the text

project-add-under = Aggiungi un elemento sotto
project-add = Aggiungi un elemento
project-add-after = Aggiungi un elemento dopo
project-write-text = Scrivi il suo testo
project-associate = Associa a…
project-associate-hint = Poi fai clic sull'altro elemento
project-heading = Stampa il nome come titolo
project-heading-hint = Spento: il nome è un'etichetta per te; si stampa solo il testo
project-leave-out = Lascia fuori dal documento
project-leave-out-hint = Con tutto ciò che ha sotto
# An element that stands for another element: in the document, that element is in its place.
project-stands-for = Sta per «{ $name }»
project-stand-for = Sta per un altro elemento
project-stand-for-heading = Nel documento, questo elemento prende il suo posto
project-stand-for-none = Nessuno
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Copia in
project-cut = Taglia
project-cut-not-removed = Ciò che è stato tagliato è stato incollato, ma non si è potuto togliere dal progetto da cui veniva
project-copy = Copia
# Pasting what was copied under the element the menu is of.
project-paste-under = Incolla sotto
project-move-to = Sposta in
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Scegli dove…
# Opening the same dialog, to choose the element this one stands for.
project-choose-element = Scegli un elemento…
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] Copia «{ $name }» in
    [many] Copia { $count } elementi in
   *[other] Copia { $count } elementi in
}
project-pick-move-title = { $count ->
    [one] Sposta «{ $name }» in
    [many] Sposta { $count } elementi in
   *[other] Sposta { $count } elementi in
}
project-pick-stand-title = Per che cosa sta «{ $name }»
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Copia qui
project-pick-move = Sposta qui
project-pick-stand = Sta per questo
project-pick-find = Trova un elemento per nome
project-pick-none = Nessun elemento ha quel nome
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = Un elemento non può andare dentro sé stesso, né dentro ciò che ha sotto
project-pick-self = Un elemento non può stare per sé stesso
project-pick-loop = Il documento conterrebbe sé stesso
project-tidy-branch = Riordina questo ramo
project-place-automatically = Colloca automaticamente
project-delete-keeping = Elimina, tenendo ciò che ha sotto
project-itself-stays = Il progetto stesso resta
project-itself-stays-detail = Elimina il progetto dalla pagina dei progetti.
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
project-stands-for-map = Sta per «{ $name }»
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

## A copy and its original.
copy-title = La copia e il suo originale
copy-from = Copiato da «{ $name }»
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
copy-copied-from = Copiato da «{ $name }»
copy-copied-from-changed = Copiato da «{ $name }», che da allora è cambiato

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
