# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Pregled
# The last among the reference styles, which opens the search for more.
preview-style-more = Više stilova…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Idi na ovo mjesto u tekstu
# Moves the pages to where the element the text is at begins.
preview-show-text = Prikaži gdje je tekst
preview-hide = Sakrij pregled
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } nije instaliran
preview-programs-needed = Pregled i izvoz prave se Pandocom i Typstom. Instalirajte ih upraviteljem paketa svog sistema, ili u postavkama recite gdje se nalaze.
preview-look-again = Potraži ponovo
preview-looking-failed = Programe nije bilo moguće potražiti
preview-reading-failed = Stilove i formate nije bilo moguće pročitati
preview-failed = Pregled nije bilo moguće napraviti
preview-failed-message = Pregled nije bilo moguće napraviti.
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
preview-words-with-notes = { $count } s napomenama
preview-remarks-count = { $count ->
    [one] { $count } primjedba
    [few] { $count } primjedbe
   *[other] { $count } primjedbi
}
preview-remarks = Primjedbe
preview-remarks-font = Font
preview-font-missing = { $font } nije instaliran.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Umjesto njega koristi se { $font }, ovdje u pregledu i u PDF-u koji se napravi. U dokumentu izvezenom za Word, LibreOffice ili LaTeX font je imenovan kako format traži, i ondje je za svakoga ko otvori dokument i ima ga.
preview-remarks-references = Reference
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } citirano djelo nije pronađeno,
    [few] { $count } citirana djela nisu pronađena,
   *[other] { $count } citiranih djela nije pronađeno,
}
preview-works-missing-where = ni u vašoj biblioteci ni u projektu. Označena su u tekstu.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Rečeno dok se dokument pravio

## The export: the kinds of file a document is made as.

preview-export = Izvoz
preview-export-kind = Vrsta datoteke
preview-export-pdf-about = Kako ga pregled prikazuje
preview-export-pdflatex = PDF, složen LaTeX-om
preview-export-pdflatex-about = Isti dokument u slogu LaTeX-a. Traje malo duže.
preview-export-docx-about = Ono što većina izdavača i časopisa traži
preview-export-odt-about = Za LibreOffice Writer i druge
preview-export-latex-about = Za slaganje LuaLaTeX-om ili XeLaTeX-om
preview-export-markdown-about = Običan tekst, s citatima kao ključevima
preview-export-html = Web-stranica
preview-export-html-about = Jedna datoteka, za čitanje u pregledniku
preview-export-epub = E-knjiga
preview-export-epub-about = EPUB, za e-čitače i aplikacije koje ih čitaju; čitač slaže tekst
preview-export-latex-missing = Za ovo je potreban LaTeX, a nije pronađen. Instalira se kao TeX Live.
preview-export-biblatex = Zadrži citate kao naredbe BibLaTeX-a
preview-export-biblatex-hint = Reference se zapisuju u .bib datoteku pored dokumenta. Stil citiranja onda je onaj BibLaTeX-ov koji je najbliži odabranom.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Izvezi kao { $kind }
preview-export-run = Izvezi…
preview-export-working = Pravljenje dokumenta…
preview-export-failed = Dokument nije bilo moguće napraviti.
preview-export-stop = Zaustavi
preview-export-stopped = Pravljenje je zaustavljeno. Nijedna datoteka nije zapisana.
# Under the name of the file that was made: another file made with it.
preview-export-also = uz { $file }
preview-export-missing = { $count ->
    [one] Jedno citirano djelo nije pronađeno i označeno je u tekstu.
    [few] { $count } citirana djela nisu pronađena i označena su u tekstu.
   *[other] { $count } citiranih djela nije pronađeno i označena su u tekstu.
}
preview-export-show-in-folder = Prikaži u folderu
preview-export-open-failed = Datoteku nije bilo moguće otvoriti
preview-export-folder-failed = Folder nije bilo moguće otvoriti
preview-export-another = Izvezi još jedan
