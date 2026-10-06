# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-ar og bilete
ocr-no-tesseract = Tesseract, som les tekst i bilete, er ikkje installert eller vart ikkje funne. Installer det med pakkehandsamaren på systemet ditt, saman med dataa for språka du les (på Arch: tesseract og tesseract-data-eng, tesseract-data-nor og så vidare), eller sei i innstillingane kvar det er.
ocr-failed = Teksten kunne ikkje lesast.
ocr-looking = Ser på { $file } …
ocr-about-picture = Teksten blir lesen frå biletet.
ocr-about-scan = { $pages ->
    [one] PDF-en har ingen tekst: den blir lesen frå eit bilete av sida.
   *[other] Ingen av dei { $pages } sidene har tekst: dei blir lesne frå bilete av dei.
}
ocr-about-some = { $without ->
    [one] Éi av dei { $pages } sidene har ingen tekst, og blir lesen frå eit bilete av den; dei andre blir tekne som dei er.
   *[other] { $without } av dei { $pages } sidene har ingen tekst, og blir lesne frå bilete av dei; dei andre blir tekne som dei er.
}
ocr-about-text = { $pages ->
    [one] Sida har tekst, som blir teken slik den er.
   *[other] Alle sidene har tekst, som blir teken slik den er.
}
ocr-read-all = Les òg sidene som har tekst
ocr-read-all-hint = Teksten deira blir ståande, og det som blir lese, blir lagt over den.
ocr-read-all-map-hint = Det som blir lese, tek plassen til teksten deira: når den er dårleg, eller ikkje kan lesast.
ocr-read = Les teksten
ocr-read-text-pages = Ta sidene som har tekst
ocr-take-text = Ta teksten
ocr-reading = Les { $file } …
ocr-reading-pages = { $done } av { $total } sider lesne
ocr-reading-hint = Ei side tek nokre sekund. Avbryt stoppar lesinga.

## How the text is read: what to try when a reading goes badly

ocr-how = Korleis den blir lesen
ocr-how-dpi = Oppløysing, i punkt per tomme
ocr-how-layout = Oppsettet på sida
ocr-how-layout-auto = Som Tesseract vurderer
ocr-how-layout-column = Éi spalte
ocr-how-layout-block = Éi tekstblokk
ocr-how-layout-sparse = Spreidd tekst
ocr-how-contrast = Svart-kvitt
ocr-how-hint = Det som kan prøvast når ei lesing går dårleg: høgare oppløysing for lita skrift, éi spalte der spalter blir blanda saman, éi tekstblokk for eitt einskilt avsnitt, og svart-kvitt for trykk som er svakt eller ujamt.

## The languages of the text

ocr-languages = Språk i teksten
ocr-languages-hint = Det mest sannsynlege først. Kvart språk til gjer lesinga seinare, og ikkje alltid betre.
ocr-language-add = Legg til eit språk …
ocr-language-remove = Ta bort { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }-skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, eldre
ocr-language-vertical = { $language }, skrive nedover

## A PDF of the library made searchable

ocr-searchable-button = Gjer søkbar …
ocr-searchable-title = Gjer PDF-en søkbar
ocr-searchable-about = { $without ->
    [one] Éi av dei { $pages } sidene har ingen tekst. Den blir lesen, og teksten blir lagd usynleg under det som blir vist, så den kan søkjast i og kopierast. PDF-en ser ut som før.
   *[other] { $without } av dei { $pages } sidene har ingen tekst. Dei blir lesne, og teksten blir lagd usynleg under det som blir vist, så den kan søkjast i og kopierast. PDF-en ser ut som før.
}
ocr-searchable-has-text = { $pages ->
    [one] Sida har tekst: PDF-en er søkbar allereie.
   *[other] Alle sidene har tekst: PDF-en er søkbar allereie.
}
ocr-searchable-damaged = PDF-en kunne ikkje takast frå kvarandre for å endrast: den kan vere skadd. Teksten kan likevel hentast inn i eit prosjekt som eit kart.
ocr-searchable-make = Gjer søkbar
ocr-strip = Ta bort den usynlege teksten dei har, og hald berre på det som blir lese
ocr-strip-hint = For eit tekstlag som er dårleg, slik ein skannar legg det under sida. Bokstavar som synest, blir ståande, og sida ser ut som før.
ocr-searchable-done = { $count ->
    [one] PDF-en er søkbar: éi side vart lesen
   *[other] PDF-en er søkbar: { $count } sider vart lesne
}
ocr-searchable-failed = { $count ->
    [one] Éi side kunne ikkje lesast.
   *[other] { $count } sider kunne ikkje lesast.
}

## A map from a PDF of the library

ocr-map-button = Eit kart av teksten i den …
ocr-map-title = Eit kart av teksten
ocr-map-into = Inn i prosjektet
ocr-map-new-project = Eit nytt prosjekt, kalla opp etter den
ocr-map-making = Lagar kartet …
ocr-map-failed = Kartet kunne ikkje lagast.

## The text of a picture of the store

ocr-picture-read = Les teksten i det …
ocr-picture-title = Teksten i biletet
ocr-picture-empty = Ingen tekst vart funnen i biletet.
ocr-picture-copy = Kopier
ocr-picture-copied = Teksten er kopiert
ocr-picture-map = Lag eit kart av den

## Tesseract in the settings

ocr-settings-looking = Leitar …
ocr-settings-missing = Ikkje funne. Trengst for å lese tekst frå skanna sider og bilete. Installer tesseract med pakkehandsamaren på systemet ditt, saman med dataa for språka du les (tesseract-data-eng for engelsk på Arch, tesseract-data-nor for norsk, tesseract-data-grc for gammalgresk, …), eller sei nedanfor kvar det er.
ocr-settings-by-itself = Funne av seg sjølv
ocr-settings-where = Kvar Tesseract er
ocr-settings-look-failed = Det gjekk ikkje å leite etter Tesseract
ocr-settings-has = Det les { $languages }.
ocr-settings-has-none = Det har ikkje dataa for noko språk: installer dei for eitt, til dømes tesseract-data-eng.
ocr-settings-first = Les på først
ocr-settings-first-hint = Når ingen er valde: språket i teksten og språket i grensesnittet.
ocr-settings-how = Korleis tekst blir lesen først
