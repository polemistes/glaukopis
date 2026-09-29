# Tekst som Tesseract leser fra PDF-er og bilder: i dialogen for dokumenter
# som tas inn, i filene til en referanse, i bildelageret og i
# innstillingene. Se locales/README.md.

## Lesing

ocr-filter = PDF-er og bilder
ocr-no-tesseract = Tesseract, som leser tekst i bilder, er ikke installert eller ble ikke funnet. Installer det med pakkebehandleren på systemet ditt, sammen med dataene for språkene du leser (på Arch: tesseract og tesseract-data-eng, tesseract-data-nor og så videre), eller si i innstillingene hvor det er.
ocr-failed = Teksten kunne ikke leses.
ocr-looking = Ser på { $file }…
ocr-about-picture = Teksten leses fra bildet.
ocr-about-scan = { $pages ->
    [one] PDF-en har ingen tekst: den leses fra et bilde av siden.
   *[other] Ingen av de { $pages } sidene har tekst: de leses fra bilder av dem.
}
ocr-about-some = { $without ->
    [one] Én av de { $pages } sidene har ingen tekst, og leses fra et bilde av den; de andre tas som de er.
   *[other] { $without } av de { $pages } sidene har ingen tekst, og leses fra bilder av dem; de andre tas som de er.
}
ocr-about-text = { $pages ->
    [one] Siden har tekst, som tas slik den er.
   *[other] Alle sidene har tekst, som tas slik den er.
}
ocr-read-all = Les også sidene som har tekst
ocr-read-all-hint = Teksten deres blir stående, og det som leses, legges over den.
ocr-read-all-map-hint = Det som leses, tar plassen til teksten deres: når den er dårlig, eller ikke kan leses.
ocr-read = Les teksten
ocr-read-text-pages = Ta sidene som har tekst
ocr-take-text = Ta teksten
ocr-reading = Leser { $file }…
ocr-reading-pages = { $done } av { $total } sider lest
ocr-reading-hint = En side tar noen sekunder. Avbryt stopper lesingen.

## Språkene teksten er skrevet på

ocr-languages = Språk i teksten
ocr-languages-hint = Det mest sannsynlige først. Hvert språk til gjør lesingen langsommere, og ikke alltid bedre.
ocr-language-add = Legg til et språk…
ocr-language-remove = Ta bort { $language }
# En skrift heller enn et språk: «latinsk skrift».
ocr-language-script = { $script }-skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, eldre
ocr-language-vertical = { $language }, skrevet nedover

## En PDF i biblioteket gjort søkbar

ocr-searchable-button = Gjør søkbar…
ocr-searchable-title = Gjør PDF-en søkbar
ocr-searchable-about = { $without ->
    [one] Én av de { $pages } sidene har ingen tekst. Den leses, og teksten legges usynlig under det som vises, så den kan søkes i og kopieres. PDF-en ser ut som før.
   *[other] { $without } av de { $pages } sidene har ingen tekst. De leses, og teksten legges usynlig under det som vises, så den kan søkes i og kopieres. PDF-en ser ut som før.
}
ocr-searchable-has-text = { $pages ->
    [one] Siden har tekst: PDF-en er søkbar allerede.
   *[other] Alle sidene har tekst: PDF-en er søkbar allerede.
}
ocr-searchable-make = Gjør søkbar
ocr-searchable-done = { $count ->
    [one] PDF-en er søkbar: én side ble lest
   *[other] PDF-en er søkbar: { $count } sider ble lest
}
ocr-searchable-failed = { $count ->
    [one] Én side kunne ikke leses.
   *[other] { $count } sider kunne ikke leses.
}

## Teksten i et bilde i lageret

ocr-picture-read = Les teksten i det…
ocr-picture-title = Teksten i bildet
ocr-picture-empty = Ingen tekst ble funnet i bildet.
ocr-picture-copy = Kopier
ocr-picture-copied = Teksten er kopiert
ocr-picture-map = Lag et kart av den

## Tesseract i innstillingene

ocr-settings-looking = Leter…
ocr-settings-missing = Ikke funnet. Trengs for å lese tekst fra skannede sider og bilder. Installer tesseract med pakkebehandleren på systemet ditt, sammen med dataene for språkene du leser (tesseract-data-eng for engelsk på Arch, tesseract-data-nor for norsk, tesseract-data-grc for gammelgresk, …), eller si nedenfor hvor det er.
ocr-settings-by-itself = Finnes av seg selv
ocr-settings-where = Hvor Tesseract er
ocr-settings-look-failed = Det gikk ikke å lete etter Tesseract
ocr-settings-has = Det leser { $languages }.
ocr-settings-has-none = Det har ikke dataene for noe språk: installer dem for ett, for eksempel tesseract-data-eng.
ocr-settings-first = Les på først
ocr-settings-first-hint = Når ingen er valgt: språket i teksten og språket i grensesnittet.
