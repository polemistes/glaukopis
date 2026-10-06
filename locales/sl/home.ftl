# The projects: the list of them, and what is done with them.

home-title = Projekti
home-join = Pridruži se deljenemu projektu
home-from-document = Projekt iz dokumenta…
home-new = Nov projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Kaj je prikazano
home-recent = Nazadnje uporabljeni
home-all = Vsi projekti
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Pokaži ves { $count } projekt
    [two] Pokaži vsa { $count } projekta
    [few] Pokaži vse { $count } projekte
   *[other] Pokaži vseh { $count } projektov
}
# The button that opens the menu of the page.
home-page-menu = Več
home-search = Poišči projekt
home-search-none = Noben projekt se ne imenuje tako.
home-list-none = Ni projektov.

## Folders of projects

home-new-folder = Nova mapa
home-folder-new-inside = Nova mapa znotraj…
home-folder-rename-title = Preimenuj mapo
home-folder-name-placeholder = Kaj mapa vsebuje
home-folder-name-missing = Dajte mapi ime.
home-folder-projects = { $count ->
    [one] { $count } projekt
    [two] { $count } projekta
    [few] { $count } projekti
   *[other] { $count } projektov
}
home-menu-move = Premakni v mapo
home-menu-out = Iz map
home-folder-delete-title = Izbrisati mapo »{ $name }«?
home-folder-delete-message = Mape in projekti v njej se ohranijo: premaknejo se tja, kjer je bila mapa.
home-folder-delete-confirm = Izbriši mapo
home-folder-failed = Tega z mapo ni bilo mogoče narediti
home-moved-to = »{ $name }« je premaknjen v mapo { $folder }
home-moved-out = »{ $name }« zdaj ni v nobeni mapi
home-move-failed = Projekta ni bilo mogoče premakniti

## A map of the projects

home-map-menu = Miselni vzorec projektov…
home-map-title = Miselni vzorec projektov
home-map-about = Nov projekt z enim miselnim vzorcem: mape kot elementi in pod vsako mapo projekti v njej.
home-map-name-default = Projekti
home-map-what = Kaj miselni vzorec vsebuje
home-map-names = Samo imena
home-map-names-hint = Element za vsak projekt, z njegovim opisom kot besedilom.
home-map-everything = Z vsem, kar je v njih
home-map-everything-hint = Pod vsakim projektom njegovi miselni vzorci in pod vsakim miselnim vzorcem vsi njegovi elementi z imeni in besedili.
home-map-note = Navedbe obdržijo svoje vire. Sklic na ilustracijo ali del v novem projektu ne kaže na nič, komentarji pa ostanejo zadaj.
home-map-reading = Branje »{ $name }«…
home-map-working = Izdelava miselnega vzorca…
home-map-make = Naredi miselni vzorec
home-map-failed = Miselnega vzorca projektov ni bilo mogoče narediti

## When there are none yet

home-welcome = Dobrodošli v Glaukopisu
home-welcome-text = Projekt hrani delo na eni knjigi ali članku: miselne vzorce vaših zamisli, besedila, ki jih pišete vanje, in vire, na katerih slonijo.
home-begin = Začni projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = in še { $count }
home-maps = { $count ->
    [one] { $count } miselni vzorec
    [two] { $count } miselna vzorca
    [few] { $count } miselni vzorci
   *[other] { $count } miselnih vzorcev
}
home-elements = { $count ->
    [one] { $count } element
    [two] { $count } elementa
    [few] { $count } elementi
   *[other] { $count } elementov
}
home-words = { $count ->
    [one] { $count } beseda
    [two] { $count } besedi
    [few] { $count } besede
   *[other] { $count } besed
}
home-references = { $count ->
    [one] { $count } vir
    [two] { $count } vira
    [few] { $count } viri
   *[other] { $count } virov
}
home-not-begun = Ni začet
home-shared = Deljen
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Spremenjen { $ago }
# The button that opens the menu of a project.
home-more-for = Več za { $name }
home-deleted-projects = { $count ->
    [one] { $count } izbrisan projekt
    [two] { $count } izbrisana projekta
    [few] { $count } izbrisani projekti
   *[other] { $count } izbrisanih projektov
}

## The menu of a project

home-menu-rename = Preimenuj…
home-menu-duplicate = Podvoji…
home-menu-history = Prejšnje različice…

## Naming a project

home-rename-title = Preimenuj projekt
home-duplicate-title = Podvoji projekt
home-name = Ime
home-name-placeholder = Delovni naslov knjige ali članka
home-name-missing = Dajte projektu ime.
home-create = Ustvari
home-duplicate = Podvoji
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopija
home-failed = To ni uspelo.

## Deleting a project

home-delete-title = Izbrisati »{ $name }«?
home-delete-message = Projekt se premakne v koš Glaukopisa, od koder ga je mogoče vrniti. Vaših virov se to ne dotakne.
home-delete-owner = Projekt se premakne v koš Glaukopisa, od koder ga je mogoče vrniti. Ostane na strežniku in pri tistih, s katerimi ga delite; da ga vzamete s strežnika, ga najprej odprite in nehajte deliti.
home-delete-member = Projekt se premakne v koš Glaukopisa, od koder ga je mogoče vrniti. Drugi obdržijo svojega.
home-delete-confirm = Izbriši projekt
home-deleted = »{ $name }« je premaknjen v koš
home-delete-failed = Projekta ni bilo mogoče izbrisati

## The trash

home-trash-title = Izbrisani projekti
home-trash-none = Ni jih.
home-deleted-ago = Izbrisan { $ago }
home-restore = Vrni
home-restored = »{ $name }« je spet med projekti
home-restore-failed = Projekta ni bilo mogoče vrniti
home-purge = Odstrani za vedno
home-purge-title = Odstraniti »{ $name }« za vedno?
home-purge-message = Tega, kar projekt vsebuje, po tem ne bo mogoče vrniti. Vaših virov se to ne dotakne.
home-purge-failed = Projekta ni bilo mogoče odstraniti

## Earlier versions of a project

home-history-title = Prejšnje različice
home-history-about = Projekta »{ $name }«. Različica se odpre kot svoj projekt; ta ostane, kakršen je.
home-history-none = Nobena še ni shranjena. Različica se shrani vsake toliko, medtem ko delate: na gosto za nedavno, redkeje za staro.
home-history-open = Odpri kopijo
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, stanje { $day }
home-history-unread = Prejšnjih različic ni bilo mogoče prebrati
home-history-open-failed = Te različice ni bilo mogoče odpreti
