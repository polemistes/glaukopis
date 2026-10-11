# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Náhled
# The last among the reference styles, which opens the search for more.
preview-style-more = Další styly…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Přejít na toto místo v textu
# Moves the pages to where the element the text is at begins.
preview-show-text = Ukázat, kde text je
preview-hide = Skrýt náhled
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } není nainstalován
preview-programs-needed = Náhled a export se vytvářejí Pandocem a Typstem. Nainstalujte je správcem balíčků svého systému, nebo řekněte v nastavení, kde jsou.
preview-look-again = Hledat znovu
preview-looking-failed = Programy nelze hledat
preview-reading-failed = Styly a formáty nelze přečíst
preview-failed = Náhled nelze vytvořit
preview-failed-message = Náhled nelze vytvořit.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Strana { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } strana
    [few] { $count } strany
   *[other] { $count } stran
}
preview-words = { $count ->
    [one] { $count } slovo
    [few] { $count } slova
   *[other] { $count } slov
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } z { $limit } slova
    [few] { $count } ze { $limit } slov
   *[other] { $count } z { $limit } slov
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } s poznámkami
preview-remarks-count = { $count ->
    [one] { $count } upozornění
    [few] { $count } upozornění
   *[other] { $count } upozornění
}
preview-remarks = Upozornění
preview-remarks-font = Písmo
preview-font-missing = { $font } není nainstalováno.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Místo něj se používá { $font }, zde v náhledu i ve vytvořeném PDF. V dokumentu exportovaném pro Word, LibreOffice nebo LaTeX je písmo pojmenováno, jak žádá formát, a má je ten, kdo dokument otevře a písmo má.
preview-remarks-references = Záznamy
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } citované dílo nebylo nalezeno,
    [few] { $count } citovaná díla nebyla nalezena,
   *[other] { $count } citovaných děl nebylo nalezeno,
}
preview-works-missing-where = ani ve vaší knihovně, ani v projektu. V textu jsou označena.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Řečeno při vytváření dokumentu

## The export: the kinds of file a document is made as.

preview-export = Export
preview-export-kind = Druh souboru
preview-export-pdf-about = Jak jej ukazuje náhled
preview-export-pdflatex = PDF vysázené LaTeXem
preview-export-pdflatex-about = Týž dokument v sazbě LaTeXu. Trvá o něco déle.
preview-export-docx-about = Co žádá většina nakladatelů a časopisů
preview-export-odt-about = Pro LibreOffice Writer a jiné
preview-export-latex-about = K vysázení LuaLaTeXem nebo XeLaTeXem
preview-export-markdown-about = Prostý text, s citacemi jako klíči
preview-export-html = Webová stránka
preview-export-html-about = Jeden soubor, ke čtení v prohlížeči
preview-export-epub = E-kniha
preview-export-epub-about = EPUB, pro čtečky a aplikace, které je čtou; text sází čtečka
preview-export-latex-missing = K tomu je potřeba LaTeX, který nebyl nalezen. Instaluje se jako TeX Live.
preview-export-biblatex = Ponechat citace jako příkazy BibLaTeXu
preview-export-biblatex-hint = Záznamy se zapíší do souboru .bib vedle dokumentu. Citační styl je pak ten styl BibLaTeXu, který je zvolenému nejblíž.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exportovat jako { $kind }
preview-export-run = Exportovat…
preview-export-working = Vytváří se dokument…
preview-export-failed = Dokument nelze vytvořit.
preview-export-stop = Zastavit
preview-export-stopped = Vytváření bylo zastaveno. Žádný soubor nebyl zapsán.
# Under the name of the file that was made: another file made with it.
preview-export-also = s { $file }
preview-export-missing = { $count ->
    [one] Jedno citované dílo nebylo nalezeno a je v textu označeno.
    [few] { $count } citovaná díla nebyla nalezena a jsou v textu označena.
   *[other] { $count } citovaných děl nebylo nalezeno a jsou v textu označena.
}
preview-export-show-in-folder = Zobrazit ve složce
preview-export-open-failed = Soubor nelze otevřít
preview-export-folder-failed = Složku nelze otevřít
preview-export-another = Exportovat další
