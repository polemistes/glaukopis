# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Pretpregled
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Format dokumenta
# Small, over the choice of the reference style.
preview-style = Reference
preview-style-label = Citatni stil
# The last among the reference styles, which opens the search for more.
preview-style-more = Više stilova…
preview-change = Izmijeni format ili stil
preview-change-format = Izmijeni ovaj format…
preview-change-format-hint = Stranica, pismo, prored, naslovi
preview-change-style = Izmijeni ovaj citatni stil…
preview-change-style-hint = Po željama nakladnika
preview-details = Naslov, autori, sažetak
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Idi na ovo mjesto u tekstu
# Moves the pages to where the element the text is at begins.
preview-show-text = Prikaži gdje je tekst
preview-hide = Sakrij pretpregled
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Citatni stil sad je { $style }
preview-style-taken-why = To je onaj uz koji ovaj format ide.
preview-style-keep-other = Zadrži drugi
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } nije instaliran
preview-programs-needed = Pretpregled i izvoz izrađuju se Pandocom i Typstom. Instalirajte ih upraviteljem paketa svojega sustava, ili u postavkama recite gdje su.
preview-look-again = Potraži ponovno
preview-looking-failed = Programe nije bilo moguće potražiti
preview-reading-failed = Stilove i formate nije bilo moguće pročitati
preview-failed = Pretpregled nije bilo moguće izraditi
preview-failed-message = Pretpregled nije bilo moguće izraditi.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Stranica { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } stranica
    [few] { $count } stranice
   *[other] { $count } stranica
}
preview-words = { $count ->
    [one] { $count } riječ
    [few] { $count } riječi
   *[other] { $count } riječi
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } od { $limit } riječi
    [few] { $count } od { $limit } riječi
   *[other] { $count } od { $limit } riječi
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } s bilješkama
preview-remarks-count = { $count ->
    [one] { $count } napomena
    [few] { $count } napomene
   *[other] { $count } napomena
}
preview-remarks = Napomene
preview-remarks-font = Font
preview-font-missing = { $font } nije instaliran.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Umjesto njega koristi se { $font }, ovdje u pretpregledu i u PDF-u koji se izradi. U dokumentu izvezenom za Word, LibreOffice ili LaTeX font je naveden kako format traži, i bit će ondje za onoga tko dokument otvori i ima ga.
preview-remarks-references = Reference
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } citirano djelo nije pronađeno
    [few] { $count } citirana djela nisu pronađena
   *[other] { $count } citiranih djela nije pronađeno
}
preview-works-missing-where = ni u vašoj knjižnici ni u projektu. Označena su u tekstu.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Rečeno dok se dokument izrađivao

## The details of a document: what stands on its first page.

preview-details-dialog = Dokument
preview-details-dialog-subtitle = Što stoji na njegovoj prvoj stranici
preview-details-title = Naslov
preview-details-title-placeholder = Naziv središta mape
preview-details-title-hint = Ako ostane prazno, naslov je naziv središta mape.
preview-details-subtitle = Podnaslov
preview-details-authors = Autori
preview-details-name = Ime
preview-details-author-name = Ime { $number }. autora
preview-details-affiliation = Ustanova
preview-details-author-affiliation = Ustanova { $number }. autora
preview-details-email = E-pošta
preview-details-author-email = E-pošta { $number }. autora
# Beside a plus, under the authors: adds one.
preview-details-add-author = autor
preview-details-abstract = Sažetak
preview-details-words = { $count ->
    [one] { $count } riječ
    [few] { $count } riječi
   *[other] { $count } riječi
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } od { $limit } riječi
    [few] { $count } od { $limit } riječi
   *[other] { $count } od { $limit } riječi
}
preview-details-keywords = Ključne riječi
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } od { $limit }
preview-details-keywords-placeholder = Razdvojene zarezima
preview-details-date = Datum
preview-details-date-placeholder = Kako treba biti tiskan
preview-details-language = Jezik teksta
# A map that was given no language is printed in English.
preview-details-language-none = Nije naveden (engleski)
preview-details-cover = Naslovnica
preview-details-cover-choose = Odaberi sliku…
preview-details-cover-other = Druga…
preview-details-cover-hint = Naslovnica e-knjige: slika, čuva se u spremištu slika. Ništa je drugo ne koristi.

## The export: the kinds of file a document is made as.

preview-export = Izvoz
preview-export-kind = Vrsta datoteke
preview-export-pdf-about = Kako ga pretpregled prikazuje
preview-export-pdflatex = PDF, složen LaTeX-om
preview-export-pdflatex-about = Isti dokument u slogu LaTeX-a. Traje malo dulje.
preview-export-docx-about = Što većina nakladnika i časopisa traži
preview-export-odt-about = Za LibreOffice Writer i druge
preview-export-latex-about = Za slaganje LuaLaTeX-om ili XeLaTeX-om
preview-export-markdown-about = Običan tekst, s citatima kao ključevima
preview-export-html = Mrežna stranica
preview-export-html-about = Jedna datoteka, za čitanje u pregledniku
preview-export-epub = E-knjiga
preview-export-epub-about = EPUB, za e-čitače i aplikacije koje ih čitaju; tekst slaže čitač
preview-export-latex-missing = Za ovo je potreban LaTeX, a nije pronađen. Instalira se kao TeX Live.
preview-export-biblatex = Zadrži citate kao naredbe BibLaTeX-a
preview-export-biblatex-hint = Reference se zapisuju u .bib datoteku pokraj dokumenta. Citatni stil tada je onaj BibLaTeX-a najbliži odabranome.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Izvezi kao { $kind }
preview-export-run = Izvezi…
preview-export-working = Izrada dokumenta…
preview-export-failed = Dokument nije bilo moguće izraditi.
preview-export-stop = Zaustavi
preview-export-stopped = Izrada je zaustavljena. Nijedna datoteka nije zapisana.
# Under the name of the file that was made: another file made with it.
preview-export-also = s { $file }
preview-export-missing = { $count ->
    [1] Jedno citirano djelo nije pronađeno i označeno je u tekstu.
    [one] { $count } citirano djelo nije pronađeno i označeno je u tekstu.
    [few] { $count } citirana djela nisu pronađena i označena su u tekstu.
   *[other] { $count } citiranih djela nije pronađeno i označena su u tekstu.
}
preview-export-show-in-folder = Prikaži u direktoriju
preview-export-open-failed = Datoteku nije bilo moguće otvoriti
preview-export-folder-failed = Direktorij nije bilo moguće otvoriti
preview-export-another = Izvezi drugi
