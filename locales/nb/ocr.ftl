# Tekst som Tesseract leser fra PDF-er og bilder: i dialogen for dokumenter
# som tas inn, i filene til en referanse, i bildelageret og i
# innstillingene. Se locales/README.md.

## Lesing

ocr-filter = PDF-er og bilder
ocr-no-tesseract = Tesseract, som leser tekst i bilder, er ikke installert eller ble ikke funnet. Installer det med pakkebehandleren på systemet ditt, sammen med dataene for språkene du leser (på Arch: tesseract og tesseract-data-eng, tesseract-data-nor og så videre), eller si i innstillingene hvor det er.
ocr-failed = Teksten kunne ikke leses.
ocr-looking = Ser på { $file }…
ocr-about-picture = Teksten leses fra bildet.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Sidene er bilder med { $dpi } punkter per tomme: for få til at bokstavene kan leses godt, uansett hva som velges.
ocr-low-resolution-text = Å lese dem på nytt vil ikke gjøre teksten PDF-en har, bedre.

ocr-trying = Leser side { $page } …
ocr-tried-nothing = Ingen tekst ble lest på side { $label }.
ocr-tried-blocks = { $count ->
    [one] Vis tekstblokken
   *[other] Vis de { $count } tekstblokkene
}
ocr-tried-blocks-hint = Tekstblokkene Tesseract fant, nummerert i den rekkefølgen den leser dem. To spalter tatt som én, eller noter tatt inn i teksten, leses i feil rekkefølge: et annet oppsett av siden kan skille dem.

ocr-read = Les teksten
ocr-read-pages = { $count ->
    [one] Les én side
   *[other] Les { $count } sider
}
ocr-read-text-pages = Ta sidene som har tekst
ocr-take-text = Ta teksten
ocr-reading = Leser { $file }…
ocr-reading-pages = { $done } av { $total } sider lest
ocr-reading-hint = En side tar noen sekunder. Avbryt stopper lesingen.

## Hvordan teksten leses: det som kan prøves når en lesing går dårlig

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
ocr-searchable-poorly = { $count ->
    [one] Én side ble lest dårlig: { $pages }.
   *[other] { $count } sider ble lest dårlig: { $pages }.
} Prøv en side med et annet språk, eller med frakturmodellen for gotisk skrift.

## En PDF i biblioteket lest inn i et prosjekt, som et tre av elementer

ocr-map-button = Importer teksten i den som et kart…
ocr-map-title = Importer teksten som et kart
ocr-map-into = Inn i prosjektet
ocr-map-new-project = Et nytt prosjekt, oppkalt etter den
ocr-map-make = Importer
ocr-map-making = Importerer…
ocr-map-failed = Elementene kunne ikke lages.

## Teksten i et bilde i lageret

ocr-picture-read = Les teksten i det…
ocr-picture-title = Teksten i bildet
ocr-picture-empty = Ingen tekst ble funnet i bildet.
ocr-picture-copy = Kopier
ocr-picture-copied = Teksten er kopiert
ocr-picture-copy-failed = Teksten kunne ikke kopieres
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

## Hva som er funnet av teksten en PDF har, og hva som kan gjøres med den.

ocr-text-scheme-greek-names = Gresken er lagret som tegnnavnene i { $fonts }, og kan gjøres om til greske bokstaver.
ocr-text-scheme-expert-names = Kapitéler og gammeldagse tall i { $fonts } er lagret ved navn, og kan gjøres om til bokstavene og sifrene sine.
ocr-text-scheme-beta-code = Gresk er skrevet i Beta Code, og kan gjøres om til greske bokstaver.
ocr-text-page = Side { $label }
ocr-text-page-none = Ingen tekst på denne siden: den leses fra et bilde av den.
ocr-text-rest-failed = Sidene etter disse kunne ikke leses.
ocr-searchable-make-readable = Gjør lesbar
ocr-searchable-readable-done = { $count ->
    [one] Teksten i PDF-en er lesbar nå: én skrift fikk bokstavene sine
   *[other] Teksten i PDF-en er lesbar nå: { $count } skrifter fikk bokstavene sine
}

## Formen på sidene, og alfabeter med bokstaver som ligner hverandre (ADR 0045).

