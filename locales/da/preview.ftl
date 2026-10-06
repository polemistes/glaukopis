# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Forhåndsvisning
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Dokumentformat
# Small, over the choice of the reference style.
preview-style = Referencer
preview-style-label = Referencestil
# The last among the reference styles, which opens the search for more.
preview-style-more = Flere stile…
preview-change = Skift format eller stil
preview-change-format = Ændr dette format…
preview-change-format-hint = Side, skrift, afstand, overskrifter
preview-change-style = Ændr denne referencestil…
preview-change-style-hint = Efter et forlags ønsker
preview-details = Titel, forfattere, resumé
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Gå til dette sted i teksten
# Moves the pages to where the element the text is at begins.
preview-show-text = Vis, hvor teksten er
preview-hide = Skjul forhåndsvisningen
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Referencestilen er nu { $style }
preview-style-taken-why = Det er den, dette format hører sammen med.
preview-style-keep-other = Behold den anden
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } er ikke installeret
preview-programs-needed = Forhåndsvisning og eksport laves med Pandoc og Typst. Installer dem med dit systems pakkehåndtering, eller sig i indstillingerne, hvor de er.
preview-look-again = Se efter igen
preview-looking-failed = Der kunne ikke ledes efter programmerne
preview-reading-failed = Stilene og formaterne kunne ikke læses
preview-failed = Forhåndsvisningen kunne ikke laves
preview-failed-message = Forhåndsvisningen kunne ikke laves.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Side { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } side
   *[other] { $count } sider
}
preview-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } af { $limit } ord
   *[other] { $count } af { $limit } ord
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } med noter
preview-remarks-count = { $count ->
    [one] { $count } bemærkning
   *[other] { $count } bemærkninger
}
preview-remarks = Bemærkninger
preview-remarks-font = Skrift
preview-font-missing = { $font } er ikke installeret.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = { $font } bruges i stedet, her i forhåndsvisningen og i en PDF, der laves. I et dokument, der eksporteres til Word, LibreOffice eller LaTeX, nævnes skriften, som formatet beder om, og den er der for den, der åbner dokumentet og har den.
preview-remarks-references = Referencer
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } citeret værk blev ikke fundet,
   *[other] { $count } citerede værker blev ikke fundet,
}
preview-works-missing-where = hverken i dit bibliotek eller i projektet. De er markeret i teksten.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Sagt, mens dokumentet blev lavet

## The details of a document: what stands on its first page.

preview-details-dialog = Dokumentet
preview-details-dialog-subtitle = Hvad der står på dets første side
preview-details-title = Titel
preview-details-title-placeholder = Navnet på kortets midte
preview-details-title-hint = Står feltet tomt, er navnet på kortets midte titlen.
preview-details-subtitle = Undertitel
preview-details-authors = Forfattere
preview-details-name = Navn
preview-details-author-name = Navn på forfatter { $number }
preview-details-affiliation = Tilhørsforhold
preview-details-author-affiliation = Tilhørsforhold for forfatter { $number }
preview-details-email = E-mail
preview-details-author-email = E-mail til forfatter { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = forfatter
preview-details-abstract = Resumé
preview-details-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } af { $limit } ord
   *[other] { $count } af { $limit } ord
}
preview-details-keywords = Nøgleord
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } af { $limit }
preview-details-keywords-placeholder = Adskilt af kommaer
preview-details-date = Dato
preview-details-date-placeholder = Som den skal trykkes
preview-details-language = Tekstens sprog
# A map that was given no language is printed in English.
preview-details-language-none = Ikke angivet (engelsk)
preview-details-cover = Omslag
preview-details-cover-choose = Vælg et billede…
preview-details-cover-other = Et andet…
preview-details-cover-hint = E-bogens omslag: et billede, gemt i billedlageret. Intet andet bruger det.

## The export: the kinds of file a document is made as.

preview-export = Eksporter
preview-export-kind = Filtype
preview-export-pdf-about = Som forhåndsvisningen viser det
preview-export-pdflatex = PDF, sat med LaTeX
preview-export-pdflatex-about = Det samme dokument, sat af LaTeX. Det tager lidt længere tid.
preview-export-docx-about = Det, de fleste forlag og tidsskrifter beder om
preview-export-odt-about = Til LibreOffice Writer og andre
preview-export-latex-about = Til at sættes med LuaLaTeX eller XeLaTeX
preview-export-markdown-about = Ren tekst, med kildehenvisningerne som nøgler
preview-export-html = Webside
preview-export-html-about = Én fil, til at læses i en browser
preview-export-epub = E-bog
preview-export-epub-about = EPUB, til e-bogslæsere og de apps, der læser dem; læseren sætter teksten
preview-export-latex-missing = Dette kræver LaTeX, som ikke blev fundet. Det installeres som TeX Live.
preview-export-biblatex = Behold kildehenvisningerne som BibLaTeX-kommandoer
preview-export-biblatex-hint = Referencerne skrives til en .bib-fil ved siden af dokumentet. Referencestilen bliver så den i BibLaTeX, der ligger nærmest den valgte.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Eksporter som { $kind }
preview-export-run = Eksporter…
preview-export-working = Laver dokumentet…
preview-export-failed = Dokumentet kunne ikke laves.
preview-export-stop = Stop
preview-export-stopped = Arbejdet blev standset. Ingen fil blev skrevet.
# Under the name of the file that was made: another file made with it.
preview-export-also = med { $file }
preview-export-missing = { $count ->
    [one] Ét citeret værk blev ikke fundet og er markeret i teksten.
   *[other] { $count } citerede værker blev ikke fundet og er markeret i teksten.
}
preview-export-show-in-folder = Vis i mappen
preview-export-open-failed = Filen kunne ikke åbnes
preview-export-folder-failed = Mappen kunne ikke åbnes
preview-export-another = Eksporter en til
