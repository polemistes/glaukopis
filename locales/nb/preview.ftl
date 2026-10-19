# Forhåndsvisningen og dokumentene som lages: panelet ved siden av teksten,
# og eksporten.

## Panelet ved siden av kartet, og det som velges over det.

preview = Forhåndsvisning
# Med små bokstaver, over navnene på malen, oppsettet og referansestilen som brukes, som åpner dokumentinnstillingene.
preview-made-by = Mal, oppsett, referanser
# Det siste blant referansestilene, som åpner søket etter flere.
preview-style-more = Flere stiler …
# Viser i teksten elementet som står der i sidene det ses på.
preview-go-to-text = Gå til dette stedet i teksten
# Flytter sidene dit elementet teksten står i, begynner.
preview-show-text = Vis hvor teksten er
preview-hide = Skjul forhåndsvisningen
# Programmet er Pandoc, Typst eller LaTeX.
preview-program-missing = { $program } er ikke installert
preview-programs-needed = Forhåndsvisning og eksport lages med Pandoc og Typst. Installer dem med pakkebehandleren på systemet ditt, eller oppgi i innstillingene hvor de ligger.
preview-look-again = Se etter igjen
preview-looking-failed = Kunne ikke se etter programmene
preview-reading-failed = Stilene, oppsettene og malene kunne ikke leses
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
# Ordene i teksten, og det meste malen tillater.
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
# Det første navnet er skriften oppsettet ber om; dette er den som brukes i stedet.
preview-font-substitute = { $font } brukes i stedet, her i forhåndsvisningen og i en PDF som lages. I et dokument som eksporteres til Word, LibreOffice eller LaTeX, oppgis skriften slik oppsettet ber om, og den er der for den som åpner dokumentet og har den.
preview-remarks-references = Referanser
# Med fet skrift, og det neste følger etter i samme setning.
preview-works-missing = { $count } verk det vises til, ble ikke funnet,
preview-works-missing-where = verken i biblioteket ditt eller i prosjektet. Stedene er merket i teksten.
# Over det Pandoc og Typst sa mens de laget dokumentet.
preview-remarks-warnings = Meldinger mens dokumentet ble laget

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
preview-export-epub = E-bok
preview-export-epub-about = EPUB, for lesebrett og appene som leser dem; leseren setter teksten
preview-export-latex-missing = Dette krever LaTeX, som ikke ble funnet. Det installeres som TeX Live.
preview-export-biblatex = Behold kildehenvisningene som BibLaTeX-kommandoer
preview-export-biblatex-hint = Referansene skrives til en .bib-fil ved siden av dokumentet. Referansestilen blir da den i BibLaTeX som ligger nærmest den som er valgt.
# Tittelen på vinduet der filen får navn; typen er PDF, Word og så videre.
preview-export-as = Eksporter som { $kind }
preview-export-run = Eksporter …
preview-export-working = Lager dokumentet …
preview-export-failed = Dokumentet kunne ikke lages.
preview-export-stop = Stopp
preview-export-stopped = Lagingen ble stoppet. Ingen fil ble skrevet.
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

## Hva en linje på en side er: merkelappen i kanten av siden som sier hva
## linjen pekeren hviler på er og åpner Utseende der, og bryteren nederst.

# På merkelappen: hva linjen er.
preview-what-text = Tekst
# En overskrift, etter nivået: Overskrift 1, Overskrift 2.
preview-what-heading = Overskrift { $level }
preview-what-note = Note
preview-what-bibliography = Litteraturliste
preview-what-figure = Figur
preview-what-table = Tabell
preview-what-front = Forside
# Det merkelappen gjør, slik det sies til dem som ikke kan se den; hva linjen er: Sitat, Overskrift 1.
preview-what-open = Hvordan «{ $what }» ser ut …
# Bryteren nederst i forhåndsvisningen, mens merkelappene ikke vises og mens de vises.
preview-chips = Vis hva linjene på siden er
preview-chips-off = Skjul hva linjene er