ocr-shape = Behold formen på sidene
ocr-shape-hint = Overskrifter, linjer som holdes som linjer, numre i margen, og sidehodene tatt bort. Av blir sidene vanlige avsnitt.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Elementer
ocr-structure-headings = Etter overskriftene
ocr-page-marks = Merk hvor hver side begynner
ocr-page-marks-hint = Et referansemerke med sidetallet, der siden begynte.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Hva som lages av den
ocr-made-headings = { $count ->
    [0] Ingen overskrifter funnet
    [one] Etter den ene overskriften
   *[other] Etter de { $count } overskriftene
}
ocr-made-pages = { $count ->
    [one] Etter den ene siden
   *[other] Etter de { $count } sidene
}
ocr-made-failed = Elementene kunne ikke lages på nytt
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Dette blir laget
ocr-outline-all = Vis alle { $count }

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

# Tesseracts frakturmodell, blant språkene i teksten: oppkalt etter skriften den leser, ikke etter et språk.
ocr-language-fraktur-model = Fraktur (gotisk skrift)
# Glaukopis' egen frakturmodell for dansk og norsk: Tesseracts, lært æ, ø og å.
ocr-language-fraktur-dan-model = Fraktur, dansk og norsk (gotisk skrift)
# Under språkene i teksten, der en modell for gotisk skrift er installert og verken norsk eller dansk er valgt.
ocr-languages-fraktur-hint = Bøker trykt med gotisk skrift, slik norske, danske, svenske og tyske bøker ofte ble før omkring 1900, leses med frakturmodellen, valgt først eller alene, uansett språk. Den kjenner ikke æ, ø og å; norske og danske bøker leses med Fraktur, dansk og norsk, som gjør det.
# Det samme, der norsk eller dansk er valgt.
ocr-languages-fraktur-hint-dan = Norske og danske bøker trykt med gotisk skrift, slik mange ble før omkring 1900, leses med Fraktur, dansk og norsk, valgt først eller alene, uansett hvilke språk som står ved siden av: den kjenner æ, ø og å, som frakturmodellen laget for tysk ikke gjør.

## Stripen med sidene i en PDF, tegnet små, til å velge en side fra.

