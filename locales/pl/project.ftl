# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Nie udało się odczytać projektów

## The view of a project

project-open-failed = Nie udało się otworzyć projektu
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Nie udało się otworzyć projektu.
project-back = Wróć do projektów
project-fetching = Pobieranie projektu
project-fetching-offline = Nie można połączyć się z serwerem. Projekt zostanie pobrany, gdy będzie można.
project-fetching-on-the-way = Jest w drodze z serwera.
project-all-projects = Wszystkie projekty
project-name = Nazwa projektu
project-rename = Zmień nazwę projektu
project-not-saved = Niezapisane
project-redo = Ponów
project-view = Widok mapy
project-view-this = Widok tej mapy
project-diagram = Diagram
project-text = Tekst
project-one-at-a-time = Po jednej
project-side-by-side = Dwie obok siebie
project-close-side = Zamknij tę stronę
project-references = Pozycje
project-pictures = Obrazy
project-side = Pozycje, obrazy, historia i zmiany
project-side-tabs = Co pokazuje panel boczny
project-side-map = Mapa
project-preview = Podgląd i eksport
project-share = Udostępnij
project-shared = Udostępniony
project-shared-offline = Udostępniony · nie można połączyć się z serwerem
project-shared-too-large = Udostępniony · serwer nie przyjmuje ostatnich zmian
project-between-maps = Między dwiema mapami
project-between-preview = Między mapą a podglądem
project-between-pictures = Między mapą a obrazami
project-between-references = Między mapą a pozycjami

## When the sharing ends from the other side

project-unshared = Projekt nie jest już udostępniony
project-unshared-this = Ten projekt nie jest już udostępniony
project-left-out = Nie jesteś już wśród współpracowników
project-unshared-unfetched = Nie został pobrany, więc na tym komputerze nie ma z niego nic.
project-unshared-kept = Ten, kto go udostępniał, zdjął go z serwera. Zachowujesz projekt w obecnym stanie i możesz dalej pracować nad nim na własną rękę.
project-left-out-kept = Zachowujesz projekt w obecnym stanie i możesz dalej pracować nad nim na własną rękę. To, co inni napiszą od tej chwili, do ciebie nie dociera.
project-understood = Rozumiem

## Files dropped on the project

