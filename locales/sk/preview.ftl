# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Náhľad
# The last among the reference styles, which opens the search for more.
preview-style-more = Ďalšie štýly…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Prejsť na toto miesto v texte
# Moves the pages to where the element the text is at begins.
preview-show-text = Ukázať, kde je text
preview-hide = Skryť náhľad
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } nie je nainštalovaný
preview-programs-needed = Náhľad a export sa vytvárajú Pandocom a Typstom. Nainštalujte ich správcom balíkov vášho systému alebo v nastaveniach povedzte, kde sú.
preview-look-again = Hľadať znova
preview-looking-failed = Programy sa nepodarilo hľadať
preview-reading-failed = Štýly a formáty sa nepodarilo prečítať
preview-failed = Náhľad sa nepodarilo vytvoriť
preview-failed-message = Náhľad sa nepodarilo vytvoriť.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Strana { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } strana
    [few] { $count } strany
   *[other] { $count } strán
}
preview-words = { $count ->
    [one] { $count } slovo
    [few] { $count } slová
   *[other] { $count } slov
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } z { $limit } slova
    [few] { $count } z { $limit } slov
   *[other] { $count } z { $limit } slov
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } s poznámkami
preview-remarks-count = { $count ->
    [one] { $count } poznámka
    [few] { $count } poznámky
   *[other] { $count } poznámok
}
preview-remarks = Poznámky
preview-remarks-font = Písmo
preview-font-missing = { $font } nie je nainštalované.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Namiesto neho sa používa { $font }, tu v náhľade aj vo vytvorenom PDF. V dokumente exportovanom pre Word, LibreOffice alebo LaTeX je písmo pomenované tak, ako žiada formát, a má ho ten, kto dokument otvorí a písmo vlastní.
preview-remarks-references = Záznamy
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } citované dielo sa nenašlo,
    [few] { $count } citované diela sa nenašli,
   *[other] { $count } citovaných diel sa nenašlo,
}
preview-works-missing-where = ani vo vašej knižnici, ani v projekte. V texte sú označené.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Povedané pri vytváraní dokumentu

## The export: the kinds of file a document is made as.

preview-export = Export
preview-export-kind = Druh súboru
preview-export-pdf-about = Ako ho ukazuje náhľad
preview-export-pdflatex = PDF vysádzané LaTeXom
preview-export-pdflatex-about = Ten istý dokument v sadzbe LaTeXu. Trvá o niečo dlhšie.
preview-export-docx-about = Čo žiada väčšina vydavateľov a časopisov
preview-export-odt-about = Pre LibreOffice Writer a iné
preview-export-latex-about = Na vysádzanie LuaLaTeXom alebo XeLaTeXom
preview-export-markdown-about = Čistý text, s citáciami ako kľúčmi
preview-export-html = Webová stránka
preview-export-html-about = Jeden súbor na čítanie v prehliadači
preview-export-epub = E-kniha
preview-export-epub-about = EPUB pre čítačky a aplikácie, ktoré ich čítajú; text sádže čítačka
preview-export-latex-missing = Na toto je potrebný LaTeX, ktorý sa nenašiel. Inštaluje sa ako TeX Live.
preview-export-biblatex = Ponechať citácie ako príkazy BibLaTeXu
preview-export-biblatex-hint = Záznamy sa zapíšu do súboru .bib vedľa dokumentu. Citačným štýlom je potom ten štýl BibLaTeXu, ktorý je zvolenému najbližší.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exportovať ako { $kind }
preview-export-run = Exportovať…
preview-export-working = Vytvára sa dokument…
preview-export-failed = Dokument sa nepodarilo vytvoriť.
preview-export-stop = Zastaviť
preview-export-stopped = Vytváranie bolo zastavené. Nezapísal sa žiadny súbor.
# Under the name of the file that was made: another file made with it.
preview-export-also = s { $file }
preview-export-missing = { $count ->
    [one] Jedno citované dielo sa nenašlo a v texte je označené.
    [few] { $count } citované diela sa nenašli a v texte sú označené.
   *[other] { $count } citovaných diel sa nenašlo a v texte sú označené.
}
preview-export-show-in-folder = Zobraziť v priečinku
preview-export-open-failed = Súbor sa nepodarilo otvoriť
preview-export-folder-failed = Priečinok sa nepodarilo otvoriť
preview-export-another = Exportovať ďalší
