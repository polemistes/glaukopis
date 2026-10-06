# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Previzualizare
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Format de document
# Small, over the choice of the reference style.
preview-style = Referințe
preview-style-label = Stil de citare
# The last among the reference styles, which opens the search for more.
preview-style-more = Mai multe stiluri…
preview-change = Schimbă formatul sau stilul
preview-change-format = Modifică acest format…
preview-change-format-hint = Pagina, litera, spațierea, titlurile
preview-change-style = Modifică acest stil de citare…
preview-change-style-hint = După dorințele unei edituri
preview-details = Titlu, autori, rezumat
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Mergi la acest loc în text
# Moves the pages to where the element the text is at begins.
preview-show-text = Arată unde este textul
preview-hide = Ascunde previzualizarea
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Stilul de citare este acum { $style }
preview-style-taken-why = Este cel cu care merge acest format.
preview-style-keep-other = Păstrează-l pe celălalt
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } nu este instalat
preview-programs-needed = Previzualizarea și exportul se fac cu Pandoc și Typst. Instalați-le cu gestionarul de pachete al sistemului, sau spuneți în setări unde sunt.
preview-look-again = Caută din nou
preview-looking-failed = Programele nu au putut fi căutate
preview-reading-failed = Stilurile și formatele nu s-au putut citi
preview-failed = Previzualizarea nu s-a putut face
preview-failed-message = Previzualizarea nu s-a putut face.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Pagina { $number }
# The name of an exported file, where the map has none.
preview-file-name = document

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } pagină
    [few] { $count } pagini
   *[other] { $count } de pagini
}
preview-words = { $count ->
    [one] { $count } cuvânt
    [few] { $count } cuvinte
   *[other] { $count } de cuvinte
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } din { $limit } cuvânt
    [few] { $count } din { $limit } cuvinte
   *[other] { $count } din { $limit } de cuvinte
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } cu note
preview-remarks-count = { $count ->
    [one] { $count } observație
    [few] { $count } observații
   *[other] { $count } de observații
}
preview-remarks = Observații
preview-remarks-font = Font
preview-font-missing = { $font } nu este instalat.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = În locul lui se folosește { $font }, aici în previzualizare și într-un PDF care se face. Într-un document exportat pentru Word, LibreOffice sau LaTeX, fontul este numit cum cere formatul și este acolo pentru oricine deschide documentul și îl are.
preview-remarks-references = Referințe
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } lucrare citată nu a fost găsită,
    [few] { $count } lucrări citate nu au fost găsite,
   *[other] { $count } de lucrări citate nu au fost găsite,
}
preview-works-missing-where = nici în biblioteca dumneavoastră, nici în proiect. Sunt marcate în text.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Spuse în timp ce se făcea documentul

## The details of a document: what stands on its first page.

preview-details-dialog = Documentul
preview-details-dialog-subtitle = Ce stă pe prima lui pagină
preview-details-title = Titlu
preview-details-title-placeholder = Numele centrului hărții
preview-details-title-hint = Lăsat gol, titlul este numele centrului hărții.
preview-details-subtitle = Subtitlu
preview-details-authors = Autori
preview-details-name = Nume
preview-details-author-name = Numele autorului { $number }
preview-details-affiliation = Afiliere
preview-details-author-affiliation = Afilierea autorului { $number }
preview-details-email = E-mail
preview-details-author-email = E-mailul autorului { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = autor
preview-details-abstract = Rezumat
preview-details-words = { $count ->
    [one] { $count } cuvânt
    [few] { $count } cuvinte
   *[other] { $count } de cuvinte
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } din { $limit } cuvânt
    [few] { $count } din { $limit } cuvinte
   *[other] { $count } din { $limit } de cuvinte
}
preview-details-keywords = Cuvinte-cheie
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } din { $limit }
preview-details-keywords-placeholder = Despărțite prin virgule
preview-details-date = Dată
preview-details-date-placeholder = Așa cum urmează să fie tipărită
preview-details-language = Limba textului
# A map that was given no language is printed in English.
preview-details-language-none = Nespusă (engleză)
preview-details-cover = Copertă
preview-details-cover-choose = Alege o imagine…
preview-details-cover-other = Alta…
preview-details-cover-hint = Coperta cărții electronice: o imagine, păstrată în depozitul de imagini. Nimic altceva nu o folosește.

## The export: the kinds of file a document is made as.

preview-export = Exportă
preview-export-kind = Fel de fișier
preview-export-pdf-about = Așa cum îl arată previzualizarea
preview-export-pdflatex = PDF, așezat de LaTeX
preview-export-pdflatex-about = Același document în culegerea lui LaTeX. Ia puțin mai mult.
preview-export-docx-about = Ce cer cele mai multe edituri și reviste
preview-export-odt-about = Pentru LibreOffice Writer și altele
preview-export-latex-about = De așezat cu LuaLaTeX sau XeLaTeX
preview-export-markdown-about = Text simplu, cu citările drept chei
preview-export-html = Pagină web
preview-export-html-about = Un singur fișier, de citit într-un browser
preview-export-epub = Carte electronică
preview-export-epub-about = EPUB, pentru cititoarele de cărți electronice și aplicațiile care le citesc; textul îl așază cititorul
preview-export-latex-missing = Pentru asta este nevoie de LaTeX, care nu s-a găsit. Se instalează ca TeX Live.
preview-export-biblatex = Păstrează citările drept comenzi BibLaTeX
preview-export-biblatex-hint = Referințele se scriu într-un fișier .bib lângă document. Stilul de citare este atunci cel din BibLaTeX cel mai apropiat de cel ales.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exportă ca { $kind }
preview-export-run = Exportă…
preview-export-working = Se face documentul…
preview-export-failed = Documentul nu s-a putut face.
preview-export-stop = Oprește
preview-export-stopped = Facerea a fost oprită. Nu s-a scris niciun fișier.
# Under the name of the file that was made: another file made with it.
preview-export-also = cu { $file }
preview-export-missing = { $count ->
    [one] O lucrare citată nu a fost găsită și este marcată în text.
    [few] { $count } lucrări citate nu au fost găsite și sunt marcate în text.
   *[other] { $count } de lucrări citate nu au fost găsite și sunt marcate în text.
}
preview-export-show-in-folder = Arată în dosar
preview-export-open-failed = Fișierul nu s-a putut deschide
preview-export-folder-failed = Dosarul nu s-a putut deschide
preview-export-another = Exportă altul
