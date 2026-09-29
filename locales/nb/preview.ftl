# Forhåndsvisningen og dokumentene som lages: panelet ved siden av kartet,
# opplysningene om dokumentet og eksporten.

## Panelet ved siden av kartet, og det som velges over det.

preview = Forhåndsvisning
# Med små bokstaver, over valget av dokumentformat.
preview-format = Format
preview-format-label = Dokumentformat
# Med små bokstaver, over valget av referansestil.
preview-style = Referanser
preview-style-label = Referansestil
# Det siste blant referansestilene, som åpner søket etter flere.
preview-style-more = Flere stiler …
preview-change = Endre formatet eller stilen
preview-change-format = Endre dette formatet …
preview-change-format-hint = Side, skrift, avstand, overskrifter
preview-change-style = Endre denne referansestilen …
preview-change-style-hint = Etter et forlags ønsker
preview-details = Tittel, forfattere, sammendrag
preview-hide = Skjul forhåndsvisningen
# Når et format som hører sammen med en referansestil velges, tas stilen med.
preview-style-taken = Referansestilen er nå { $style }
preview-style-taken-why = Det er den som hører til dette formatet.
preview-style-keep-other = Behold den andre
# Programmet er Pandoc, Typst eller LaTeX.
preview-program-missing = { $program } er ikke installert
preview-programs-needed = Forhåndsvisning og eksport lages med Pandoc og Typst. Installer dem med pakkebehandleren på systemet ditt, eller oppgi i innstillingene hvor de ligger.
preview-look-again = Se etter igjen
preview-looking-failed = Kunne ikke se etter programmene
preview-reading-failed = Stilene og formatene kunne ikke leses
preview-failed = Forhåndsvisningen kunne ikke lages
preview-failed-message = Forhåndsvisningen kunne ikke lages.
# En side i forhåndsvisningen, slik den beskrives for dem som ikke kan se den.
preview-page = Side { $number }
# Navnet på en eksportert fil der kartet ikke har noe.
preview-file-name = dokument

## Nederst i forhåndsvisningen: hvor langt dokumentet er, og hva som er å merke seg.

preview-pages = { $count ->
    [one] { $count } side
   *[other] { $count } sider
}
preview-words = { $count } ord
# Ordene i teksten, og det meste formatet tillater.
preview-words-of = { $count } av { $limit } ord
# Ordene i teksten og i notene til sammen.
preview-words-with-notes = { $count } med noter
preview-remarks-count = { $count ->
    [one] { $count } merknad
   *[other] { $count } merknader
}
preview-remarks = Merknader
preview-remarks-font = Skrift
preview-font-missing = { $font } er ikke installert.
# Det første navnet er skriften formatet ber om; dette er den som brukes i stedet.
preview-font-substitute = { $font } brukes i stedet, her i forhåndsvisningen og i en PDF som lages. I et dokument som eksporteres til Word, LibreOffice eller LaTeX, oppgis skriften slik formatet ber om, og den er der for den som åpner dokumentet og har den.
preview-remarks-references = Referanser
# Med fet skrift, og det neste følger etter i samme setning.
preview-works-missing = { $count } verk det vises til, ble ikke funnet,
preview-works-missing-where = verken i biblioteket ditt eller i prosjektet. Stedene er merket i teksten.
# Over det Pandoc og Typst sa mens de laget dokumentet.
preview-remarks-warnings = Meldinger mens dokumentet ble laget

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
preview-export-pdflatex-about = Det samme dokumentet, satt med LaTeX. Det tar litt lenger tid.
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
