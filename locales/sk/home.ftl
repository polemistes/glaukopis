# The projects: the list of them, and what is done with them.

home-title = Projekty
home-join = Pripojiť sa k zdieľanému projektu
home-from-document = Projekt z dokumentu…
home-new = Nový projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Čo sa zobrazuje
home-recent = Naposledy použité
home-all = Všetky projekty
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Zobraziť { $count } projekt
    [few] Zobraziť všetky { $count } projekty
   *[other] Zobraziť všetkých { $count } projektov
}
# The button that opens the menu of the page.
home-page-menu = Viac
home-search = Nájsť projekt
home-search-none = Žiadny projekt sa tak nevolá.
home-list-none = Nie sú žiadne projekty.

## Folders of projects

home-new-folder = Nový priečinok
home-folder-new-inside = Nový priečinok vnútri…
home-folder-rename-title = Premenovať priečinok
home-folder-name-placeholder = Čo priečinok obsahuje
home-folder-name-missing = Dajte priečinku názov.
home-folder-projects = { $count ->
    [one] { $count } projekt
    [few] { $count } projekty
   *[other] { $count } projektov
}
home-menu-move = Presunúť do priečinka
home-menu-out = Von z priečinkov
home-folder-delete-title = Odstrániť priečinok „{ $name }“?
home-folder-delete-message = Priečinky a projekty v ňom ostanú: presunú sa vyššie, tam, kde bol priečinok.
home-folder-delete-confirm = Odstrániť priečinok
home-folder-failed = S priečinkom sa to nepodarilo
home-moved-to = „{ $name }“ bol presunutý do { $folder }
home-moved-out = „{ $name }“ teraz nie je v žiadnom priečinku
home-move-failed = Projekt sa nepodarilo presunúť

## A map of the projects

home-map-menu = Mapa projektov…
home-map-title = Mapa projektov
home-map-about = Nový projekt s jednou mapou: priečinky ako prvky a pod každým priečinkom projekty v ňom.
home-map-name-default = Projekty
home-map-what = Čo mapa obsahuje
home-map-names = Len názvy
home-map-names-hint = Prvok pre každý projekt, s jeho opisom ako textom.
home-map-everything = So všetkým, čo je v nich
home-map-everything-hint = Pod každým projektom jeho mapy a pod každou mapou všetky jej prvky s ich názvami a textami.
home-map-note = Citácie si zachovajú svoje záznamy. Odkaz na vyobrazenie alebo časť v novom projekte na nič neukazuje a komentáre ostanú tam, kde boli.
home-map-reading = Číta sa „{ $name }“…
home-map-working = Vytvára sa mapa…
home-map-make = Vytvoriť mapu
home-map-failed = Mapu projektov sa nepodarilo vytvoriť

## When there are none yet

home-welcome = Vitajte v Glaukopise
home-welcome-text = Projekt obsahuje prácu na jednej knihe alebo článku: mapy vašich myšlienok, texty, ktoré do nich píšete, a záznamy, o ktoré sa opierajú.
home-begin = Začať projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = { $count ->
    [one] a ešte { $count } ďalšia
    [few] a ešte { $count } ďalšie
   *[other] a ešte { $count } ďalších
}
home-maps = { $count ->
    [one] { $count } mapa
    [few] { $count } mapy
   *[other] { $count } máp
}
home-elements = { $count ->
    [one] { $count } prvok
    [few] { $count } prvky
   *[other] { $count } prvkov
}
home-words = { $count ->
    [one] { $count } slovo
    [few] { $count } slová
   *[other] { $count } slov
}
home-references = { $count ->
    [one] { $count } záznam
    [few] { $count } záznamy
   *[other] { $count } záznamov
}
home-not-begun = Nezačatý
home-shared = Zdieľaný
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Zmenený { $ago }
# The button that opens the menu of a project.
home-more-for = Viac pre { $name }
home-deleted-projects = { $count ->
    [one] { $count } odstránený projekt
    [few] { $count } odstránené projekty
   *[other] { $count } odstránených projektov
}

## The menu of a project

home-menu-rename = Premenovať…
home-menu-duplicate = Duplikovať…
home-menu-history = Staršie verzie…

## Naming a project

home-rename-title = Premenovať projekt
home-duplicate-title = Duplikovať projekt
home-name = Názov
home-name-placeholder = Pracovný názov knihy alebo článku
home-name-missing = Dajte projektu názov.
home-create = Vytvoriť
home-duplicate = Duplikovať
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kópia
home-failed = Nepodarilo sa to.

## Deleting a project

home-delete-title = Odstrániť „{ $name }“?
home-delete-message = Projekt sa presunie do koša Glaukopisu, odkiaľ ho možno vrátiť. Vaše záznamy to nijako nezasiahne.
home-delete-owner = Projekt sa presunie do koša Glaukopisu, odkiaľ ho možno vrátiť. Ostane na serveri a u tých, s ktorými ho zdieľate; ak ho chcete zo servera odstrániť, najprv ho otvorte a prestaňte ho zdieľať.
home-delete-member = Projekt sa presunie do koša Glaukopisu, odkiaľ ho možno vrátiť. Ostatní si svoj ponechajú.
home-delete-confirm = Odstrániť projekt
home-deleted = „{ $name }“ bol presunutý do koša
home-delete-failed = Projekt sa nepodarilo odstrániť

## The trash

home-trash-title = Odstránené projekty
home-trash-none = Žiadne nie sú.
home-deleted-ago = Odstránený { $ago }
home-restore = Vrátiť
home-restored = „{ $name }“ je späť medzi projektmi
home-restore-failed = Projekt sa nepodarilo vrátiť
home-purge = Odstrániť natrvalo
home-purge-title = Odstrániť „{ $name }“ natrvalo?
home-purge-message = Čo projekt obsahuje, sa potom už nedá vrátiť. Vaše záznamy to nijako nezasiahne.
home-purge-failed = Projekt sa nepodarilo odstrániť

## Earlier versions of a project

home-history-title = Staršie verzie
home-history-about = Projektu „{ $name }“. Verzia sa otvorí ako samostatný projekt; tento ostane, ako je.
home-history-none = Zatiaľ sa žiadna neuchovala. Verzia sa uchováva z času na čas, kým pracujete: husto pre nedávne, redšie pre staré.
home-history-open = Otvoriť kópiu
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, k { $day }
home-history-unread = Staršie verzie sa nepodarilo prečítať
home-history-open-failed = Tú verziu sa nepodarilo otvoriť
