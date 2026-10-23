# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

# The last among the reference styles, which opens the search for more.
preview-style-more = Več slogov…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Pojdi na to mesto v besedilu
# Moves the pages to where the element the text is at begins.
preview-show-text = Pokaži, kje je besedilo
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } ni nameščen
preview-programs-needed = Predogled in izvoz se naredita s Pandocom in Typstom. Namestite ju z upraviteljem paketov svojega sistema ali pa v nastavitvah povejte, kje sta.
preview-look-again = Poglej znova
preview-looking-failed = Programov ni bilo mogoče poiskati
preview-reading-failed = Slogov in formatov ni bilo mogoče prebrati
preview-failed = Predogleda ni bilo mogoče narediti
preview-failed-message = Predogleda ni bilo mogoče narediti.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Stran { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } stran
    [two] { $count } strani
    [few] { $count } strani
   *[other] { $count } strani
}
preview-words = { $count ->
    [one] { $count } beseda
    [two] { $count } besedi
    [few] { $count } besede
   *[other] { $count } besed
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } od { $limit } besede
    [two] { $count } od { $limit } besed
    [few] { $count } od { $limit } besed
   *[other] { $count } od { $limit } besed
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } z opombami
preview-remarks-count = { $count ->
    [one] { $count } pripomba
    [two] { $count } pripombi
    [few] { $count } pripombe
   *[other] { $count } pripomb
}
preview-remarks = Pripombe
preview-remarks-font = Pisava
preview-font-missing = Pisava { $font } ni nameščena.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Namesto nje je uporabljena { $font }, tu v predogledu in v narejenem PDF-ju. V dokumentu, izvoženem za Word, LibreOffice ali LaTeX, je pisava imenovana, kakor zahteva format, in je tam za vsakogar, ki odpre dokument in jo ima.
preview-remarks-references = Viri
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } navedeno delo ni bilo najdeno,
    [two] { $count } navedeni deli nista bili najdeni,
    [few] { $count } navedena dela niso bila najdena,
   *[other] { $count } navedenih del ni bilo najdenih,
}
preview-works-missing-where = ne v vaši knjižnici ne v projektu. V besedilu so označena.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Rečeno med izdelavo dokumenta

## The export: the kinds of file a document is made as.

preview-export = Izvozi
preview-export-kind = Vrsta datoteke
preview-export-pdf-about = Kakor kaže predogled
preview-export-pdflatex = PDF, stavljen z LaTeXom
preview-export-pdflatex-about = Isti dokument v stavi LaTeXa. Traja malo dlje.
preview-export-docx-about = Kar zahteva večina založb in revij
preview-export-odt-about = Za LibreOffice Writer in druge
preview-export-latex-about = Za stavljenje z LuaLaTeXom ali XeLaTeXom
preview-export-markdown-about = Navadno besedilo, z navedbami kot ključi
preview-export-html = Spletna stran
preview-export-html-about = Ena datoteka, za branje v brskalniku
preview-export-epub = E-knjiga
preview-export-epub-about = EPUB, za e-bralnike in aplikacije, ki jih berejo; besedilo postavi bralnik
preview-export-latex-missing = Za to je potreben LaTeX, ki ni bil najden. Namesti se kot TeX Live.
preview-export-biblatex = Ohrani navedbe kot ukaze BibLaTeXa
preview-export-biblatex-hint = Viri se zapišejo v datoteko .bib ob dokumentu. Slog navajanja je potem tisti slog BibLaTeXa, ki je izbranemu najbližji.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Izvozi kot { $kind }
preview-export-run = Izvozi…
preview-export-working = Izdelava dokumenta…
preview-export-failed = Dokumenta ni bilo mogoče narediti.
preview-export-stop = Ustavi
preview-export-stopped = Izdelava je bila ustavljena. Nobena datoteka ni bila zapisana.
# Under the name of the file that was made: another file made with it.
preview-export-also = z { $file }
preview-export-missing = { $count ->
    [one] { $count } navedeno delo ni bilo najdeno in je v besedilu označeno.
    [two] { $count } navedeni deli nista bili najdeni in sta v besedilu označeni.
    [few] { $count } navedena dela niso bila najdena in so v besedilu označena.
   *[other] { $count } navedenih del ni bilo najdenih in so v besedilu označena.
}
preview-export-show-in-folder = Pokaži v mapi
preview-export-open-failed = Datoteke ni bilo mogoče odpreti
preview-export-folder-failed = Mape ni bilo mogoče odpreti
preview-export-another = Izvozi še enega
