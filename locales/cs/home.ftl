# The projects: the list of them, and what is done with them.

home-title = Projekty
home-join = Připojit se ke sdílenému projektu
home-from-document = Projekt z dokumentu…
home-new = Nový projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Co se zobrazuje
home-recent = Naposledy použité
home-all = Všechny projekty
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Zobrazit všech { $count } projektů
    [few] Zobrazit všechny { $count } projekty
   *[other] Zobrazit všech { $count } projektů
}
# The button that opens the menu of the page.
home-page-menu = Další
home-search = Najít projekt
home-search-none = Žádný projekt se tak nejmenuje.
home-list-none = Nejsou žádné projekty.

## Folders of projects

home-new-folder = Nová složka
home-folder-new-inside = Nová složka uvnitř…
home-folder-rename-title = Přejmenovat složku
home-folder-name-placeholder = Co složka obsahuje
home-folder-name-missing = Dejte složce název.
home-folder-projects = { $count ->
    [one] { $count } projekt
    [few] { $count } projekty
   *[other] { $count } projektů
}
home-menu-move = Přesunout do složky
home-menu-out = Mimo složky
home-folder-delete-title = Smazat složku „{ $name }“?
home-folder-delete-message = Složky a projekty v ní zůstanou: přesunou se o úroveň výš, tam, kde byla složka.
home-folder-delete-confirm = Smazat složku
home-folder-failed = To se se složkou nepodařilo
home-moved-to = „{ $name }“ byl přesunut do { $folder }
home-moved-out = „{ $name }“ teď není v žádné složce
home-move-failed = Projekt nelze přesunout

## A map of the projects

home-map-menu = Mapa projektů…
home-map-title = Mapa projektů
home-map-about = Nový projekt s jednou mapou: složky jako prvky a pod každou složkou projekty v ní.
home-map-name-default = Projekty
home-map-what = Co mapa obsahuje
home-map-names = Jen názvy
home-map-names-hint = Prvek pro každý projekt, s jeho popisem jako textem.
home-map-everything = Se vším, co je v nich
home-map-everything-hint = Pod každým projektem jeho mapy a pod každou mapou všechny její prvky, s názvy a texty.
home-map-note = Citace si ponechají své záznamy. Křížový odkaz na vyobrazení nebo část v novém projektu nemíří na nic a komentáře zůstanou, kde byly.
home-map-reading = Čte se „{ $name }“…
home-map-working = Vytváří se mapa…
home-map-make = Vytvořit mapu
home-map-failed = Mapu projektů nelze vytvořit

## When there are none yet

home-welcome = Vítejte v Glaukopis
home-welcome-text = Projekt obsahuje práci na jedné knize nebo článku: mapy vašich myšlenek, texty, které do nich píšete, a záznamy, o něž se opírají.
home-begin = Začít projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = { $count ->
    [one] a { $count } další
    [few] a { $count } další
   *[other] a { $count } dalších
}
home-maps = { $count ->
    [one] { $count } mapa
    [few] { $count } mapy
   *[other] { $count } map
}
home-elements = { $count ->
    [one] { $count } prvek
    [few] { $count } prvky
   *[other] { $count } prvků
}
home-words = { $count ->
    [one] { $count } slovo
    [few] { $count } slova
   *[other] { $count } slov
}
home-references = { $count ->
    [one] { $count } záznam
    [few] { $count } záznamy
   *[other] { $count } záznamů
}
home-not-begun = Nezačato
home-shared = Sdílený
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Změněno { $ago }
# The button that opens the menu of a project.
home-more-for = Další pro { $name }
home-deleted-projects = { $count ->
    [one] { $count } smazaný projekt
    [few] { $count } smazané projekty
   *[other] { $count } smazaných projektů
}

## The menu of a project

home-menu-rename = Přejmenovat…
home-menu-duplicate = Duplikovat…
home-menu-history = Dřívější verze…

## Naming a project

home-rename-title = Přejmenovat projekt
home-duplicate-title = Duplikovat projekt
home-name = Název
home-name-placeholder = Pracovní název knihy nebo článku
home-name-missing = Dejte projektu název.
home-create = Vytvořit
home-duplicate = Duplikovat
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopie
home-failed = To se nepodařilo.

## Deleting a project

home-delete-title = Smazat „{ $name }“?
home-delete-message = Projekt se přesune do koše Glaukopis, odkud ho lze vrátit. Vašich záznamů se to nedotkne.
home-delete-owner = Projekt se přesune do koše Glaukopis, odkud ho lze vrátit. Zůstane na serveru a u těch, s nimiž ho sdílíte; chcete-li ho ze serveru odebrat, nejprve ho otevřete a ukončete sdílení.
home-delete-member = Projekt se přesune do koše Glaukopis, odkud ho lze vrátit. Ostatní si své ponechají.
home-delete-confirm = Smazat projekt
home-deleted = „{ $name }“ byl přesunut do koše
home-delete-failed = Projekt nelze smazat

## The trash

home-trash-title = Smazané projekty
home-trash-none = Žádné nejsou.
home-deleted-ago = Smazáno { $ago }
home-restore = Vrátit
home-restored = „{ $name }“ je zpět mezi projekty
home-restore-failed = Projekt nelze vrátit
home-purge = Odstranit nadobro
home-purge-title = Odstranit „{ $name }“ nadobro?
home-purge-message = Co projekt obsahuje, už potom nebude možné vrátit. Vašich záznamů se to nedotkne.
home-purge-failed = Projekt nelze odstranit

## Earlier versions of a project

home-history-title = Dřívější verze
home-history-about = Projektu „{ $name }“. Verze se otevře jako samostatný projekt; tento zůstane, jak je.
home-history-none = Zatím není žádná uchována. Verze se při práci čas od času uchovává: hustě pro nedávné, řidčeji pro staré.
home-history-open = Otevřít kopii
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, ke dni { $day }
home-history-unread = Dřívější verze nelze přečíst
home-history-open-failed = Tuto verzi nelze otevřít
