# The projects: the list of them, and what is done with them.

home-title = Projekti
home-join = Pridruži se dijeljenom projektu
home-from-document = Projekat iz dokumenta…
home-new = Novi projekat

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Šta se prikazuje
home-recent = Posljednje korišteni
home-all = Svi projekti
# Under the cards, when there are more projects than they show.
home-show-all = Prikaži sve projekte ({ $count })
# The button that opens the menu of the page.
home-page-menu = Više
home-search = Pronađi projekat
home-search-none = Nijedan projekat nema taj naziv.
home-list-none = Nema projekata.

## Folders of projects

home-new-folder = Novi folder
home-folder-new-inside = Novi folder unutra…
home-folder-rename-title = Preimenuj folder
home-folder-name-placeholder = Šta folder sadrži
home-folder-name-missing = Dajte folderu naziv.
home-folder-projects = { $count ->
    [one] { $count } projekat
    [few] { $count } projekta
   *[other] { $count } projekata
}
home-menu-move = Premjesti u folder
home-menu-out = Izvan foldera
home-folder-delete-title = Izbrisati folder „{ $name }“?
home-folder-delete-message = Folderi i projekti u njemu se čuvaju: premještaju se gore, gdje je folder bio.
home-folder-delete-confirm = Izbriši folder
home-folder-failed = To nije bilo moguće učiniti s folderom
home-moved-to = „{ $name }“ je premješten u { $folder }
home-moved-out = „{ $name }“ sada nije ni u jednom folderu
home-move-failed = Projekat nije bilo moguće premjestiti

## A map of the projects

home-map-menu = Mapa projekata…
home-map-title = Mapa projekata
home-map-about = Novi projekat, s jednom mapom: folderi kao elementi, a pod svakim folderom projekti u njemu.
home-map-name-default = Projekti
home-map-what = Šta mapa sadrži
home-map-names = Samo nazive
home-map-names-hint = Element za svaki projekat, s njegovim opisom kao tekstom.
home-map-everything = Sa svim što je u njima
home-map-everything-hint = Pod svakim projektom njegove mape, a pod svakom mapom svi njeni elementi, s nazivima i tekstovima.
home-map-note = Citati zadržavaju svoje reference. Uputnica na ilustraciju ili dio u novom projektu ne upućuje ni na šta, a komentari ostaju.
home-map-reading = Čitanje „{ $name }“…
home-map-working = Pravljenje mape…
home-map-make = Napravi mapu
home-map-failed = Mapu projekata nije bilo moguće napraviti

## When there are none yet

home-welcome = Dobro došli u Glaukopis
home-welcome-text = Projekat sadrži rad na jednoj knjizi ili članku: mape vaših ideja, tekstove koje u njih pišete i reference na kojima počivaju.
home-begin = Započni projekat

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
    [one] { $count } izbrisani projekat
    [few] { $count } izbrisana projekta
   *[other] { $count } izbrisanih projekata
}

## The menu of a project

home-menu-rename = Preimenuj…
home-menu-duplicate = Dupliciraj…
home-menu-history = Ranije verzije…

## Naming a project

home-rename-title = Preimenuj projekat
home-duplicate-title = Dupliciraj projekat
home-name = Naziv
home-name-placeholder = Radni naslov knjige ili članka
home-name-missing = Dajte projektu naziv.
home-create = Napravi
home-duplicate = Dupliciraj
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopija
home-failed = To nije uspjelo.

## Deleting a project

home-delete-title = Izbrisati „{ $name }“?
home-delete-message = Projekat se premješta u smeće Glaukopisa, odakle se može vratiti. Vaše reference se ne diraju.
home-delete-owner = Projekat se premješta u smeće Glaukopisa, odakle se može vratiti. Ostaje na serveru i kod onih s kojima ga dijelite; da ga skinete sa servera, prvo ga otvorite i prestanite ga dijeliti.
home-delete-member = Projekat se premješta u smeće Glaukopisa, odakle se može vratiti. Drugi zadržavaju svoje.
home-delete-confirm = Izbriši projekat
home-deleted = „{ $name }“ je premješten u smeće
home-delete-failed = Projekat nije bilo moguće izbrisati

## The trash

home-trash-title = Izbrisani projekti
home-trash-none = Nema ih.
home-deleted-ago = Izbrisan { $ago }
home-restore = Vrati
home-restored = „{ $name }“ je ponovo među projektima
home-restore-failed = Projekat nije bilo moguće vratiti
home-purge = Ukloni zauvijek
home-purge-title = Ukloniti „{ $name }“ zauvijek?
home-purge-message = Ono što projekat sadrži poslije ovoga se ne može vratiti. Vaše reference se ne diraju.
home-purge-failed = Projekat nije bilo moguće ukloniti

## Earlier versions of a project

home-history-title = Ranije verzije
home-history-about = Projekta „{ $name }“. Verzija se otvara kao zaseban projekat; ovaj ostaje kakav jeste.
home-history-none = Još nijedna nije sačuvana. Verzija se čuva s vremena na vrijeme dok radite: gusto za nedavno, rjeđe za staro.
home-history-open = Otvori kopiju
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, od { $day }
home-history-unread = Ranije verzije nije bilo moguće pročitati
home-history-open-failed = Tu verziju nije bilo moguće otvoriti