ocr-strip = Sidene
ocr-strip-page = Side { $number }
# En side som ikke kunne tegnes, der ikke mer er sagt om hvorfor.
ocr-strip-page-failed = Ikke tegnet
# $from og $to: den første og den siste av sidene, talt fra én, som skulle tegnes sammen.
ocr-strip-failed = Side { $from }–{ $to } kunne ikke tegnes.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Slik leser Tesseract
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Prøv side { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Engelsk, siden ingen er valgt
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = svart-hvitt
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Størrelsen på bildet
ocr-picture-fit = Hele siden
ocr-picture-actual = 100 %
ocr-picture-double = 200 %
# The alternative text of the picture of the page in view.
ocr-picture-alt = Side { $label }
ocr-pane-translated = Oversatt etter det skriftene sier
ocr-pane-sound = Leses som tekst
ocr-pane-poor = Leses ikke som tekst: bokstaver i en skrift som ikke sier hvilke de er, eller en dårlig lesning
ocr-pane-tesseract = Det Tesseract leste
ocr-pane-try-hint = Trykk «Prøv side { $page }» for å lese denne siden med innstillingene ved siden av.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Side { $label }:
ocr-confidence-low = Lav sikkerhet ({ $confidence } %)
ocr-confidence-good = God sikkerhet ({ $confidence } %)
ocr-confidence-high = Høy sikkerhet ({ $confidence } %)
ocr-tried-unsure = { $unsure ->
    [0] ingen usikre ord
   *[other] { $unsure } av { $words } ord usikre
}
ocr-tried-low-hint = Under 80 %: prøv et annet språk, frakturmodellen for gotisk skrift eller et annet oppsett av siden.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Lest med en sikkerhet på { $confidence } %
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (leses på ulike måter)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Prøvd med
ocr-trial-confidence = { $confidence } %
ocr-trial-nothing = Ingenting lest
ocr-trial-use = Bruk disse innstillingene

# The pages of the workbench

# Linjen over stripen med sider sier hva hver side får: teksten PDF-en har, eller det Tesseract leser.
ocr-pages-said-pdf = { $pages ->
    [one] Siden tar teksten PDF-en har.
   *[other] Alle de { $pages } sidene tar teksten PDF-en har.
}
ocr-pages-said-read = { $pages ->
    [one] Siden leses med Tesseract.
   *[other] Alle de { $pages } sidene leses med Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] Én side tar teksten PDF-en har;
   *[other] { $pdf } sider tar teksten PDF-en har;
} { $read ->
    [one] én leses med Tesseract.
   *[other] { $read } leses med Tesseract.
}
# Der Tesseract ikke er installert, og sider skal leses.
ocr-pages-said-unreadable = { $pages ->
    [one] Siden kan ikke leses: Tesseract er ikke installert.
   *[other] Ingen av de { $pages } sidene kan leses: Tesseract er ikke installert.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] Én side tar teksten PDF-en har;
   *[other] { $pdf } sider tar teksten PDF-en har;
} { $read ->
    [one] én kan ikke leses uten Tesseract.
   *[other] { $read } kan ikke leses uten Tesseract.
}
ocr-pages-said-picture = Teksten leses fra bildet.
ocr-pages-said-picture-unreadable = Teksten i bildet kan ikke leses uten Tesseract.
# Hva handlingene ved siden av gjelder: hver side, eller dem som er valgt ($pages: «sidene 39–120», slik ocr-pages-selection sier dem).
ocr-pages-scope-all = { $pages ->
    [one] For siden
   *[other] For alle de { $pages } sidene
}
ocr-pages-scope = For { $pages }
# Valgte sider, slik de står i en setning: «side 280», «sidene 3–5, 9».
ocr-pages-selection = { $count ->
    [one] side { $pages }
   *[other] sidene { $pages }
}
ocr-pages-all = Alle sidene
ocr-pages-pdf = PDF-ens tekst
ocr-pages-pdf-hint = Disse sidene tar teksten PDF-en har. Sider uten tekst leses likevel.
ocr-pages-read = Les med Tesseract
ocr-pages-read-hint = Disse sidene leses på nytt fra bilder av dem, uansett hvilken tekst de har.
ocr-pages-decide = Avgjør etter hvor god teksten er
ocr-pages-decide-hint = Side for side: tekst som leses som tekst, tas; tekst som ikke gjør det, og sider uten tekst, leses.
# Merket i hjørnet av en side i stripen, som sier hva den får.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Leses
ocr-strip-source-pdf-hint = Tar teksten PDF-en har.
ocr-strip-source-read-hint = Leses med Tesseract.
ocr-strip-poor = Teksten den har, leses ikke som tekst.
# Båndet over en bolk av sider som leses likt: språkene, oppløsningen der den ikke er 300, oppsettet der det er gitt, og svart-hvitt.
ocr-strip-band-none = Engelsk, der ingen er valgt
ocr-strip-band-dpi = { $dpi } punkter per tomme
# Svart-hvitt, forkortet.
ocr-strip-band-contrast = S/H
ocr-strip-band-hint = { $count ->
    [one] Side { $from }: { $said }
   *[other] Sidene { $from }–{ $to }: { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] Én side
   *[other] { $pages } sider
}
ocr-summary-scanned = skannet med { $dpi } punkter per tomme
ocr-summary-no-text = { $pages ->
    [one] uten egen tekst
   *[other] uten egen tekst
}
ocr-summary-text-all = { $pages ->
    [one] med egen tekst
   *[other] alle med egen tekst
}
ocr-summary-text-some = { $with ->
    [one] én av dem med egen tekst
   *[other] { $with } av dem med egen tekst
}
ocr-summary-poor = { $poor ->
    [one] hvorav én ikke leses som tekst
   *[other] hvorav { $poor } ikke leses som tekst
}
ocr-summary-poor-all = som ikke leses som tekst
# Over the choice of what every page takes.
ocr-summary-whole = Hva sidene får
ocr-summary-mixed = Valgt side for side. Et valg her gjelder alle sidene igjen.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = De gjelder sidene som leses med Tesseract; ingen gjør det nå.
ocr-summary-pages-open = Se på sidene og prøv dem …
ocr-summary-picture-open = Prøv det …
ocr-summary-back = Tilbake til oversikten
