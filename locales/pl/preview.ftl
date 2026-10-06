# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Podgląd
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Format dokumentu
# Small, over the choice of the reference style.
preview-style = Cytowania
preview-style-label = Styl cytowania
# The last among the reference styles, which opens the search for more.
preview-style-more = Więcej stylów…
preview-change = Zmień format lub styl
preview-change-format = Zmień ten format…
preview-change-format-hint = Strona, pismo, odstępy, nagłówki
preview-change-style = Zmień ten styl cytowania…
preview-change-style-hint = Pod życzenia wydawcy
preview-details = Tytuł, autorzy, streszczenie
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Przejdź do tego miejsca w tekście
# Moves the pages to where the element the text is at begins.
preview-show-text = Pokaż, gdzie jest tekst
preview-hide = Ukryj podgląd
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Styl cytowania to teraz { $style }
preview-style-taken-why = To ten, z którym idzie ten format.
preview-style-keep-other = Zachowaj tamten
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } nie jest zainstalowany
preview-programs-needed = Podgląd i eksport robią Pandoc i Typst. Zainstaluj je menedżerem pakietów swojego systemu albo podaj w ustawieniach, gdzie są.
preview-look-again = Poszukaj znowu
preview-looking-failed = Nie udało się poszukać programów
preview-reading-failed = Nie udało się odczytać stylów i formatów
preview-failed = Nie udało się zrobić podglądu
preview-failed-message = Nie udało się zrobić podglądu.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Strona { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } strona
    [few] { $count } strony
    [many] { $count } stron
   *[other] { $count } stron
}
preview-words = { $count ->
    [one] { $count } słowo
    [few] { $count } słowa
    [many] { $count } słów
   *[other] { $count } słów
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } z { $limit } słowa
    [few] { $count } z { $limit } słów
    [many] { $count } z { $limit } słów
   *[other] { $count } z { $limit } słów
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } z przypisami
preview-remarks-count = { $count ->
    [one] { $count } uwaga
    [few] { $count } uwagi
    [many] { $count } uwag
   *[other] { $count } uwag
}
preview-remarks = Uwagi
preview-remarks-font = Czcionka
preview-font-missing = Czcionka { $font } nie jest zainstalowana.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = W jej miejsce używana jest { $font }, tu w podglądzie i w tworzonym pliku PDF. W dokumencie eksportowanym dla Worda, LibreOffice lub LaTeX czcionka jest nazwana tak, jak chce format, i jest tam dla każdego, kto otworzy dokument i ją ma.
preview-remarks-references = Pozycje
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] Nie znaleziono { $count } cytowanego dzieła,
    [few] Nie znaleziono { $count } cytowanych dzieł,
    [many] Nie znaleziono { $count } cytowanych dzieł,
   *[other] Nie znaleziono { $count } cytowanych dzieł,
}
preview-works-missing-where = ani w twojej bibliotece, ani w projekcie. Są oznaczone w tekście.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Powiedziane podczas tworzenia dokumentu

## The details of a document: what stands on its first page.

preview-details-dialog = Dokument
preview-details-dialog-subtitle = Co stoi na jego pierwszej stronie
preview-details-title = Tytuł
preview-details-title-placeholder = Nazwa środka mapy
preview-details-title-hint = Zostawiony pusty: tytułem jest nazwa środka mapy.
preview-details-subtitle = Podtytuł
preview-details-authors = Autorzy
preview-details-name = Imię i nazwisko
preview-details-author-name = Imię i nazwisko autora { $number }
preview-details-affiliation = Afiliacja
preview-details-author-affiliation = Afiliacja autora { $number }
preview-details-email = E-mail
preview-details-author-email = E-mail autora { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = autor
preview-details-abstract = Streszczenie
preview-details-words = { $count ->
    [one] { $count } słowo
    [few] { $count } słowa
    [many] { $count } słów
   *[other] { $count } słów
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } z { $limit } słowa
    [few] { $count } z { $limit } słów
    [many] { $count } z { $limit } słów
   *[other] { $count } z { $limit } słów
}
preview-details-keywords = Słowa kluczowe
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } z { $limit }
preview-details-keywords-placeholder = Rozdzielone przecinkami
preview-details-date = Data
preview-details-date-placeholder = Tak, jak ma być wydrukowana
preview-details-language = Język tekstu
# A map that was given no language is printed in English.
preview-details-language-none = Niepodany (angielski)
preview-details-cover = Okładka
preview-details-cover-choose = Wybierz obraz…
preview-details-cover-other = Inny…
preview-details-cover-hint = Okładka e-booka: obraz, zachowany w zbiorze obrazów. Nic innego go nie używa.

## The export: the kinds of file a document is made as.

preview-export = Eksportuj
preview-export-kind = Rodzaj pliku
preview-export-pdf-about = Tak, jak pokazuje podgląd
preview-export-pdflatex = PDF, złożony przez LaTeX
preview-export-pdflatex-about = Ten sam dokument w składzie systemu LaTeX. Trwa to trochę dłużej.
preview-export-docx-about = To, o co prosi większość wydawców i czasopism
preview-export-odt-about = Dla LibreOffice Writer i innych
preview-export-latex-about = Do złożenia przez LuaLaTeX lub XeLaTeX
preview-export-markdown-about = Zwykły tekst, z cytowaniami jako kluczami
preview-export-html = Strona internetowa
preview-export-html-about = Jeden plik, do czytania w przeglądarce
preview-export-epub = E-book
preview-export-epub-about = EPUB, dla czytników i aplikacji, które je czytają; tekst składa czytnik
preview-export-latex-missing = Do tego potrzebny jest LaTeX, którego nie znaleziono. Instaluje się go jako TeX Live.
preview-export-biblatex = Zachowaj cytowania jako polecenia BibLaTeX
preview-export-biblatex-hint = Pozycje są zapisywane do pliku .bib obok dokumentu. Stylem cytowania jest wtedy ten styl BibLaTeX, który jest najbliższy wybranemu.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Eksportuj jako { $kind }
preview-export-run = Eksportuj…
preview-export-working = Tworzenie dokumentu…
preview-export-failed = Nie udało się utworzyć dokumentu.
preview-export-stop = Zatrzymaj
preview-export-stopped = Tworzenie zatrzymano. Nie zapisano żadnego pliku.
# Under the name of the file that was made: another file made with it.
preview-export-also = z { $file }
preview-export-missing = { $count ->
    [one] Nie znaleziono jednego cytowanego dzieła; jest oznaczone w tekście.
    [few] Nie znaleziono { $count } cytowanych dzieł; są oznaczone w tekście.
    [many] Nie znaleziono { $count } cytowanych dzieł; są oznaczone w tekście.
   *[other] Nie znaleziono { $count } cytowanych dzieł; są oznaczone w tekście.
}
preview-export-show-in-folder = Pokaż w folderze
preview-export-open-failed = Nie udało się otworzyć pliku
preview-export-folder-failed = Nie udało się otworzyć folderu
preview-export-another = Eksportuj kolejny
