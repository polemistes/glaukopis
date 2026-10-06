# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Dokument do wczytania
documents-filter = Dokumenty
documents-filter-all = Wszystkie pliki
documents-title-map = Mapa z dokumentu
documents-title-project = Projekt z dokumentu
documents-reading = Czytanie { $file }…
documents-reading-hint = Długi dokument zajmuje chwilę.
documents-no-pandoc = Dokumenty tego rodzaju czyta Pandoc, który nie jest zainstalowany lub nie został znaleziony. Gdzie jest, można podać w ustawieniach.
documents-unread = Nie udało się odczytać pliku.
documents-title = Tytuł
documents-title-hint-map = Nazwa mapy i elementu w jej środku.
documents-title-hint-project = Nazwa projektu, jego mapy i elementu w środku mapy.
# What a project made of a document is called when the document has no title.
documents-untitled = Bez tytułu

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Część
    [few] Części
    [many] Części
   *[other] Części
}
documents-words = { $count ->
    [one] Słowo
    [few] Słowa
    [many] Słów
   *[other] Słów
}
documents-notes = { $count ->
    [one] Przypis
    [few] Przypisy
    [many] Przypisów
   *[other] Przypisów
}
documents-figures = { $count ->
    [one] Rycina
    [few] Ryciny
    [many] Rycin
   *[other] Rycin
}
documents-tables = { $count ->
    [one] Tabela
    [few] Tabele
    [many] Tabel
   *[other] Tabel
}
documents-equations = { $count ->
    [one] Równanie
    [few] Równania
    [many] Równań
   *[other] Równań
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Dzieła z twojej biblioteki są cytowane { $cited ->
        [1] raz
        [2] dwa razy
       *[other] { $cited } razy
    }.
documents-cited-not-in-library = Dzieła, których nie ma w twojej bibliotece, są cytowane { $missing ->
        [1] raz
        [2] dwa razy
       *[other] { $missing } razy
    }.
documents-cited-both = Dzieła z twojej biblioteki są cytowane { $cited ->
        [1] raz
        [2] dwa razy
       *[other] { $cited } razy
    }, dzieła spoza niej { $missing ->
        [1] raz
        [2] dwa razy
       *[other] { $missing } razy
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Znaleziono jedno cytowanie.
    [few] Znaleziono { $count } cytowania.
    [many] Znaleziono { $count } cytowań.
   *[other] Znaleziono { $count } cytowań.
}
documents-found-made = { $count ->
    [one] Znaleziono jedno cytowanie, zrobione przez program zarządzający bibliografią.
    [few] Znaleziono { $count } cytowania, wszystkie zrobione przez program zarządzający bibliografią.
    [many] Znaleziono { $count } cytowań, wszystkie zrobione przez program zarządzający bibliografią.
   *[other] Znaleziono { $count } cytowań, wszystkie zrobione przez program zarządzający bibliografią.
}
documents-found-some-made = { $count ->
    [one] Znaleziono { $count } cytowanie, { $made } z nich zrobił program zarządzający bibliografią.
    [few] Znaleziono { $count } cytowania, { $made } z nich zrobił program zarządzający bibliografią.
    [many] Znaleziono { $count } cytowań, { $made } z nich zrobił program zarządzający bibliografią.
   *[other] Znaleziono { $count } cytowań, { $made } z nich zrobił program zarządzający bibliografią.
}
documents-at-once = Od razu zrób cytowania z tych, które Zotero zrobiło z dzieł, jakie ma twoja biblioteka
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Przypis, który jest tylko cytowaniem, staje się cytowaniem w wierszu, a styl cytowania składa je w przypisie lub w wierszu; przypis, który mówi więcej, zachowuje swoje cytowanie. To, co wybrano dla przypisów w panelu znalezionych cytowań, dla wszystkich kolejnych, obowiązuje i tutaj.
documents-go-through-map = Przejrzyj cytowania, gdy mapa powstanie
documents-go-through-project = Przejrzyj cytowania, gdy projekt powstanie

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Warto wiedzieć
documents-making = Tworzenie mapy…
documents-make-map = Utwórz mapę
documents-make-project = Utwórz projekt
documents-map-failed = Nie udało się utworzyć mapy.
