# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = wklejony tekst
core-import-files = { $count ->
    [one] { $count } plik
    [few] { $count } pliki
    [many] { $count } plików
   *[other] { $count } plików
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Nie znaleziono pliku „{ $name }”.
core-import-empty-entry = Wiersz { $line }: wpis „{ $key }” jest pusty i został pominięty.
# Where in a file a reference that has no key was found.
core-import-origin-line = wiersz { $line }
core-import-origin-key-line = { $key }, wiersz { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }”
core-import-merge-gone = { $reference }: wpisu, z którym miał być scalony, już nie ma

## PDF files.

core-import-not-a-pdf = { $name } nie jest plikiem PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Dane pochodzą z { $service }.
core-import-number-unknown = W pliku znaleziono numer, ale bazy danych nic o nim nie wiedzą; dane pochodzą z samego pliku i trzeba je sprawdzić.
core-import-databases-failed = Nie udało się zapytać baz danych ({ $error }); dane pochodzą z samego pliku i trzeba je sprawdzić.

## Zotero.

core-import-zotero-my-library = Moja biblioteka
core-import-zotero-group = Grupa { $id }
core-import-zotero-the-library = biblioteka { $id } w Zotero
core-import-zotero-own-library = własna biblioteka użytkownika w Zotero
core-import-zotero-the-collection = kolekcja { $key } w Zotero
core-import-zotero-unknown-base = Nie znaleziono pliku „{ $name }”. Zotero odsyła do niego z folderu, który samo wybrało, a który nie jest tu znany.
core-import-zotero-empty-item = Element { $key } w Zotero jest pusty i został pominięty.
core-import-zotero-alone = { $count ->
    [one] Pominięto { $count } plik lub notatkę, bo w Zotero nie należy do żadnej pozycji.
    [few] Pominięto { $count } pliki i notatki, bo w Zotero nie należą do żadnej pozycji.
    [many] Pominięto { $count } plików i notatek, bo w Zotero nie należą do żadnej pozycji.
   *[other] Pominięto { $count } plików i notatek, bo w Zotero nie należą do żadnej pozycji.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero podaje { $name } jako { $role }, na co BibLaTeX nie ma pola. Nazwisko pominięto.
core-import-zotero-left-out = Pole Zotero „{ $field }” nie ma odpowiednika w BibLaTeX i zostało pominięte: { $value }

## Zotero's database.

core-import-zotero-no-database = baza danych Zotero ({ $file }) w { $path }
core-import-zotero-copying = kopiowanie { $path } do folderu tymczasowego
core-import-zotero-empty = plik jest pusty
core-import-zotero-disturbed = Zotero zapisywało swoją bazę danych w czasie, gdy była czytana. Jeśli czegoś brakuje, zamknij Zotero i importuj ponownie.
core-import-zotero-backup-read = Nie udało się odczytać bazy danych Zotero ({ $error }). Zamiast niej odczytano jej kopię zapasową, { $backup }: brakuje tego, co zmieniono w Zotero po zrobieniu kopii.
core-import-zotero-not-a-database = { $path } nie jest bazą danych Zotero.
core-import-zotero-unreadable = Baza danych Zotero ma postać, której nie da się tu odczytać: { $what }. Jeśli zapisała ją stara wersja Zotero, jednorazowe otwarcie jej w bieżącej wersji ją uaktualni.
core-import-zotero-unreadable-version = Baza danych Zotero ma postać, której nie da się tu odczytać (wersja { $version } bazy Zotero): { $what }. Jeśli zapisała ją stara wersja Zotero, jednorazowe otwarcie jej w bieżącej wersji ją uaktualni.
core-import-zotero-no-table = brakuje tabeli „{ $table }”
core-import-zotero-no-column = tabela „{ $table }” nie ma kolumny „{ $column }”
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Baza danych Zotero nie ma tabeli „{ $table }” w znanej tu postaci: { $consequence }.
core-import-zotero-no-bin = elementów z kosza Zotero nie da się odróżnić od pozostałych
core-import-zotero-no-collections = kolekcje nie zostały odczytane
core-import-zotero-no-attachments = załączone pliki nie zostały odczytane
core-import-zotero-no-notes = notatki nie zostały odczytane
core-import-zotero-no-keywords = słowa kluczowe nie zostały odczytane
core-import-zotero-no-group-names = nazwy bibliotek grupowych nie są znane

## PDF files, as they are read for a reference.

core-import-pdf-empty = Plik „{ $name }” jest pusty.
core-import-pdf-not-a-pdf = Plik „{ $name }” nie jest plikiem PDF.
core-import-pdf-unreadable = Nie udało się odczytać pliku: jest uszkodzony, chroniony hasłem albo za duży.
core-import-pdf-scan = Plik nie ma warstwy tekstowej: to skan.
core-import-pdf-from-file = Dane pochodzą z samego pliku, nie z katalogu, i trzeba je sprawdzić.
core-import-pdf-from-metadata = W pliku nie znaleziono DOI ani ISBN; dane pochodzą z metadanych pliku i trzeba je sprawdzić.
core-import-pdf-unknown = W pliku nie znaleziono DOI ani ISBN, a jego metadane nie mówią, czym jest: dane trzeba uzupełnić.

## Tables, from files of text and of sheets.

core-import-table-too-large = Plik ma { $size } MB. Tabelę czyta się z pliku o wielkości najwyżej { $most } MB.
core-import-table-kinds = Tabele czyta się z plików CSV i innych tekstowych, w których wartości rozdziela przecinek, średnik lub tabulator, oraz z arkuszy LibreOffice (.ods) i Excela (.xlsx, .xls).
core-import-table-empty = W pliku nic nie ma.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tabela ma { $rows } wierszy. Tabela w tekście może mieć najwyżej { $most }: to nie arkusz kalkulacyjny.
core-import-table-columns = Tabela ma { $columns } kolumn. Tabela w tekście może mieć najwyżej { $most }: to nie arkusz kalkulacyjny.
core-import-table-more-than = ponad { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Wczytywanie zostało przerwane.
core-import-pdfs-stopped = Ustalanie, czym są pliki, zostało przerwane. Niczego nie dodano.
core-import-document-kind = „{ $file }” nie jest plikiem, który można wczytać jako dokument. Wczytać można Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst i zwykły tekst.
core-import-document-too-large = „{ $file }” ma więcej niż 50 MB, a tyle nie da się wczytać jako dokumentu.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = Nie udało się odczytać „{ $file }” jako { $kind }. Plik może być uszkodzony albo innego rodzaju, niż mówi jego nazwa. Pandoc, który go czyta, powiedział: { $message }
core-import-document-pandoc-unreadable = nie udało się odczytać tego, co Pandoc zrobił z „{ $file }”: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Bez tytułu
core-import-document-plain-text = zwykły tekst
core-import-document-notebook = notatnik Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Znaleziono { $count } cytowanie, które nie jest jeszcze powiązane z pozycją z twojej biblioteki; zrobił je program zarządzający bibliografią. Stoi jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
       *[none] Znaleziono { $count } cytowanie, które nie jest jeszcze powiązane z pozycją z twojej biblioteki. Stoi jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
    }
    [few] { $made ->
        [all] Znaleziono { $count } cytowania, które nie są jeszcze powiązane z pozycjami z twojej biblioteki; wszystkie zrobił program zarządzający bibliografią. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
        [some] Znaleziono { $count } cytowania, które nie są jeszcze powiązane z pozycjami z twojej biblioteki; { $some } z nich zrobił program zarządzający bibliografią. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
       *[none] Znaleziono { $count } cytowania, które nie są jeszcze powiązane z pozycjami z twojej biblioteki. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
    }
    [many] { $made ->
        [all] Znaleziono { $count } cytowań, które nie są jeszcze powiązane z pozycjami z twojej biblioteki; wszystkie zrobił program zarządzający bibliografią. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
        [some] Znaleziono { $count } cytowań, które nie są jeszcze powiązane z pozycjami z twojej biblioteki; { $some } z nich zrobił program zarządzający bibliografią. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
       *[none] Znaleziono { $count } cytowań, które nie są jeszcze powiązane z pozycjami z twojej biblioteki. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
    }
   *[other] { $made ->
        [all] Znaleziono { $count } cytowań, które nie są jeszcze powiązane z pozycjami z twojej biblioteki; wszystkie zrobił program zarządzający bibliografią. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
        [some] Znaleziono { $count } cytowań, które nie są jeszcze powiązane z pozycjami z twojej biblioteki; { $some } z nich zrobił program zarządzający bibliografią. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
       *[none] Znaleziono { $count } cytowań, które nie są jeszcze powiązane z pozycjami z twojej biblioteki. Stoją jako tekst, którym je zapisano, i można je przejrzeć, gdy mapa powstanie, a także później.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } cytowanie zrobione przez EndNote wczytano jako tekst, który pokazuje, i nie ma go wśród znalezionych: nie udało się odczytać tego, co EndNote mówi o dziełach.
    [few] { $count } cytowania zrobione przez EndNote wczytano jako tekst, który pokazują, i nie ma ich wśród znalezionych: nie udało się odczytać tego, co EndNote mówi o dziełach.
    [many] { $count } cytowań zrobionych przez EndNote wczytano jako tekst, który pokazują, i nie ma ich wśród znalezionych: nie udało się odczytać tego, co EndNote mówi o dziełach.
   *[other] { $count } cytowań zrobionych przez EndNote wczytano jako tekst, który pokazują, i nie ma ich wśród znalezionych: nie udało się odczytać tego, co EndNote mówi o dziełach.
}
core-import-document-bookmarks = { $count ->
    [one] Dokument trzyma { $count } cytowanie w zakładce, a tego, co cytuje, nie udało się odczytać: jest tekstem, jak stoi. Zotero trzyma je tak, gdy tak każą jego ustawienia dokumentu.
    [few] Dokument trzyma { $count } cytowania w zakładkach, a tego, co cytują, nie udało się odczytać: są tekstem, jak stoją. Zotero trzyma je tak, gdy tak każą jego ustawienia dokumentu.
    [many] Dokument trzyma { $count } cytowań w zakładkach, a tego, co cytują, nie udało się odczytać: są tekstem, jak stoją. Zotero trzyma je tak, gdy tak każą jego ustawienia dokumentu.
   *[other] Dokument trzyma { $count } cytowań w zakładkach, a tego, co cytują, nie udało się odczytać: są tekstem, jak stoją. Zotero trzyma je tak, gdy tak każą jego ustawienia dokumentu.
}
core-import-document-bibliography = Dokument ma spis tego, co cytuje, pod nagłówkiem „{ $heading }”. Wczytano go jako tekst, jak resztę. Mapa sama tworzy bibliografię z tego, co się w niej cytuje.
core-import-document-bibliography-made = Dokument ma spis tego, co cytuje, zrobiony przez program zarządzający jego bibliografią. Wczytano go jako tekst, jak resztę. Mapa sama tworzy bibliografię z tego, co się w niej cytuje.
core-import-document-tracked = Dokument ma śledzone zmiany. Tekst wczytano w postaci, jaką ma po przyjęciu ich wszystkich.
core-import-document-comments = Dokument ma komentarze na marginesie; pominięto je.
core-import-document-heading-notes = { $count ->
    [one] Przypis do nagłówka stoi na początku tekstu pod nim: nagłówek nie może mieć przypisu.
    [few] { $count } przypisy do nagłówków stoją na początku tekstu pod nimi: nagłówek nie może mieć przypisu.
    [many] { $count } przypisów do nagłówków stoi na początku tekstu pod nimi: nagłówek nie może mieć przypisu.
   *[other] { $count } przypisów do nagłówków stoi na początku tekstu pod nimi: nagłówek nie może mieć przypisu.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } podpis zaczynał się od słowa i numeru, jak „{ $first }”. Pominięto go: mapa sama numeruje swoje ryciny i tabele. Tam, gdzie tekst wymienia którąś z nich po numerze, jest to tekst, jak go zapisano, i nie podąża za numeracją mapy.
    [few] { $count } podpisy zaczynały się od słowa i numeru, jak „{ $first }”. Pominięto je: mapa sama numeruje swoje ryciny i tabele. Tam, gdzie tekst wymienia którąś z nich po numerze, jest to tekst, jak go zapisano, i nie podąża za numeracją mapy.
    [many] { $count } podpisów zaczynało się od słowa i numeru, jak „{ $first }”. Pominięto je: mapa sama numeruje swoje ryciny i tabele. Tam, gdzie tekst wymienia którąś z nich po numerze, jest to tekst, jak go zapisano, i nie podąża za numeracją mapy.
   *[other] { $count } podpisów zaczynało się od słowa i numeru, jak „{ $first }”. Pominięto je: mapa sama numeruje swoje ryciny i tabele. Tam, gdzie tekst wymienia którąś z nich po numerze, jest to tekst, jak go zapisano, i nie podąża za numeracją mapy.
}
core-import-document-label-example = Ryc. 1.
core-import-document-caption-notes = { $count ->
    [one] Przypis w opisie ryciny lub tabeli stoi tam w nawiasie.
    [few] { $count } przypisy w opisach rycin lub tabel stoją tam w nawiasach.
    [many] { $count } przypisów w opisach rycin lub tabel stoi tam w nawiasach.
   *[other] { $count } przypisów w opisach rycin lub tabel stoi tam w nawiasach.
}
core-import-document-headings = { $count ->
    [one] { $count } nagłówek w cytacie, liście lub tabeli wczytano jako akapit pogrubiony.
    [few] { $count } nagłówki w cytatach, listach lub tabelach wczytano jako akapity pogrubione.
    [many] { $count } nagłówków w cytatach, listach lub tabelach wczytano jako akapity pogrubione.
   *[other] { $count } nagłówków w cytatach, listach lub tabelach wczytano jako akapity pogrubione.
}
core-import-document-code = { $count ->
    [one] { $count } blok kodu wczytano jako zwykłe akapity, po jednym na wiersz.
    [few] { $count } bloki kodu wczytano jako zwykłe akapity, po jednym na wiersz.
    [many] { $count } bloków kodu wczytano jako zwykłe akapity, po jednym na wiersz.
   *[other] { $count } bloków kodu wczytano jako zwykłe akapity, po jednym na wiersz.
}
core-import-document-definitions = { $count ->
    [one] { $count } listę terminów z ich znaczeniami wczytano jako akapity, z terminami pogrubionymi.
    [few] { $count } listy terminów z ich znaczeniami wczytano jako akapity, z terminami pogrubionymi.
    [many] { $count } list terminów z ich znaczeniami wczytano jako akapity, z terminami pogrubionymi.
   *[other] { $count } list terminów z ich znaczeniami wczytano jako akapity, z terminami pogrubionymi.
}
core-import-document-rules = { $count ->
    [one] { $count } linię w poprzek strony pominięto.
    [few] { $count } linie w poprzek strony pominięto.
    [many] { $count } linii w poprzek strony pominięto.
   *[other] { $count } linii w poprzek strony pominięto.
}
core-import-document-raw = { $count ->
    [one] { $count } fragment napisany w HTML lub TeX-u tylko dla jednego rodzaju dokumentu pominięto.
    [few] { $count } fragmenty napisane w HTML lub TeX-u tylko dla jednego rodzaju dokumentu pominięto.
    [many] { $count } fragmentów napisanych w HTML lub TeX-u tylko dla jednego rodzaju dokumentu pominięto.
   *[other] { $count } fragmentów napisanych w HTML lub TeX-u tylko dla jednego rodzaju dokumentu pominięto.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } obraz z pliku nie stoi w odczytanym tekście i został pominięty. Może stać w nagłówku lub stopce stron albo w rysunku.
    [few] { $count } obrazy z pliku nie stoją w odczytanym tekście i zostały pominięte. Mogą stać w nagłówku lub stopce stron albo w rysunku.
    [many] { $count } obrazów z pliku nie stoi w odczytanym tekście i zostało pominiętych. Mogą stać w nagłówku lub stopce stron albo w rysunku.
   *[other] { $count } obrazów z pliku nie stoi w odczytanym tekście i zostało pominiętych. Mogą stać w nagłówku lub stopce stron albo w rysunku.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Obraz „{ $name }” pominięto: { $why }.
core-import-document-picture-kind = jest rodzaju, którego się nie czyta ({ $kind })
core-import-document-picture-not-read = nie jest obrazem rodzaju, który się czyta
core-import-document-picture-unreadable = nie udało się go odczytać
core-import-document-picture-network = jest w sieci, a stamtąd niczego się nie pobiera
core-import-document-picture-not-taken-out = nie udało się go wydobyć z pliku
core-import-document-picture-outside = nie jest w pliku, lecz gdzie indziej na tym komputerze, a stamtąd się go nie bierze
core-import-document-picture-not-found = nie znaleziono pliku tam, gdzie wskazuje dokument
core-import-document-picture-too-large = ma więcej niż 50 MB
core-import-document-picture-file-unreadable = nie udało się odczytać pliku
