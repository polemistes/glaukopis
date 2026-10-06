# The projects: the list of them, and what is done with them.

home-title = Projekti
home-join = Pridruži se dijeljenom projektu
home-from-document = Projekt iz dokumenta…
home-new = Novi projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Što se prikazuje
home-recent = Nedavno korišteni
home-all = Svi projekti
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Prikaži sav { $count } projekt
    [few] Prikaži sva { $count } projekta
   *[other] Prikaži svih { $count } projekata
}
# The button that opens the menu of the page.
home-page-menu = Više
home-search = Pronađi projekt
home-search-none = Nijedan projekt nema taj naziv.
home-list-none = Nema projekata.

## Folders of projects

home-new-folder = Novi direktorij
home-folder-new-inside = Novi direktorij unutra…
home-folder-rename-title = Preimenuj direktorij
home-folder-name-placeholder = Što direktorij sadrži
home-folder-name-missing = Dajte direktoriju naziv.
home-folder-projects = { $count ->
    [one] { $count } projekt
    [few] { $count } projekta
   *[other] { $count } projekata
}
home-menu-move = Premjesti u direktorij
home-menu-out = Izvan direktorija
home-folder-delete-title = Izbrisati direktorij „{ $name }”?
home-folder-delete-message = Direktoriji i projekti u njemu ostaju: sele se gore, gdje je bio direktorij.
home-folder-delete-confirm = Izbriši direktorij
home-folder-failed = To s direktorijem nije bilo moguće učiniti
home-moved-to = „{ $name }” premješten je u { $folder }
home-moved-out = „{ $name }” sad nije ni u jednom direktoriju
home-move-failed = Projekt nije bilo moguće premjestiti

## A map of the projects

home-map-menu = Mapa projekata…
home-map-title = Mapa projekata
home-map-about = Novi projekt, s jednom mapom: direktoriji kao elementi, a ispod svakog direktorija projekti u njemu.
home-map-name-default = Projekti
home-map-what = Što mapa sadrži
home-map-names = Samo nazive
home-map-names-hint = Element za svaki projekt, s njegovim opisom kao tekstom.
home-map-everything = Sa svime u njima
home-map-everything-hint = Ispod svakog projekta njegove mape, a ispod svake mape svi njezini elementi, s nazivima i tekstovima.
home-map-note = Citati zadržavaju svoje reference. Uputnica na ilustraciju ili dio ne upućuje ni na što u novom projektu, a komentari ostaju gdje jesu.
home-map-reading = Čitanje „{ $name }”…
home-map-working = Izrada mape…
home-map-make = Načini mapu
home-map-failed = Mapu projekata nije bilo moguće načiniti

## When there are none yet

home-welcome = Dobro došli u Glaukopis
home-welcome-text = Projekt sadrži rad na jednoj knjizi ili članku: mape vaših zamisli, tekstove koje u njih pišete i reference na kojima počivaju.
home-begin = Započni projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = i još { $count }
home-maps = { $count ->
    [one] { $count } mapa
    [few] { $count } mape
   *[other] { $count } mapa
}
home-elements = { $count ->
    [one] { $count } element
    [few] { $count } elementa
   *[other] { $count } elemenata
}
home-words = { $count ->
    [one] { $count } riječ
    [few] { $count } riječi
   *[other] { $count } riječi
}
home-references = { $count ->
    [one] { $count } referenca
    [few] { $count } reference
   *[other] { $count } referenci
}
home-not-begun = Nije započet
home-shared = Dijeljen
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Izmijenjen { $ago }
# The button that opens the menu of a project.
home-more-for = Više za { $name }
home-deleted-projects = { $count ->
    [one] { $count } izbrisan projekt
    [few] { $count } izbrisana projekta
   *[other] { $count } izbrisanih projekata
}

## The menu of a project

home-menu-rename = Preimenuj…
home-menu-duplicate = Udvostruči…
home-menu-history = Ranije inačice…

## Naming a project

home-rename-title = Preimenuj projekt
home-duplicate-title = Udvostruči projekt
home-name = Naziv
home-name-placeholder = Radni naslov knjige ili članka
home-name-missing = Dajte projektu naziv.
home-create = Stvori
home-duplicate = Udvostruči
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopija
home-failed = To nije uspjelo.

## Deleting a project

home-delete-title = Izbrisati „{ $name }”?
home-delete-message = Projekt se premješta u Glaukopisovo smeće, iz kojega se može vratiti. Vaše se reference ne diraju.
home-delete-owner = Projekt se premješta u Glaukopisovo smeće, iz kojega se može vratiti. Ostaje na poslužitelju i kod onih s kojima ga dijelite; da ga maknete s poslužitelja, najprije ga otvorite i prestanite dijeliti.
home-delete-member = Projekt se premješta u Glaukopisovo smeće, iz kojega se može vratiti. Drugi zadržavaju svoje.
home-delete-confirm = Izbriši projekt
home-deleted = „{ $name }” premješten je u smeće
home-delete-failed = Projekt nije bilo moguće izbrisati

## The trash

home-trash-title = Izbrisani projekti
home-trash-none = Nema ih.
home-deleted-ago = Izbrisan { $ago }
home-restore = Vrati
home-restored = „{ $name }” opet je među projektima
home-restore-failed = Projekt nije bilo moguće vratiti
home-purge = Ukloni zauvijek
home-purge-title = Ukloniti „{ $name }” zauvijek?
home-purge-message = Što projekt sadrži nakon ovoga se ne može vratiti. Vaše se reference ne diraju.
home-purge-failed = Projekt nije bilo moguće ukloniti

## Earlier versions of a project

home-history-title = Ranije inačice
home-history-about = Projekta „{ $name }”. Inačica se otvara kao zaseban projekt; ovaj ostaje kakav jest.
home-history-none = Još nijedna nije sačuvana. Inačica se čuva s vremena na vrijeme dok radite: gusto za nedavno, rjeđe za staro.
home-history-open = Otvori kopiju
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, stanje { $day }
home-history-unread = Ranije inačice nije bilo moguće pročitati
home-history-open-failed = Tu inačicu nije bilo moguće otvoriti