project-drop-picture = Upuść obraz na element, do którego należy
project-cited-in = { $count ->
    [one] Pozycja jest cytowana w „{ $name }”
    [few] { $count } pozycje są cytowane w „{ $name }”
    [many] { $count } pozycji jest cytowanych w „{ $name }”
   *[other] { $count } pozycji jest cytowanych w „{ $name }”
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Pozycja jest cytowana w tym elemencie
    [few] { $count } pozycje są cytowane w tym elemencie
    [many] { $count } pozycji jest cytowanych w tym elemencie
   *[other] { $count } pozycji jest cytowanych w tym elemencie
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Bez tytułu
# The name of a copy of a map.
project-map-copy = { $name }, kopia
project-maps = Mapy
project-map-name = Nazwa mapy
project-new-map = Nowa mapa
project-map-from-document = Mapa z dokumentu…
project-drop-on-map = Upuść na mapę, by tam przenieść · przytrzymaj Ctrl, by skopiować
project-duplicate = Powiel
project-duplicate-hint = Kopia do pracy; ta pozostaje, jak jest
project-open-beside = Otwórz obok
project-open-beside-hint = Dwie mapy obok siebie, by przenosić elementy między nimi
project-this-map-actions = Ta mapa i mapy
project-maps-hint = Mapy projektu: wybierz jedną, by ją otworzyć
project-map-beside = obok tej
project-side-by-side-short = Obok siebie
project-preview-short = Podgląd
project-found = Znalezione cytowania…
# The count is of those found in the map.
project-found-hint = { $count ->
    [one] { $count } do przejrzenia i zrobienia z niego cytowania
    [few] { $count } do przejrzenia i zrobienia z nich cytowań
    [many] { $count } do przejrzenia i zrobienia z nich cytowań
   *[other] { $count } do przejrzenia i zrobienia z nich cytowań
}
project-found-none = Oraz tekst, który wygląda jak cytowania
project-delete-map = Usuń mapę
project-delete-map-title = Usunąć mapę „{ $name }”?
project-delete-map-message = { $count ->
    [one] Zniknie { $count } element i tekst w nim. Można to cofnąć, póki projekt jest otwarty.
    [few] Znikną { $count } elementy i tekst w nich. Można to cofnąć, póki projekt jest otwarty.
    [many] Zniknie { $count } elementów i tekst w nich. Można to cofnąć, póki projekt jest otwarty.
   *[other] Zniknie { $count } elementów i tekst w nich. Można to cofnąć, póki projekt jest otwarty.
}
project-copied-to = Skopiowano do „{ $name }”
project-moved-to = Przeniesiono do „{ $name }”

## What is done to elements, in the diagram and in the text

project-add-under = Dodaj element pod nim
project-add = Dodaj element
project-add-after = Dodaj element po nim
project-write-text = Pisz jego tekst
project-double-click = Dwuklik
project-associate = Powiąż z…
project-associate-hint = Potem kliknij drugi element
project-heading = Drukuj nazwę jako nagłówek
project-heading-hint = Wyłączone: nazwa jest etykietą dla ciebie; drukuje się tylko tekst
project-leave-out = Pomiń w dokumencie
project-leave-out-hint = Ze wszystkim, co pod nim
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Zastępuje „{ $name }”
project-stand-for = Zastępuj inną mapę
project-stand-for-heading = W dokumencie jego miejsce zajmuje ta mapa
project-stand-for-none = Żadna
project-copy-to-map = Kopiuj do mapy
project-copy = Kopiuj
# Pasting what was copied under the element the menu is of.
project-paste-under = Wklej pod nim
project-move-to-map = Przenieś do mapy
project-map-from-branch = Nowa mapa z tej gałęzi
project-map-from-branch-hint = Kopia do pracy; ta pozostaje
project-detach = Odłącz od elementu nadrzędnego
project-detach-hint = Luźny element, do umieszczenia później
project-tidy-branch = Uporządkuj tę gałąź
project-place-automatically = Umieść automatycznie
project-delete-keeping = Usuń, zachowując to, co pod nim
project-centre-stays = Środek mapy zostaje
project-centre-stays-detail = Samą mapę usuń z jej zakładki.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] Usunięto „{ $name }”
    [one] Usunięto „{ $name }” z { $under } elementem pod nim
    [few] Usunięto „{ $name }” z { $under } elementami pod nim
    [many] Usunięto „{ $name }” z { $under } elementami pod nim
   *[other] Usunięto „{ $name }” z { $under } elementami pod nim
}
project-deleted-many = { $count ->
    [one] Usunięto { $count } element
    [few] Usunięto { $count } elementy
    [many] Usunięto { $count } elementów
   *[other] Usunięto { $count } elementów
}

project-delete-busy-title = Ktoś tu pisze
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] pracuje
    [few] pracują
    [many] pracują
   *[other] pracują
} w tym, co zostałoby usunięte. To, co jest tam teraz pisane, przepadłoby razem z tym i nie dałoby się tego przywrócić.
project-delete-busy-confirm = Mimo to usuń

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Nazwa
project-write-here = Pisz tutaj. Wpisz @, by cytować.
project-words = { $count ->
    [one] { $count } słowo
    [few] { $count } słowa
    [many] { $count } słów
   *[other] { $count } słów
}
project-read-on = Dwuklik, by czytać dalej
project-stands-for-map = Zastępuje mapę „{ $name }”
project-name-not-printed = Nazwa nie jest drukowana
project-left-out-of-document = Pominięty w dokumencie

## The panels at the side: the references and the pictures

