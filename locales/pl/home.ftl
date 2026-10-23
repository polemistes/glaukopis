# The projects: the list of them, and what is done with them.

home-title = Projekty
home-join = Dołącz do udostępnionego projektu
home-from-document = Projekt z dokumentu…
home-new = Nowy projekt

## The two forms of the page: the last used projects as cards, all of them as a list

# Under the cards, when there are more projects than they show.
}
# The button that opens the menu of the page.
home-page-menu = Więcej
home-search = Znajdź projekt
home-search-none = Żaden projekt tak się nie nazywa.
home-list-none = Nie ma projektów.

## Folders of projects

home-new-folder = Nowy folder
home-folder-rename-title = Zmień nazwę folderu
home-folder-name-placeholder = Co folder zawiera
home-folder-name-missing = Nadaj folderowi nazwę.
}
home-menu-move = Przenieś do folderu
home-menu-out = Poza foldery
home-folder-delete-title = Usunąć folder „{ $name }”?
home-folder-delete-message = Foldery i projekty w nim pozostają: przechodzą wyżej, tam, gdzie był folder.
home-folder-delete-confirm = Usuń folder
home-folder-failed = Nie udało się tego zrobić z folderem
home-moved-to = „{ $name }” przeniesiono do { $folder }
home-moved-out = „{ $name }” nie jest już w żadnym folderze
home-move-failed = Nie udało się przenieść projektu

## A map of the projects

home-map-menu = Mapa projektów…
home-map-title = Mapa projektów
home-map-about = Nowy projekt z jedną mapą: foldery jako elementy, a pod każdym folderem projekty, które zawiera.
home-map-name-default = Projekty
home-map-what = Co mapa zawiera
home-map-names = Tylko nazwy
home-map-names-hint = Element dla każdego projektu, z jego opisem jako tekstem.
home-map-everything = Ze wszystkim, co w nich jest
home-map-everything-hint = Pod każdym projektem jego mapy, a pod każdą mapą wszystkie jej elementy, z nazwami i tekstami.
home-map-note = Cytowania zachowują swoje pozycje. Odsyłacz do ryciny lub części nie wskazuje w nowym projekcie niczego, a komentarze zostają w starym.
home-map-reading = Czytanie „{ $name }”…
home-map-working = Tworzenie mapy…
home-map-make = Utwórz mapę
home-map-failed = Nie udało się utworzyć mapy projektów

## When there are none yet

home-welcome = Witaj w Glaukopis
home-begin = Zacznij projekt

## A project in the list

# Under the names of the first four maps.
}
}
}
}
}
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
# The button that opens the menu of a project.
home-more-for = Więcej dla { $name }
home-deleted-projects = { $count ->
    [one] { $count } usunięty projekt
    [few] { $count } usunięte projekty
    [many] { $count } usuniętych projektów
   *[other] { $count } usuniętych projektów
}

## The menu of a project

home-menu-rename = Zmień nazwę…
home-menu-duplicate = Powiel…
home-menu-history = Wcześniejsze wersje…

## Naming a project

home-rename-title = Zmień nazwę projektu
home-duplicate-title = Powiel projekt
home-name = Nazwa
home-name-placeholder = Roboczy tytuł książki lub artykułu
home-name-missing = Nadaj projektowi nazwę.
home-create = Utwórz
home-duplicate = Powiel
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopia
home-failed = To się nie udało.

## Deleting a project

home-delete-title = Usunąć „{ $name }”?
home-delete-message = Projekt trafia do kosza Glaukopis, skąd można go przywrócić. Twoje pozycje pozostają nietknięte.
home-delete-owner = Projekt trafia do kosza Glaukopis, skąd można go przywrócić. Pozostaje na serwerze i u tych, którym go udostępniasz; by zdjąć go z serwera, otwórz go i najpierw przestań udostępniać.
home-delete-member = Projekt trafia do kosza Glaukopis, skąd można go przywrócić. Inni zachowują swoje.
home-delete-confirm = Usuń projekt
home-deleted = „{ $name }” przeniesiono do kosza
home-delete-failed = Nie udało się usunąć projektu

## The trash

home-trash-title = Usunięte projekty
home-trash-none = Nie ma żadnych.
home-deleted-ago = Usunięty { $ago }
home-restore = Przywróć
home-restored = „{ $name }” jest z powrotem wśród projektów
home-restore-failed = Nie udało się przywrócić projektu
home-purge = Usuń na dobre
home-purge-title = Usunąć „{ $name }” na dobre?
home-purge-message = Tego, co projekt zawiera, nie da się potem przywrócić. Twoje pozycje pozostają nietknięte.
home-purge-failed = Nie udało się usunąć projektu

## Earlier versions of a project

home-history-title = Wcześniejsze wersje
home-history-about = Projektu „{ $name }”. Wersja otwiera się jako osobny projekt; ten pozostaje, jak jest.
home-history-none = Żadnej jeszcze nie zachowano. Wersja jest zachowywana co jakiś czas w trakcie pracy: gęsto dla tego, co niedawne, rzadziej dla tego, co dawne.
home-history-open = Otwórz kopię
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, stan z { $day }
home-history-unread = Nie udało się odczytać wcześniejszych wersji
home-history-open-failed = Nie udało się otworzyć tej wersji
