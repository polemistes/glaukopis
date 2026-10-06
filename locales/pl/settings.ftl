# The settings.

settings-title = Ustawienia
settings-error-system = Nie udało się odczytać czegoś o programie
settings-error-read = Nie udało się odczytać ustawień
settings-error-save = Nie udało się zapisać ustawień

## Appearance

settings-appearance = Wygląd
settings-theme = Kolory
settings-theme-system = Jak system
settings-theme-light = Jasne
settings-theme-dark = Ciemne
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Łagodne
settings-theme-own = Własne
settings-own = Własne kolory
settings-own-hint = Cztery kolory, z których wynika reszta: papier, atrament, akcent, który oznacza to, co wybrane i naciśnięte, oraz drugi głos, który oznacza powiązania i komentarze. Czy schemat jest jasny, czy ciemny, wynika z papieru.
settings-own-paper = Papier
settings-own-ink = Atrament
settings-own-accent = Akcent
settings-own-gold = Drugi głos
settings-own-begin = Zacznij od
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Trudne do czytania: atrament ma na papierze kontrast { $ink } do 1, a akcent { $accent } do 1; dobrze czyta się od 4,5 i 3.
settings-text-size = Rozmiar twojego tekstu
settings-text-size-hint = W mapach i w widoku tekstu. To, co eksportowane, idzie za formatem dokumentu.
settings-interface-size = Rozmiar interfejsu
settings-interface-size-hint = Wszystko w oknie, pisanie także. Dla samego tekstu rozmiar poniżej.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Gniew, bogini, opiewaj Achilla, syna Peleusa

## New documents

settings-new-documents = Nowe dokumenty
settings-new-documents-hint = Od czego zaczyna mapa. Każdej mapie można dać inny, w podglądzie.
settings-reference-style = Styl cytowania
settings-document-format = Format dokumentu

## You

settings-you = Ty
settings-name = Imię i nazwisko
settings-name-hint = Pokazywane tym, którym udostępniasz projekty. Nieużywane poza tym.
settings-contact = Adres dla serwisów bibliograficznych
settings-contact-hint = Serwisy takie jak Crossref chętniej odpowiadają tym, którzy mówią, jak ich znaleźć. Jeśli wpiszesz adres, jest wysyłany do nich przy każdym pobraniu danych, i do nikogo więcej. Zostaw puste, by nie wysyłać żadnego.
settings-contact-problem = To nie wygląda na adres.

## Programs: Pandoc and Typst

settings-programs = Programy
settings-programs-about = Glaukopis tworzy dokumenty programem Pandoc, który jest znajdowany samodzielnie tam, gdzie zainstalowano go w zwykły sposób. Strony podglądu i pliku PDF składa Typst, który jest częścią Glaukopis.
settings-pandoc-need = Potrzebny do podglądu i każdego eksportu.
settings-looking = Szukanie…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Nie znaleziono. { $need } Zainstaluj go menedżerem pakietów swojego systemu albo podaj poniżej, gdzie jest.
settings-program-old = Starszy, niż potrzebuje Glaukopis: { $least } lub nowszy.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Gdzie jest { $program }
settings-program-found-by-itself = Znaleziony samodzielnie
settings-no-latex = Nie znaleziono systemu LaTeX. Nie jest potrzebny: źródło LaTeX można eksportować bez niego, a PDF robi Typst.
settings-look-again = Poszukaj znowu
settings-error-programs = Nie udało się poszukać programów

## About

settings-about = O programie
settings-licence = Wolne oprogramowanie na licencji GNU General Public License, w wersji 3 lub późniejszej. Bez gwarancji.
settings-owl = Sowę narysował Robert Emil Berge według fotografii ateńskiej tetradrachmy autorstwa Classical Numismatic Group, Inc. (http://www.cngcoins.com). Rysunek jest na licencji Creative Commons Uznanie autorstwa – Na tych samych warunkach 3.0 Unported.
settings-data = Gdzie wszystko jest przechowywane
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Twoje pozycje są w { $file }, który odczyta każde narzędzie BibLaTeX. By zachować kopię swojej pracy, skopiuj ten folder.
settings-lookup = Skąd pobierane są dane pozycji
settings-lookup-about = DOI z doi.org, Crossref i DataCite; książki z katalogów K10plus, norweskich bibliotek akademickich, Deutsche Nationalbibliothek i Biblioteki Kongresu; preprinty z arXiv; literatura medyczna z PubMed. Wysyłane jest do nich tylko to, co wpiszesz w pole pobierania danych.

## Language

settings-language = Język
settings-language-interface = Interfejs
settings-language-interface-hint = Słowa programu. Twoje teksty są w języku swoich map.
settings-language-system = Jak system ({ $language })
settings-language-texts = Język nowych tekstów
settings-language-texts-hint = W czym pisana jest nowa mapa, co decyduje o słowach, które drukuje jej dokument, i o słowniku, którym sprawdzana jest jej pisownia. Każdej mapie można dać inny pod Języki… w jej menu, a projektowi własny język dla jego nowych map.
