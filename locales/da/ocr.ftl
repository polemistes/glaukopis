# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF'er og billeder
ocr-no-tesseract = Tesseract, som læser tekst i billeder, er ikke installeret eller blev ikke fundet. Installer det med dit systems pakkehåndtering, sammen med dataene for de sprog, du læser (på Arch: tesseract og tesseract-data-eng, tesseract-data-dan og så videre), eller sig i indstillingerne, hvor det er.
ocr-failed = Teksten kunne ikke læses.
ocr-looking = Ser på { $file }…
ocr-about-picture = Teksten læses fra billedet.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Siderne er billeder med { $dpi } punkter pr. tomme: for få til, at deres bogstaver kan læses godt, hvad der end vælges.
ocr-low-resolution-text = At læse dem igen gør ikke den tekst, PDF'en har, bedre.

ocr-trying = Læser side { $page }…
ocr-tried-nothing = Der blev ikke læst nogen tekst på side { $label }.
ocr-tried-blocks = { $count ->
    [one] Vis tekstblokken
   *[other] Vis de { $count } tekstblokke
}
ocr-tried-blocks-hint = De tekstblokke, Tesseract fandt, nummereret i den rækkefølge, det læser dem. To spalter taget som én, eller noter taget ind i teksten, læses i forkert rækkefølge: en anden opsætning af siden kan skille dem ad.

ocr-read = Læs teksten
ocr-read-pages = { $count ->
    [one] Læs én side
   *[other] Læs { $count } sider
}
ocr-read-text-pages = Tag de sider, der har tekst
ocr-take-text = Tag teksten
ocr-reading = Læser { $file }…
ocr-reading-pages = { $done } af { $total } sider læst
ocr-reading-hint = En side tager nogle sekunder. Annuller standser læsningen.

## How the text is read: what to try when a reading goes badly

ocr-how-dpi = Opløsning, i punkter pr. tomme
ocr-how-layout = Sidens opsætning
ocr-how-layout-auto = Som Tesseract bedømmer det
ocr-how-layout-column = Én spalte
ocr-how-layout-block = Én tekstblok
ocr-how-layout-sparse = Spredt tekst
ocr-how-contrast = Sort-hvid
ocr-how-hint = Hvad der kan prøves, når en læsning går dårligt: en højere opløsning til lille skrift, én spalte, hvor spalter blandes sammen, én tekstblok til et enkelt afsnit, og sort-hvid til tryk, der er svagt eller ujævnt.

## The languages of the text

ocr-languages = Tekstens sprog
ocr-languages-hint = Det mest sandsynlige først. Hvert sprog mere gør læsningen langsommere, og ikke altid bedre.
ocr-language-add = Tilføj et sprog…
ocr-language-remove = Fjern { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }-skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, ældre
ocr-language-vertical = { $language }, skrevet lodret

## A PDF of the library made searchable

ocr-searchable-button = Gør søgbar…
ocr-searchable-title = Gør PDF'en søgbar
ocr-searchable-damaged = PDF'en kunne ikke skilles ad for at blive ændret: den kan være beskadiget. Dens tekst kan stadig hentes ind i et projekt som et kort.
ocr-searchable-make = Gør søgbar
ocr-searchable-done = { $count ->
    [one] PDF'en er søgbar: én side blev læst
   *[other] PDF'en er søgbar: { $count } sider blev læst
}
ocr-searchable-failed = { $count ->
    [one] Én side kunne ikke læses.
   *[other] { $count } sider kunne ikke læses.
}
ocr-searchable-poorly = { $count ->
    [one] Én side blev læst dårligt: { $pages }.
   *[other] { $count } sider blev læst dårligt: { $pages }.
} Prøv en side med et andet sprog eller med frakturmodellen til gotisk skrift.

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importer dens tekst som et kort…
ocr-map-title = Importer teksten som et kort
ocr-map-into = Ind i projektet
ocr-map-new-project = Et nyt projekt, opkaldt efter den
ocr-map-make = Importer
ocr-map-making = Importerer…
ocr-map-failed = Elementerne kunne ikke laves.

## The text of a picture of the store

ocr-picture-read = Læs teksten i det…
ocr-picture-title = Teksten i billedet
ocr-picture-empty = Der blev ikke fundet nogen tekst i billedet.
ocr-picture-copy = Kopiér
ocr-picture-copied = Teksten er kopieret
ocr-picture-copy-failed = Teksten kunne ikke kopieres
ocr-picture-map = Lav et element af den

## Tesseract in the settings

