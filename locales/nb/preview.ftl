# Forhåndsvisningen og dokumentene som lages: panelet ved siden av kartet,
# opplysningene om dokumentet og eksporten.

## Opplysningene om et dokument: det som står på første side.

preview-details-dialog = Dokumentet
preview-details-dialog-subtitle = Det som står på første side
preview-details-title = Tittel
preview-details-title-placeholder = Navnet på midten av kartet
preview-details-title-hint = Står feltet tomt, blir navnet på midten av kartet tittelen.
preview-details-subtitle = Undertittel
preview-details-authors = Forfattere
preview-details-name = Navn
preview-details-author-name = Navn på forfatter { $number }
preview-details-affiliation = Tilknytning
preview-details-author-affiliation = Tilknytningen til forfatter { $number }
preview-details-email = E-post
preview-details-author-email = E-post til forfatter { $number }
# Ved siden av et pluss, under forfatterne: legger til en.
preview-details-add-author = forfatter
preview-details-abstract = Sammendrag
preview-details-words = { $count } ord
# Ordene i sammendraget, og det meste formatet tillater.
preview-details-words-of = { $count } av { $limit } ord
preview-details-keywords = Nøkkelord
# Nøkkelordene som er gitt, og det meste formatet tillater.
preview-details-keywords-of = { $count } av { $limit }
preview-details-keywords-placeholder = Skilt med komma
preview-details-date = Dato
preview-details-date-placeholder = Slik den skal stå i dokumentet
preview-details-language = Språket i teksten
# Et kart som ikke har fått noe språk, skrives ut på engelsk.
preview-details-language-none = Ikke oppgitt (engelsk)

## Eksporten: filtypene et dokument kan lages som.

preview-export = Eksporter
preview-export-kind = Filtype
preview-export-pdf-about = Slik forhåndsvisningen viser det
preview-export-pdflatex = PDF, satt med LaTeX
preview-export-pdflatex-about = Det samme dokumentet, satt av LaTeX. Det tar litt lenger tid.
preview-export-docx-about = Det de fleste forlag og tidsskrifter ber om
preview-export-odt-about = For LibreOffice Writer og andre
preview-export-latex-about = Til å settes med LuaLaTeX eller XeLaTeX
preview-export-markdown-about = Ren tekst, med kildehenvisningene som nøkler
preview-export-html = Nettside
preview-export-html-about = Én fil, til å leses i en nettleser
preview-export-latex-missing = Dette krever LaTeX, som ikke ble funnet. Det installeres som TeX Live.
preview-export-typst-missing = Dette krever Typst, som ikke ble funnet
preview-export-biblatex = Behold kildehenvisningene som BibLaTeX-kommandoer
preview-export-biblatex-hint = Referansene skrives til en .bib-fil ved siden av dokumentet. Referansestilen blir da den i BibLaTeX som ligger nærmest den som er valgt.
# Tittelen på vinduet der filen får navn; typen er PDF, Word og så videre.
preview-export-as = Eksporter som { $kind }
preview-export-run = Eksporter …
preview-export-working = Lager dokumentet …
preview-export-failed = Dokumentet kunne ikke lages.
# Under navnet på filen som ble laget: en annen fil som ble laget sammen med den.
preview-export-also = med { $file }
preview-export-missing = { $count ->
    [one] Ett verk det vises til, ble ikke funnet, og er merket i teksten.
   *[other] { $count } verk det vises til, ble ikke funnet, og er merket i teksten.
}
preview-export-show-in-folder = Vis i mappen
preview-export-open-failed = Filen kunne ikke åpnes
preview-export-folder-failed = Mappen kunne ikke åpnes
preview-export-another = Eksporter en til
