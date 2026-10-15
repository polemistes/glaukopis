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
ocr-read = Les teksten
ocr-read-text-pages = Ta sidene som har tekst
ocr-take-text = Ta teksten
ocr-reading = Leser { $file }…
ocr-reading-pages = { $done } av { $total } sider lest
ocr-reading-hint = En side tar noen sekunder. Avbryt stopper lesingen.

## Hvordan teksten leses: det som kan prøves når en lesing går dårlig

ocr-how = Hvordan den leses
ocr-how-dpi = Oppløsning, i punkter per tomme
ocr-how-layout = Sidens oppsett
ocr-how-layout-auto = Som Tesseract bedømmer
ocr-how-layout-column = Én spalte
ocr-how-layout-block = Én tekstblokk
ocr-how-layout-sparse = Spredt tekst
ocr-how-contrast = Svart-hvitt
ocr-how-hint = Det som kan prøves når en lesing går dårlig: høyere oppløsning for liten skrift, én spalte der spalter blandes sammen, én tekstblokk for ett enkelt avsnitt, og svart-hvitt for trykk som er svakt eller ujevnt.

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
ocr-searchable-damaged = PDF-en kunne ikke tas fra hverandre for å endres: den kan være skadet. Teksten kan likevel tas inn i et prosjekt som et kart.
ocr-searchable-make = Gjør søkbar
ocr-searchable-done = { $count ->
    [one] PDF-en er søkbar: én side ble lest
   *[other] PDF-en er søkbar: { $count } sider ble lest
}
ocr-searchable-failed = { $count ->
    [one] Én side kunne ikke leses.
   *[other] { $count } sider kunne ikke leses.
}

## En PDF i biblioteket lest inn i et prosjekt, som et tre av elementer

ocr-map-button = Teksten i den som elementer…
ocr-map-title = Teksten som elementer
ocr-map-into = Inn i prosjektet
ocr-map-new-project = Et nytt prosjekt, oppkalt etter den
ocr-map-make = Lag elementene
ocr-map-making = Lager elementene…
ocr-map-failed = Elementene kunne ikke lages.

## Teksten i et bilde i lageret

ocr-picture-read = Les teksten i det…
ocr-picture-title = Teksten i bildet
ocr-picture-empty = Ingen tekst ble funnet i bildet.
ocr-picture-copy = Kopier
ocr-picture-copied = Teksten er kopiert
ocr-picture-map = Lag et element av den

## Tesseract i innstillingene

ocr-settings-looking = Leter…
ocr-settings-missing = Ikke funnet. Trengs for å lese tekst fra skannede sider og bilder. Installer tesseract med pakkebehandleren på systemet ditt, sammen med dataene for språkene du leser (tesseract-data-eng for engelsk på Arch, tesseract-data-nor for norsk, tesseract-data-grc for gammelgresk, …), eller si nedenfor hvor det er.
ocr-settings-by-itself = Finnes av seg selv
ocr-settings-where = Hvor Tesseract er
ocr-settings-look-failed = Det gikk ikke å lete etter Tesseract
ocr-settings-title = Optisk tegngjenkjenning (OCR)
ocr-settings-has-none = Det har ikke dataene for noe språk: importer ett nedenfor, eller installer ett med pakkebehandleren på systemet, for eksempel tesseract-data-eng.
ocr-settings-first = Standardspråk for OCR
ocr-settings-how = Standardinnstillinger for OCR
ocr-settings-languages = Språk for OCR
ocr-settings-languages-hint = Glaukopis bruker Tesseract til OCR. Språkfilene du importerer her, brukes i stedet for dem du kan ha installert på systemet ditt.
ocr-source-system = System
ocr-source-imported = Importert
ocr-settings-not-found = Tesseract ble ikke funnet. Si hvor det er under Programmer, nedenfor.

## Hva som blir av teksten en PDF har (det samme i hver dialog som leser en).

ocr-text-title = Teksten PDF-en har
ocr-text-poor = { $poor ->
    [one] På én av de { $pages } sidene som har tekst, leses den ikke som tekst, slik det blir når en skrift ikke sier hvilke bokstaver den viser, eller en lesning var dårlig.
   *[other] På { $poor } av de { $pages } sidene som har tekst, leses den ikke som tekst, slik det blir når en skrift ikke sier hvilke bokstaver den viser, eller en lesning var dårlig.
}
ocr-text-poor-all = { $pages ->
    [one] Teksten PDF-en har, leses ikke som tekst, slik det blir når en skrift ikke sier hvilke bokstaver den viser, eller en lesning var dårlig.
   *[other] På alle de { $pages } sidene som har tekst, leses den ikke som tekst, slik det blir når en skrift ikke sier hvilke bokstaver den viser, eller en lesning var dårlig.
}
ocr-text-keep = Behold teksten PDF-en har
ocr-text-keep-hint = Bare sidene uten tekst leses; de andre tas som de er.
ocr-text-keep-searchable-hint = Bare sidene uten tekst leses; de andre beholder teksten de har.
ocr-text-anew = Les hver side på nytt med Tesseract
ocr-text-anew-hint = Bare det Tesseract leser fra bilder av sidene, beholdes; teksten PDF-en har, tas ikke fra noen side.
ocr-text-anew-searchable-hint = Den usynlige teksten sidene har, tas bort, og det som leses, legges i stedet. Sidene ser ut som før.
ocr-about-anew = { $pages ->
    [one] Siden leses på nytt, fra et bilde av den.
   *[other] Alle { $pages } sidene leses på nytt, fra bilder av dem.
}
ocr-searchable-anew = { $pages ->
    [one] Siden leses på nytt, og teksten legges usynlig under det som vises, i stedet for den den hadde. PDF-en ser ut som før.
   *[other] Alle { $pages } sidene leses på nytt, og teksten legges usynlig under det som vises, i stedet for den de hadde. PDF-en ser ut som før.
}

