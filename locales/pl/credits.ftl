# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Podziękowania i licencje…
credits-title = Podziękowania i licencje
credits-own-licence = Glaukopis jest wolnym oprogramowaniem na licencji GNU General Public License w wersji 3 lub późniejszej (GPL-3.0-or-later). Powstał dzięki pracy projektów wymienionych niżej, na warunkach ich licencji.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Autorzy: { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Otwiera { $url }

## The groups

credits-group-built-on = Na czym jest zbudowany
credits-group-copied = Kod włączony do Glaukopis
credits-group-fonts = Czcionki
credits-group-data = Style, słowniki i inne dane
credits-group-programs = Programy, z którymi współpracuje, gdy są zainstalowane
credits-group-icons = Ikony
credits-group-owl = Sowa
credits-group-lookup = Skąd pobiera się dane pozycji
credits-lookup-about = DOI w doi.org, Crossref i DataCite; książki w katalogach K10plus, norweskich bibliotek naukowych, Deutsche Nationalbibliothek i Library of Congress; preprinty w arXiv; literatura medyczna w PubMed. Wysyła się do nich tylko to, co wpiszesz przy pobieraniu danych.

## What each is to Glaukopis

credits-what-tauri = Rama aplikacji: jej okno i połączenie między interfejsem a resztą.
credits-what-tauri-plugins = Okna wyboru plików i folderów oraz otwieranie plików i adresów w innych programach.
credits-what-webkitgtk = Silnik stron WWW, w którym w Linuksie wyświetla się interfejs. Jest częścią systemu, nie Glaukopis.
credits-what-gtk = To, co w Linuksie dzieje się z oknem i stroną, na potrzeby dziennika.
credits-what-svelte = W nim napisano interfejs.
credits-what-prosemirror = Edytor tekstów.
credits-what-yjs = Przechowuje projekty tak, by zmiany dało się cofać i dzielić się nimi z innymi na bieżąco.
credits-what-y-prosemirror = Łączy edytor tekstów z tym, co przechowuje projekt.
credits-what-y-protocols = Droga, którą zmiany udostępnionego projektu idą na serwer i z serwera.
credits-what-lib0 = Drobne narzędzia, z których zbudowano Yjs i którymi interfejs zapisuje to, co wysyła na serwer.
credits-what-yrs = Przechowuje udostępnione projekty na serwerze dołączonym do Glaukopis.
credits-what-fractional-indexing = Utrzymuje kolejność elementów i rodzajów, gdy kilka osób przesuwa je naraz.
credits-what-fluent-js = Słowa interfejsu, w każdym języku.
credits-what-fluent-rs = Słowa rdzenia, w każdym języku, i sprawdzanie własnych słów.
credits-what-pluralrules = Która forma słowa idzie w parze z liczbą, w każdym języku.
credits-what-unic-langid = Odczytuje nazwy języków.
credits-what-sys-locale = Ustala język systemu.
credits-what-typst = Składa strony podglądu i tworzy pliki PDF.
credits-what-comemo = Pamięta, co Typst już wyliczył, by strony składały się na nowo szybko.
credits-what-hayro = Rysuje strony plików PDF, by odczytać ich tekst i je pokazać.
credits-what-lopdf = Czyta i zapisuje pliki PDF, na potrzeby tekstu, który ma PDF, i tekstu kładzionego na skan.
credits-what-pdf-text-part = Czyta czcionki i mapy znaków plików PDF, na potrzeby kodu pdf-extract włączonego do Glaukopis.
credits-what-image = Czyta i zapisuje obrazy.
credits-what-rusqlite = Czyta bazę danych Zotero, by importować jego pozycje.
credits-what-sqlite = Baza danych, w której Zotero przechowuje pozycje, czytana przez rusqlite. W Windows i macOS wkompilowana w program; w Linuksie systemowa.
credits-what-roxmltree = Czyta XML: style cytowania, dokumenty Worda i to, co przysyłają katalogi.
credits-what-zip = Czyta i zapisuje pliki Worda i OpenDocument, projekty jako pliki i pakiety językowe.
credits-what-calamine = Czyta arkusze kalkulacyjne, na potrzeby wczytywanych tabel.
credits-what-encoding-rs = Czyta tekst w kodowaniach, jakie mają starsze pliki.
credits-what-spellbook = Sprawdza pisownię słownikami Hunspella.
credits-what-icu = Wie, czym jest każdy znak, na potrzeby znajdowania słów.
credits-what-unicode-normalization = Sprowadza litery ze znakami diakrytycznymi do jednej postaci, by dało się je znajdować i porównywać.
credits-what-strsim = Jak bardzo podobne są dwie nazwy lub dwa tytuły, na potrzeby szukania duplikatów.
credits-what-ureq = Rozmawia z usługami, z których pobiera się dane pozycji, i z serwerem pakietów językowych.
credits-what-sha2 = Odróżnia pliki po tym, co zawierają.
credits-what-base64 = Przenosi obrazy i pliki jako tekst.
credits-what-serde = Czyta i zapisuje dane Glaukopis jako JSON.
credits-what-uuid = Nadaje wszystkiemu, co jest przechowywane, własną nazwę.
credits-what-time = Daty i godziny.
credits-what-tempfile = Bezpiecznie zapisuje pliki, przez plik obok nich.
credits-what-tracing = Dziennik tego, co robi aplikacja.
credits-what-thiserror = Błędy serwera dołączonego do Glaukopis.
credits-what-tokio = Uruchamia serwer dołączony do Glaukopis, do udostępniania projektów.
credits-what-axum = Odpowiada tym, którzy łączą się z serwerem dołączonym do Glaukopis.
credits-what-futures = Obsługuje na bieżąco to, co serwer dostaje i wysyła.
credits-what-clap = Odczytuje, z czym uruchomiono serwer dołączony do Glaukopis.
credits-what-getrandom = Tworzy tokeny i kody zaproszeń serwera dołączonego do Glaukopis.
credits-what-pdf-extract = Czyta tekst plików PDF. Włączony do Glaukopis jako pdf-text i zmieniony tak, by podawał nazwy glifów.
credits-what-wrap-it = Pozwala tekstowi opływać to, co stoi obok, na stronach składanych przez Typst. Dołączony do Glaukopis, skrócony.
credits-what-literata = Czcionka tekstów w interfejsie.
credits-what-inter = Czcionka interfejsu.
credits-what-stix = Czcionka matematyki w interfejsie.
credits-what-typst-font = Czcionka dołączona do Typst, na potrzeby stron dokumentów. W instalatorach dla Windows i macOS; w Linuksie systemowa.
credits-what-foxit = Czcionki, które zastępują czternaście standardowych czcionek PDF, gdy rysuje się pliki PDF i gdy składa się obrazy w PDF.
credits-what-csl-styles = Style cytowania dołączone do Glaukopis i te pobierane z repozytorium.
credits-what-csl-locales = Słowa cytowań w każdym języku: „strona”, „rozdział” i tym podobne.
credits-what-ordboka = Słowa słowników norweskiego bokmål i nynorsk, dołączonych do Glaukopis.
credits-what-ordbank = Odmiana słów słowników norweskich.
credits-what-spell-norwegian = Reguły słowników norweskich.
credits-what-spelling-en-us = Słownik amerykańskiej odmiany angielskiego, z serwera pakietów językowych.
credits-what-spelling-en-gb = Słownik brytyjskiej odmiany angielskiego, z serwera pakietów językowych.
credits-what-spelling-sv = Słownik szwedzki, z serwera pakietów językowych.
credits-what-spelling-da = Słownik duński, z serwera pakietów językowych.
credits-what-spelling-de = Słownik niemiecki, z serwera pakietów językowych.
credits-what-spelling-fr = Słownik francuski, z serwera pakietów językowych.
credits-what-spelling-it = Słownik włoski, z serwera pakietów językowych.
credits-what-tessdata = To, czym Tesseract odczytuje każdy język, z serwera pakietów językowych.
credits-what-pandoc = Wczytuje dokumenty z Worda i innych formatów oraz tworzy dokumenty jako Word, OpenDocument, LaTeX, HTML i EPUB.
credits-what-tesseract = Odczytuje tekst skanów i obrazów.
credits-what-poppler = Rysuje strony plików PDF, których nie da się narysować inaczej, by odczytać ich tekst.
credits-what-latex = Tworzy pliki PDF z dokumentu zapisanego w LaTeX-u, za pomocą LuaLaTeX, XeLaTeX lub pdfLaTeX.
credits-what-lucide = Ikony interfejsu.
credits-what-feather = Część ikon Lucide narysowano na wzór ikon Feather.
credits-name-owl = Sowa Glaukopis
credits-what-owl = Znak i ikona Glaukopis: sowa Ateny. Narysował ją Robert Emil Berge na podstawie fotografii ateńskiej tetradrachmy. Kto używa rysunku, wymienia go jako autora rysunku, a Classical Numismatic Group, Inc. (http://www.cngcoins.com) jako źródło pierwowzoru.
credits-what-owl-photo = Fotografia, na podstawie której narysowano sowę: ateńska tetradrachma z lat 454–404 p.n.e.; fot. Classical Numismatic Group, Inc. (http://www.cngcoins.com).
