# The projects: the list of them, and what is done with them.

home-title = Progetti
home-join = Entra in un progetto condiviso
home-from-document = Un progetto da un documento…
home-new = Nuovo progetto

## The three forms of the page: the last used projects as cards, all of them as a list, all of them as a map around the owl

home-shown = Che cosa è mostrato
home-recent = Usati di recente
home-all = Tutti i progetti
home-owl = Mappa
# Under the cards, when there are more projects than they show.
home-show-all = Mostra tutti i { $count } progetti
# The button that opens the menu of the page.
home-page-menu = Altro
home-search = Trova un progetto
home-search-none = Nessun progetto ha quel nome.
home-list-none = Non ci sono progetti.

## Folders of projects

home-new-folder = Nuova cartella
home-folder-new-project = Nuovo progetto dentro…
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

## The pane of projects, at the left of a project

home-pane = L'elenco dei progetti
home-pane-toggle = L'elenco dei progetti
home-pane-close = Chiudi l'elenco dei progetti
home-pane-between = Tra l'elenco dei progetti e il progetto
# On the chevron before an element of the open project, in the pane: what is under it is shown, or hidden.
home-tree-unfold = Mostra ciò che sta sotto
home-tree-fold = Nascondi ciò che sta sotto
# Why the project that is open cannot be renamed or deleted from its menu.
home-open-now = Ora è aperto
# On the menu of a project, or of an element of one, in the pane: shows it in a second pane, beside the project that is open.
home-open-beside = Apri accanto
# Under a project that is not open, in the pane, when what it holds could not be read.
home-tree-unreadable = Non si è potuto leggere
# Under a project that is not open, in the pane, when it holds no elements yet.
home-tree-empty = Ancora vuoto

## The owl map: the projects drawn around the owl, the folders as plain labels

# The button that shows all of the map at once.
home-owl-fit = Mostrala tutta
# On a folder of the map: its projects are hidden, or shown.
home-owl-fold = Nascondi i progetti che contiene
home-owl-unfold = Mostra i progetti che contiene
# The map itself, as a list read aloud.
home-owl-label = La mappa dei progetti
# The corner of a card that opens the project, and of a folder that shows it at the centre of the map.
home-owl-open = Apri il progetto
home-owl-enter = Apri la cartella come mappa
# The corner of the folder at the centre: up to what holds it.
home-owl-leave = Risali a «{ $name }»
# The menus of the map and of a folder on it: a new one made here, its name written in place.
home-owl-new-project = Nuovo progetto qui
home-owl-new-folder = Nuova cartella qui
# What a new folder or project is called until its name is written.
home-owl-name = Nome
# Beside the pointer, while several folders and projects are dragged.
home-owl-dragged = { $count ->
    [one] { $count } cosa
    [many] { $count } cose
   *[other] { $count } cose
}
# On a card: the map of the project, shown under it on the map of the projects, or hidden.
home-owl-map-show = Mostra qui la sua mappa
home-owl-map-hide = Nascondi la sua mappa
home-owl-map-reading = Lettura della sua mappa…
# On an element of a project's map: the project opened there.
home-owl-jump = Apri il progetto qui
home-owl-fold-element = Nascondi ciò che sta sotto
home-owl-unfold-element = Mostra ciò che sta sotto
# The menu of the map: what was put by hand is placed by itself again.
home-owl-tidy = Disponi tutto automaticamente
home-owl-tidied = Tutto sulla mappa è di nuovo disposto automaticamente
# What a change of the map says, with a way back.
home-owl-placed = «{ $name }» ora sta lì
home-owl-placed-many = { $count ->
    [one] { $count } cosa è stata messa lì
    [many] { $count } cose sono state messe lì
   *[other] { $count } cose sono state messe lì
}
home-owl-elements-moved = { $count ->
    [one] Un elemento di «{ $project }» è stato spostato
    [many] { $count } elementi di «{ $project }» sono stati spostati
   *[other] { $count } elementi di «{ $project }» sono stati spostati
}
home-owl-elements-carried = { $count ->
    [one] Un elemento è stato spostato in «{ $to }»
    [many] { $count } elementi sono stati spostati in «{ $to }»
   *[other] { $count } elementi sono stati spostati in «{ $to }»
}
# The bar over the map, at a folder: what holds it.
home-owl-in = In «{ $name }»

## A map of the projects

home-map-menu = Una mappa dei progetti…
home-map-title = Una mappa dei progetti
home-map-about = Un nuovo progetto: le cartelle come elementi, e sotto ogni cartella i progetti che contiene.
home-map-name-default = Progetti
home-map-what = Che cosa contiene la mappa
home-map-names = Solo i nomi
home-map-names-hint = Un elemento per ogni progetto, con la sua descrizione come testo.
home-map-everything = Con tutto ciò che contengono
home-map-everything-hint = Sotto ogni progetto tutti i suoi elementi, con i loro nomi e testi.
home-map-note = Le citazioni tengono i loro riferimenti. Un rimando a una figura o a una parte non punta a nulla nel nuovo progetto, e i commenti restano indietro.
home-map-reading = Lettura di «{ $name }»…
home-map-working = Creazione della mappa…
home-map-make = Fai la mappa
home-map-failed = La mappa dei progetti non si è potuta fare

## When there are none yet

home-welcome = Benvenuti in Glaukopis
home-welcome-text = Un progetto contiene il lavoro su un libro o un articolo: la mappa delle tue idee, i testi che vi scrivi dentro, e i riferimenti su cui poggiano.
home-begin = Comincia un progetto