## Hva som er funnet av teksten en PDF har, og hva som kan gjøres med den.

ocr-text-found = Tekst på { $withText } av { $pages } sider, i { $fonts }.
ocr-text-found-no-fonts = Tekst på { $withText } av { $pages } sider.
ocr-text-fonts-more = { $fonts } og { $count ->
    [one] én til
   *[other] { $count } til
}
ocr-text-scheme-greek-names = Gresken er lagret som tegnnavnene i { $fonts }, og kan gjøres om til greske bokstaver.
ocr-text-scheme-expert-names = Kapitéler og gammeldagse tall i { $fonts } er lagret ved navn, og kan gjøres om til bokstavene og sifrene sine.
ocr-text-scheme-beta-code = Gresk er skrevet i Beta Code, og kan gjøres om til greske bokstaver.
ocr-text-translate = Oversett den til lesbar tekst
ocr-text-translate-hint = Teksten gjøres lesbar ut fra det skriftene sier om bokstavene sine; ingen side leses fra et bilde for det.
ocr-text-translate-searchable-hint = PDF-ens egne tabeller rettes, så hver leser kopierer og søker i teksten riktig; ingenting av det som vises, endres.
ocr-text-anew-no-tesseract = Tesseract, som leser tekst i bilder, er ikke installert.
ocr-text-page = Side { $label }
ocr-text-page-none = Ingen tekst på denne siden: den leses fra et bilde av den.
ocr-about-translate = { $without ->
    [0] Teksten PDF-en har, gjøres lesbar; ingen side leses fra et bilde.
    [one] Teksten PDF-en har, gjøres lesbar, og den ene siden uten tekst leses fra et bilde av den.
   *[other] Teksten PDF-en har, gjøres lesbar, og de { $without } sidene uten tekst leses fra bilder av dem.
}
ocr-searchable-translate = { $without ->
    [0] Skriftene i PDF-en får bokstavene sine, så teksten kan kopieres og søkes i riktig. PDF-en ser ut som før.
    [one] Skriftene i PDF-en får bokstavene sine, og den ene siden uten tekst leses og får tekst. PDF-en ser ut som før.
   *[other] Skriftene i PDF-en får bokstavene sine, og de { $without } sidene uten tekst leses og får tekst. PDF-en ser ut som før.
}
ocr-searchable-make-readable = Gjør lesbar
ocr-searchable-readable-done = { $count ->
    [one] Teksten i PDF-en er lesbar nå: én skrift fikk bokstavene sine
   *[other] Teksten i PDF-en er lesbar nå: { $count } skrifter fikk bokstavene sine
}

## Formen på sidene, og alfabeter med bokstaver som ligner hverandre (ADR 0045).

ocr-shape = Behold formen på sidene
ocr-shape-hint = Overskrifter, linjer som holdes som linjer, numre i margen, og sidehodene tatt bort. Av blir sidene vanlige avsnitt.

# Tekststilene som går igjen ved siden av brødteksten, vist etter lesingen, så den som skriver kan si hva hver er.
ocr-styles-title = Stiler funnet
ocr-styles-about = { $count ->
    [one] Én tekststil går igjen ved siden av brødteksten. Si hva den er, eller la den være tekst.
   *[other] { $count } tekststiler går igjen ved siden av brødteksten. Si hva hver av dem er, eller la dem være tekst.
}
# Hvor ofte en stil forekommer: «12 ganger på 9 sider».
ocr-styles-often = { $count ->
    [one] Én gang
   *[other] { $count } ganger
} på { $pages ->
    [one] én side
   *[other] { $pages } sider
}
ocr-styles-kind = Hva det er
ocr-styles-own = Et eget slag …
ocr-styles-own-name = Navn på slaget
ocr-styles-own-hint = Lages når dokumentet tas inn, uten eget utseende før du gir det et.
# Første gjetning på navnet til et eget slag: utseendet til stilen i ord, satt sammen som «{ $look } tekst», «Mindre kursiv tekst», «Innrykket tekst», eller for linjer som holdes som linjer, «{ $look } linjer», «Linjer». $kept er yes for linjer som holdes, så ordene for utseendet kan bøyes etter det.
ocr-style-guess = { $kept ->
    [yes] { $look } linjer
   *[other] { $look } tekst
}
ocr-style-indented = { $kept ->
    [yes] innrykkede
   *[other] innrykket
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] større
}
ocr-style-bold = { $kept ->
    [yes] halvfete
   *[other] halvfet
}
ocr-style-italic = { $kept ->
    [yes] kursive
   *[other] kursiv
}
# En stil som skiller seg fra brødteksten bare ved skriften.
ocr-style-family = Tekst i { $family }
ocr-style-other = Annen tekst
# Et alfabet blant de valgte språkene, slik det står i advarselen under: «det greske alfabetet leses sammen med det latinske».
ocr-script = { $script ->
    [Greek] greske
    [Cyrillic] kyrilliske
   *[Latin] latinske
}
# $alike: bokstavene som ligner hverandre, parvis, det første alfabetets først: «ϲ c, ο o, ν v».
ocr-languages-scripts-alike = Det { $a } alfabetet leses sammen med det { $b }: bokstaver som ligner hverandre i de to ({ $alike }), leses ofte som hverandre, og hele ord blir feil. For bare ett alfabet, ta de andre bort.