project-this-map = Ta mapa
project-project = Projekt
project-library = Biblioteka
project-nothing-found = Nic nie znaleziono
project-edit-reference = Edytuj pozycję…
project-new-reference = Nowa pozycja
project-import-file = Importuj plik
project-which-references = Które pozycje
project-search-references = Szukaj pozycji
project-library-empty = Twoja biblioteka jest pusta
project-library-empty-hint = Dodaj pozycję albo importuj te, które masz.
project-no-references = Nie ma jeszcze pozycji
project-no-references-hint = To, co cytujesz podczas pisania, jest tu wymienione. By cytować, wybierz Cytuj nad tekstem albo wpisz @.
project-cited-in-heading = Cytowana w
project-not-cited = Niecytowana w tym projekcie.
project-references-drag = Przeciągnij pozycję do tekstu, by ją tam zacytować, albo na element, by zacytować ją na końcu jego tekstu.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] W twojej bibliotece brakuje { $count } z tego projektu.
    [few] W twojej bibliotece brakuje { $count } z tego projektu.
    [many] W twojej bibliotece brakuje { $count } z tego projektu.
   *[other] W twojej bibliotece brakuje { $count } z tego projektu.
}
# The store of pictures.
project-store = Zbiór
project-open-picture = Otwórz…
project-put-into-text = Wstaw do tekstu
project-add-pictures = Dodaj obrazy z plików
project-which-pictures = Które obrazy
project-search-pictures = Szukaj obrazów
project-a-picture = Obraz
project-with-notes = Z notatkami
project-not-on-computer = Nie ma na tym komputerze
project-nothing-said = Nic jeszcze o nim nie powiedziano
project-store-empty = Zbiór jest pusty
project-store-empty-hint = Dodaj obrazy z plików albo upuść je na tekst.
project-no-pictures = Nie ma jeszcze obrazów
project-no-pictures-map = Obrazy rycin tej mapy są tu wymienione. Te ze zbioru są pod Zbiór.
project-no-pictures-project = Obrazy rycin projektu są tu wymienione. Te ze zbioru są pod Zbiór.
project-pictures-drag = Przeciągnij obraz do tekstu, by zrobić tam z niego rycinę, albo na element, by wstawić go na końcu jego tekstu.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] Na tym komputerze brakuje { $count } z tej mapy.
    [few] Na tym komputerze brakuje { $count } z tej mapy.
    [many] Na tym komputerze brakuje { $count } z tej mapy.
   *[other] Na tym komputerze brakuje { $count } z tej mapy.
}
project-pictures-absent-project = { $count ->
    [one] Na tym komputerze brakuje { $count } z tego projektu.
    [few] Na tym komputerze brakuje { $count } z tego projektu.
    [many] Na tym komputerze brakuje { $count } z tego projektu.
   *[other] Na tym komputerze brakuje { $count } z tego projektu.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
    [few] { $count } elementy
    [many] { $count } elementów
   *[other] { $count } elementów
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } jest tutaj
project-link-placeholder = Jak są powiązane
project-link-label = Etykieta powiązania

## A copy and its original, in another map.
copy-title = Kopia i jej oryginał
copy-from = Skopiowano z „{ $name }” w mapie „{ $map }”
copy-original-changed = Oryginał zmienił się od skopiowania albo od chwili, gdy ostatnio to oglądano.
copy-original-same = Oryginał jest taki, jaki był przy kopiowaniu.
copy-original-unknown = Nie wiadomo, czy oryginał zmienił się od skopiowania: kopia powstała, zanim zaczęto to zapisywać.
copy-original-gone = Oryginału już nie ma.
copy-how-shown = Poniżej przekreślone jest to, co ma tylko oryginał, a oznaczone to, co ma tylko ta kopia.
copy-alike = Ich nazwy i teksty są takie same. Mogą się różnić tym, co nie jest słowami: cytowaniami, obrazami, wyróżnieniami.
copy-only-original = Tylko w oryginale
copy-only-copy = Tylko w tej kopii
copy-go = Przejdź do oryginału
copy-seen = Zachowaj tę kopię, jak jest
copy-take = Weź nazwę i tekst oryginału
copy-changed-mark = Oryginał zmienił się od skopiowania
copy-compare = Porównaj z oryginałem…
copy-copied-from = Skopiowano z „{ $name }” w „{ $map }”
copy-copied-from-changed = Skopiowano z „{ $name }” w „{ $map }”, który się od tego czasu zmienił

## How far the writing of an element has come, as its writer says.
status = Stan
status-idea = Pomysł
status-draft = Szkic
status-done = Gotowe
status-none = Bez stanu
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } słowo
    [few] { $count } słowa
    [many] { $count } słów
   *[other] { $count } słów
}
status-count-idea = { $count ->
    [one] { $count } pomysł
    [few] { $count } pomysły
    [many] { $count } pomysłów
   *[other] { $count } pomysłów
}
status-count-draft = { $count ->
    [one] { $count } szkic
    [few] { $count } szkice
    [many] { $count } szkiców
   *[other] { $count } szkiców
}
status-count-done = { $count ->
    [one] { $count } gotowy
    [few] { $count } gotowe
    [many] { $count } gotowych
   *[other] { $count } gotowych
}
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } słowo napisane
    [few] { $count } słowa napisane
    [many] { $count } słów napisanych
   *[other] { $count } słów napisanych
}
status-progress = Jak daleko zaszła mapa