## A project in the list

# Under the names of the first four maps.
home-more-maps = e altre { $count }
home-maps = { $count ->
    [one] { $count } albero
    [many] { $count } alberi
   *[other] { $count } alberi
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
home-menu-save-file = Salva come file…
home-menu-save-org = Salva come Org…

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

## A project as one file

home-file-open = Apri un file di progetto…
home-file-open-title = Apri un file di progetto
# The kind of file, in the dialog that asks for one.
home-file-filter = Progetto di Glaukopis
home-file-save-title = Salva il progetto come file
home-file-saved = «{ $name }» è stato salvato come file
home-file-save-failed = Il progetto non si è potuto salvare come file
home-file-open-failed = Il file di progetto non si è potuto aprire
home-file-opened = «{ $name }» è stato fatto dal file
home-file-opened-added = «{ $name }» è stato fatto dal file. { $count ->
    [one] Un'opera è stata aggiunta
    [many] { $count } opere sono state aggiunte
   *[other] { $count } opere sono state aggiunte
} alla tua biblioteca.
home-file-problems = { $count ->
    [one] Un'opera non si è potuta portare nella tua biblioteca. È citata com'era nel file.
    [many] { $count } opere non si sono potute portare nella tua biblioteca. Sono citate com'erano nel file.
   *[other] { $count } opere non si sono potute portare nella tua biblioteca. Sono citate com'erano nel file.
}
# The dialog that asks what is to be done with the works a project file cites.
home-file-references-title = Le opere che il progetto cita
home-file-references-about = Prima che «{ $name }» sia fatto: queste opere sono nella tua biblioteca, ma non come sono nel file.
home-file-in-file = Nel file
home-file-same-id = Nella tua biblioteca come la stessa voce, scritta in un altro modo
home-file-merged = Nella tua biblioteca, fusa in questa
home-file-what-to-do = Che cosa farne
home-file-keep-library = Tieni quella della tua biblioteca
home-file-take-file = Prendi quella del file nella tua biblioteca
home-file-keep-both = Tienile entrambe
home-file-cite-library = Cita quella della tua biblioteca
home-file-add-another = Aggiungi quella del file come un'altra opera
home-file-same = { $count ->
    [one] Un'opera è nella tua biblioteca come è nel file.
    [many] { $count } opere sono nella tua biblioteca come sono nel file.
   *[other] { $count } opere sono nella tua biblioteca come sono nel file.
}
home-file-added = { $count ->
    [one] Un'opera non è nella tua biblioteca, e vi viene aggiunta.
    [many] { $count } opere non sono nella tua biblioteca, e vi vengono aggiunte.
   *[other] { $count } opere non sono nella tua biblioteca, e vi vengono aggiunte.
}
home-file-make = Fai il progetto

## A project as Org: its readable copy in a folder, and a new project made of an Org file

home-org-open = Apri un file Org…
home-org-open-title = Apri un file Org
# The kind of file, in the dialog that asks for one.
home-org-filter = File Org
home-org-open-failed = Il file Org non si è potuto aprire
home-org-save-title = Scegli la cartella in cui salvare il progetto come Org
home-org-saved = «{ $name }» è stato salvato come Org
home-org-save-failed = Il progetto non si è potuto salvare come Org

## Changes of the home undone and done again
home-redo = Ripeti
# What was undone, as the message of the change said it.
home-undone = Annullato: { $what }
home-undo-failed = Non si è potuto annullare

## What a change of the home says, with a way back
home-renamed = «{ $old }» ora si chiama «{ $name }»
home-project-made = «{ $name }» è stato creato
home-folder-made = La cartella «{ $name }» è stata creata
home-moved-many-to = { $count ->
    [one] { $count } cosa è stata spostata in { $folder }
    [many] { $count } cose sono state spostate in { $folder }
   *[other] { $count } cose sono state spostate in { $folder }
}
home-moved-many-out = { $count ->
    [one] { $count } cosa ora non è in nessuna cartella
    [many] { $count } cose ora non sono in nessuna cartella
   *[other] { $count } cose ora non sono in nessuna cartella
}
home-folder-deleted = La cartella «{ $name }» è stata eliminata; ciò che conteneva è salito al suo posto
home-deleted-many = { $count ->
    [one] { $count } cosa è stata eliminata
    [many] { $count } cose sono state eliminate
   *[other] { $count } cose sono state eliminate
}
home-not-in-trash = Il progetto non è più nel cestino.
home-folders-delete-title = { $count ->
    [one] Eliminare { $count } cartella?
    [many] Eliminare { $count } cartelle?
   *[other] Eliminare { $count } cartelle?
}
home-folders-delete-message = Le cartelle e i progetti che contengono sono conservati: salgono dove stavano le cartelle.
home-folders-delete-confirm = Elimina le cartelle
home-delete-many-title = { $count ->
    [one] Eliminare { $count } progetto?
    [many] Eliminare { $count } progetti?
   *[other] Eliminare { $count } progetti?
}
home-delete-many-message = I progetti sono spostati nel cestino di Glaukopis, da cui si possono riportare indietro. I tuoi riferimenti non sono toccati.
home-delete-many-shared = I progetti sono spostati nel cestino di Glaukopis, da cui si possono riportare indietro. Quelli che condividi restano sul server e presso gli altri.
home-delete-many-confirm = Elimina i progetti