ocr-settings-looking = Leder…
ocr-settings-missing = Ikke fundet. Behøves for at læse tekst fra skanninger og billeder. Installer tesseract med dit systems pakkehåndtering, sammen med dataene for de sprog, du læser (tesseract-data-eng for engelsk på Arch, tesseract-data-dan for dansk, tesseract-data-grc for oldgræsk, …), eller sig nedenfor, hvor det er.
ocr-settings-by-itself = Fundet af sig selv
ocr-settings-where = Hvor Tesseract er
ocr-settings-look-failed = Der kunne ikke ledes efter Tesseract
ocr-settings-title = Tekstgenkendelse (OCR)
ocr-settings-has-none = Det har ingen sprogs data: importer et nedenfor, eller installer et med dit systems pakkehåndtering, såsom tesseract-data-eng.
ocr-settings-first = Standardsprog til OCR
ocr-settings-how = Standardindstillinger til OCR
ocr-settings-languages = Sprog til OCR
ocr-settings-languages-hint = Glaukopis bruger Tesseract til OCR. De sprogfiler, du importerer her, bruges i stedet for dem, du måtte have installeret på dit system.
ocr-source-system = System
ocr-source-imported = Importeret
ocr-settings-not-found = Tesseract blev ikke fundet. Angiv, hvor det er, under Programmer nedenfor.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = PDF'ens tekst

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Den græske tekst er gemt som glyffernes navne i { $fonts } og kan gøres til græske bogstaver.
ocr-text-scheme-expert-names = Kapitæler og minuskeltal i { $fonts } er gemt ved navn og kan gøres til deres bogstaver og cifre.
ocr-text-scheme-beta-code = Græsk er skrevet i Beta Code og kan gøres til græske bogstaver.
ocr-text-page = Side { $label }
ocr-text-page-none = Ingen tekst på denne side: den læses fra et billede af den.
ocr-text-rest-failed = Siderne efter disse kunne ikke læses.
ocr-searchable-make-readable = Gør læsbar
ocr-searchable-readable-done = { $count ->
    [one] PDF'ens tekst er læsbar nu: én skrift fik sine bogstaver
   *[other] PDF'ens tekst er læsbar nu: { $count } skrifter fik deres bogstaver
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Bevar sidernes form
ocr-shape-hint = Overskrifter, linjer bevaret som linjer, numre i margenen, og sidehovederne udeladt. Slået fra bliver siderne almindelige afsnit.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Elementer
ocr-structure-headings = Efter overskrifterne
ocr-page-marks = Angiv, hvor hver side begynder
ocr-page-marks-hint = Et stedmærke med sidens nummer, der hvor den begyndte.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Hvad der laves af den
ocr-made-headings = { $count ->
    [0] Ingen overskrifter fundet
    [one] Efter dens ene overskrift
   *[other] Efter dens { $count } overskrifter
}
ocr-made-pages = { $count ->
    [one] Efter dens ene side
   *[other] Efter dens { $count } sider
}
ocr-made-failed = Elementerne kunne ikke laves igen
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Det, der bliver lavet
ocr-outline-all = Vis alle { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Fundne typografier
ocr-styles-about = { $count ->
    [one] Én typografi går igen ved siden af brødteksten. Sig, hvad den er, eller lad den være tekst.
   *[other] { $count } typografier går igen ved siden af brødteksten. Sig, hvad hver af dem er, eller lad dem være tekst.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Én gang
   *[other] { $count } gange
} på { $pages ->
    [one] én side
   *[other] { $pages } sider
}
ocr-styles-kind = Hvad den er
ocr-styles-own = En egen art…
ocr-styles-own-name = Artens navn
ocr-styles-own-hint = Laves, når dokumentet hentes ind, uden eget udseende, til du giver den et.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } bevarede linjer
   *[other] { $look } tekst
}
ocr-style-indented = { $kept ->
    [yes] indrykkede
   *[other] indrykket
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] større
}
ocr-style-bold = { $kept ->
    [yes] fede
   *[other] fed
}
ocr-style-italic = { $kept ->
    [yes] kursive
   *[other] kursiv
}
# A style that differs from the body only by its font.
ocr-style-family = Tekst i { $family }
ocr-style-other = Anden tekst
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] græske
    [Cyrillic] kyrilliske
   *[Latin] latinske
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Det { $a } alfabet læses sammen med det { $b }: bogstaver, der ligner hinanden i de to ({ $alike }), læses ofte som hinanden, og hele ord bliver forkerte. Vil du kun have ét alfabet, så fjern de andre.

# Tesseract's Fraktur model, among the languages of the text: named for the type it reads, not for a language.
ocr-language-fraktur-model = Fraktur (gotisk skrift)
# Glaukopis's own Fraktur model for Danish and Norwegian: Tesseract's taught æ, ø and å.
ocr-language-fraktur-dan-model = Fraktur, dansk og norsk (gotisk skrift)
# Under the languages of the text, where a model of Gothic type is installed and neither Norwegian nor Danish is chosen.
ocr-languages-fraktur-hint = Bøger med gotisk skrift, som norske, danske, svenske og tyske bøger ofte var trykt med før omkring 1900, læses med frakturmodellen, valgt først eller alene, uanset deres sprog. Den kender ikke æ, ø og å; danske og norske bøger læses med Fraktur, dansk og norsk, som gør.
# The same, where Norwegian or Danish is chosen.
ocr-languages-fraktur-hint-dan = Danske og norske bøger med gotisk skrift, som mange var trykt med før omkring 1900, læses med Fraktur, dansk og norsk, valgt først eller alene, uanset hvilke sprog der står ved siden af: den kender æ, ø og å, hvilket frakturmodellen, der er lavet til tysk, ikke gør.

## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = Siderne
ocr-strip-page = Side { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Ikke tegnet
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Siderne { $from }–{ $to } kunne ikke tegnes.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Sådan læser Tesseract
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Prøv side { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Engelsk, da intet er valgt
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = s/h
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Billedets størrelse
ocr-picture-fit = Hele siden
ocr-picture-actual = 100 %
ocr-picture-double = 200 %
# The alternative text of the picture of the page in view.
ocr-picture-alt = Side { $label }
ocr-pane-translated = Oversat efter det, skrifterne siger
ocr-pane-sound = Læses som tekst
ocr-pane-poor = Læses ikke som tekst: bogstaver i en skrift, der ikke siger, hvilke de er, eller en dårlig læsning
ocr-pane-tesseract = Det, Tesseract læste
ocr-pane-try-hint = Tryk på »Prøv side { $page }« for at læse denne side med indstillingerne ved siden af.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Side { $label }:
ocr-confidence-low = Lav sikkerhed ({ $confidence } %)
ocr-confidence-good = God sikkerhed ({ $confidence } %)
ocr-confidence-high = Høj sikkerhed ({ $confidence } %)
ocr-tried-unsure = { $unsure ->
    [0] intet ord usikkert
    [one] { $unsure } af { $words } ord usikkert
   *[other] { $unsure } af { $words } ord usikre
}
ocr-tried-low-hint = Under 80 %: prøv et andet sprog, frakturmodellen til gotisk skrift eller en anden opsætning af siden.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Læst med en sikkerhed på { $confidence } %
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (læses på forskellige måder)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Prøvet med
ocr-trial-confidence = { $confidence } %
ocr-trial-nothing = Intet læst
ocr-trial-use = Brug disse indstillinger

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] Siden tager den tekst, PDF'en har.
   *[other] Alle { $pages } sider tager den tekst, PDF'en har.
}
ocr-pages-said-read = { $pages ->
    [one] Siden læses med Tesseract.
   *[other] Alle { $pages } sider læses med Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] Én side tager den tekst, PDF'en har;
   *[other] { $pdf } sider tager den tekst, PDF'en har;
} { $read ->
    [one] én læses med Tesseract.
   *[other] { $read } læses med Tesseract.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] Siden kan ikke læses: Tesseract er ikke installeret.
   *[other] Ingen af de { $pages } sider kan læses: Tesseract er ikke installeret.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] Én side tager den tekst, PDF'en har;
   *[other] { $pdf } sider tager den tekst, PDF'en har;
} { $read ->
    [one] én kan ikke læses uden Tesseract.
   *[other] { $read } kan ikke læses uden Tesseract.
}
ocr-pages-said-picture = Teksten læses fra billedet.
ocr-pages-said-picture-unreadable = Teksten i billedet kan ikke læses uden Tesseract.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] For siden
   *[other] For alle { $pages } sider
}
ocr-pages-scope = For { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] side { $pages }
   *[other] siderne { $pages }
}
ocr-pages-all = Alle sider
ocr-pages-pdf = PDF'ens tekst
ocr-pages-pdf-hint = Disse sider tager den tekst, PDF'en har. Sider uden tekst læses alligevel.
ocr-pages-read = Læs med Tesseract
ocr-pages-read-hint = Disse sider læses på ny ud fra billeder af dem, hvilken tekst de end har.
ocr-pages-decide = Afgør efter tekstens kvalitet
ocr-pages-decide-hint = Side for side: tekst, der læses som tekst, tages; tekst, der ikke gør, og sider uden tekst læses.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Læses
ocr-strip-source-pdf-hint = Tager den tekst, PDF'en har.
ocr-strip-source-read-hint = Læses med Tesseract.
ocr-strip-poor = Den tekst, den har, læses ikke som tekst.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = Engelsk, hvor intet er valgt
ocr-strip-band-dpi = { $dpi } punkter pr. tomme
# Black and white, in short.
ocr-strip-band-contrast = s/h
ocr-strip-band-hint = { $count ->
    [one] Side { $from }: { $said }
   *[other] Siderne { $from }–{ $to }: { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] Én side
   *[other] { $pages } sider
}
ocr-summary-scanned = skannet med { $dpi } punkter pr. tomme
ocr-summary-no-text = { $pages ->
    [one] uden egen tekst
   *[other] uden egen tekst
}
ocr-summary-text-all = { $pages ->
    [one] med egen tekst
   *[other] alle med egen tekst
}
ocr-summary-text-some = { $with ->
    [one] én af dem med egen tekst
   *[other] { $with } af dem med egen tekst
}
ocr-summary-poor = { $poor ->
    [one] hvoraf én ikke læses som tekst
   *[other] hvoraf { $poor } ikke læses som tekst
}
ocr-summary-poor-all = som ikke læses som tekst
# Over the choice of what every page takes.
ocr-summary-whole = Hvad siderne tager
ocr-summary-mixed = Valgt side for side. Et valg her gælder alle sider igen.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = De gælder de sider, der læses med Tesseract; det gør ingen nu.
ocr-summary-pages-open = Se på siderne, og prøv dem…
ocr-summary-picture-open = Prøv det…
ocr-summary-back = Tilbage til oversigten
