# The projects: the list of them, and what is done with them.

home-title = Progetti
home-join = Entra in un progetto condiviso
home-from-document = Un progetto da un documento…
home-new = Nuovo progetto

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Che cosa è mostrato
home-recent = Usati di recente
home-all = Tutti i progetti
# Under the cards, when there are more projects than they show.
home-show-all = Mostra tutti i { $count } progetti
# The button that opens the menu of the page.
home-page-menu = Altro
home-search = Trova un progetto
home-search-none = Nessun progetto ha quel nome.
home-list-none = Non ci sono progetti.

## Folders of projects

home-new-folder = Nuova cartella
home-folder-new-inside = Nuova cartella dentro…
home-folder-rename-title = Rinomina la cartella
home-folder-name-placeholder = Che cosa contiene la cartella
home-folder-name-missing = Dai un nome alla cartella.
home-folder-projects = { $count ->
    [one] { $count } progetto
    [many] { $count } progetti
   *[other] { $count } progetti
}
home-menu-move = Sposta nella cartella
home-menu-out = Fuori dalle cartelle
home-folder-delete-title = Eliminare la cartella «{ $name }»?
home-folder-delete-message = Le cartelle e i progetti che contiene sono conservati: salgono dove stava la cartella.
home-folder-delete-confirm = Elimina la cartella
home-folder-failed = Questo non si è potuto fare con la cartella
home-moved-to = «{ $name }» è stato spostato in { $folder }
home-moved-out = «{ $name }» ora non è in nessuna cartella
home-move-failed = Il progetto non si è potuto spostare

## A map of the projects

home-map-menu = Una mappa dei progetti…
home-map-title = Una mappa dei progetti
home-map-about = Un nuovo progetto, con una mappa: le cartelle come elementi, e sotto ogni cartella i progetti che contiene.
home-map-name-default = Progetti
home-map-what = Che cosa contiene la mappa
home-map-names = Solo i nomi
home-map-names-hint = Un elemento per ogni progetto, con la sua descrizione come testo.
home-map-everything = Con tutto ciò che contengono
home-map-everything-hint = Sotto ogni progetto le sue mappe, e sotto ogni mappa tutti i suoi elementi, con i loro nomi e testi.
home-map-note = Le citazioni tengono i loro riferimenti. Un rimando a una figura o a una parte non punta a nulla nel nuovo progetto, e i commenti restano indietro.
home-map-reading = Lettura di «{ $name }»…
home-map-working = Creazione della mappa…
home-map-make = Fai la mappa
home-map-failed = La mappa dei progetti non si è potuta fare

## When there are none yet

home-welcome = Benvenuti in Glaukopis
home-welcome-text = Un progetto contiene il lavoro su un libro o un articolo: le mappe delle tue idee, i testi che vi scrivi dentro, e i riferimenti su cui poggiano.
home-begin = Comincia un progetto

## A project in the list

# Under the names of the first four maps.
home-more-maps = e altre { $count }
home-maps = { $count ->
    [one] { $count } mappa
    [many] { $count } mappe
   *[other] { $count } mappe
}
home-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementi
   *[other] { $count } elementi
}
home-words = { $count ->
    [one] { $count } parola
    [many] { $count } parole
   *[other] { $count } parole
}
home-references = { $count ->
    [one] { $count } riferimento
    [many] { $count } riferimenti
   *[other] { $count } riferimenti
}
home-not-begun = Non cominciato
home-shared = Condiviso
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Modificato { $ago }
# The button that opens the menu of a project.
home-more-for = Altro per { $name }
home-deleted-projects = { $count ->
    [one] { $count } progetto eliminato
    [many] { $count } progetti eliminati
   *[other] { $count } progetti eliminati
}

## The menu of a project

home-menu-rename = Rinomina…
home-menu-duplicate = Duplica…
home-menu-history = Versioni precedenti…

## Naming a project

home-rename-title = Rinomina il progetto
home-duplicate-title = Duplica il progetto
home-name = Nome
home-name-placeholder = Il titolo di lavoro del libro o dell'articolo
home-name-missing = Dai un nome al progetto.
home-create = Crea
home-duplicate = Duplica
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, copia
home-failed = Non ha funzionato.

## Deleting a project

home-delete-title = Eliminare «{ $name }»?
home-delete-message = Il progetto è spostato nel cestino di Glaukopis, da cui si può riportare indietro. I tuoi riferimenti non sono toccati.
home-delete-owner = Il progetto è spostato nel cestino di Glaukopis, da cui si può riportare indietro. Resta sul server e presso quelli con cui lo condividi; per toglierlo dal server, aprilo e smetti prima di condividerlo.
home-delete-member = Il progetto è spostato nel cestino di Glaukopis, da cui si può riportare indietro. Gli altri tengono il loro.
home-delete-confirm = Elimina il progetto
home-deleted = «{ $name }» è stato spostato nel cestino
home-delete-failed = Il progetto non si è potuto eliminare

## The trash

home-trash-title = Progetti eliminati
home-trash-none = Non ce ne sono.
home-deleted-ago = Eliminato { $ago }
home-restore = Riporta indietro
home-restored = «{ $name }» è di nuovo tra i progetti
home-restore-failed = Il progetto non si è potuto riportare indietro
home-purge = Elimina per sempre
home-purge-title = Eliminare «{ $name }» per sempre?
home-purge-message = Ciò che il progetto contiene non si potrà più riportare indietro. I tuoi riferimenti non sono toccati.
home-purge-failed = Il progetto non si è potuto eliminare

## Earlier versions of a project

home-history-title = Versioni precedenti
home-history-about = Di «{ $name }». Una versione si apre come progetto a sé; questo resta com'è.
home-history-none = Non ne è stata ancora conservata nessuna. Una versione è conservata ogni tanto mentre lavori: fitte per ciò che è recente, più rade per ciò che è vecchio.
home-history-open = Apri una copia
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, al { $day }
home-history-unread = Le versioni precedenti non si sono potute leggere
home-history-open-failed = Quella versione non si è potuta aprire
