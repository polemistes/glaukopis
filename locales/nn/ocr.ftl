# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-ar og bilete
ocr-no-tesseract = Tesseract, som les tekst i bilete, er ikkje installert eller vart ikkje funne. Installer det med pakkehandsamaren på systemet ditt, saman med dataa for språka du les (på Arch: tesseract og tesseract-data-eng, tesseract-data-nor og så vidare), eller sei i innstillingane kvar det er.
ocr-failed = Teksten kunne ikkje lesast.
ocr-looking = Ser på { $file } …
ocr-about-picture = Teksten blir lesen frå biletet.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Sidene er bilete med { $dpi } punkt per tomme: for få til at bokstavane kan lesast godt, same kva som blir valt.
ocr-low-resolution-text = Å lese dei på nytt gjer ikkje teksten PDF-en har, betre.

ocr-trying = Les side { $page } …
ocr-tried-nothing = Ingen tekst vart lesen på side { $label }.
ocr-tried-blocks = { $count ->
    [one] Vis tekstblokka
   *[other] Vis dei { $count } tekstblokkene
}
ocr-tried-blocks-hint = Tekstblokkene Tesseract fann, nummererte i den rekkjefølgja den les dei. To spalter som er tekne som éi, eller notar som er tekne inn i teksten, blir lesne i feil rekkjefølgje: eit anna oppsett av sida kan skilje dei.

ocr-read = Les teksten
ocr-read-pages = { $count ->
    [one] Les éi side
   *[other] Les { $count } sider
}
ocr-read-text-pages = Ta sidene som har tekst
ocr-take-text = Ta teksten
ocr-reading = Les { $file } …
ocr-reading-pages = { $done } av { $total } sider lesne
ocr-reading-hint = Ei side tek nokre sekund. Avbryt stoppar lesinga.

## How the text is read: what to try when a reading goes badly

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
ocr-searchable-damaged = PDF-en kunne ikkje takast frå kvarandre for å endrast: den kan vere skadd. Teksten kan likevel hentast inn i eit prosjekt som eit kart.
ocr-searchable-make = Gjer søkbar
ocr-searchable-done = { $count ->
    [one] PDF-en er søkbar: éi side vart lesen
   *[other] PDF-en er søkbar: { $count } sider vart lesne
}
ocr-searchable-failed = { $count ->
    [one] Éi side kunne ikkje lesast.
   *[other] { $count } sider kunne ikkje lesast.
}
ocr-searchable-poorly = { $count ->
    [one] Éi side vart lesen dårleg: { $pages }.
   *[other] { $count } sider vart lesne dårleg: { $pages }.
} Prøv ei side med eit anna språk, eller med frakturmodellen for gotisk skrift.

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importer teksten i den som eit kart …
ocr-map-title = Importer teksten som eit kart
ocr-map-into = Inn i prosjektet
ocr-map-new-project = Eit nytt prosjekt, kalla opp etter den
ocr-map-make = Importer
ocr-map-making = Importerer …
ocr-map-failed = Elementa kunne ikkje lagast.

## The text of a picture of the store

ocr-picture-read = Les teksten i det …
ocr-picture-title = Teksten i biletet
ocr-picture-empty = Ingen tekst vart funnen i biletet.
ocr-picture-copy = Kopier
ocr-picture-copied = Teksten er kopiert
ocr-picture-copy-failed = Teksten kunne ikkje kopierast
ocr-picture-map = Lag eit element av den

## Tesseract in the settings

ocr-settings-looking = Leitar …
ocr-settings-missing = Ikkje funne. Trengst for å lese tekst frå skanna sider og bilete. Installer tesseract med pakkehandsamaren på systemet ditt, saman med dataa for språka du les (tesseract-data-eng for engelsk på Arch, tesseract-data-nor for norsk, tesseract-data-grc for gammalgresk, …), eller sei nedanfor kvar det er.
ocr-settings-by-itself = Funne av seg sjølv
ocr-settings-where = Kvar Tesseract er
ocr-settings-look-failed = Det gjekk ikkje å leite etter Tesseract
ocr-settings-title = Optisk teiknattkjenning (OCR)
ocr-settings-has-none = Det har ikkje dataa for noko språk: importer eitt nedanfor, eller installer eitt med pakkehandsamaren på systemet ditt, til dømes tesseract-data-eng.
ocr-settings-first = Standardspråk for OCR
ocr-settings-how = Standardinnstillingar for OCR
ocr-settings-languages = Språk for OCR
ocr-settings-languages-hint = Glaukopis bruker Tesseract til OCR. Språkfilene du importerer her, blir brukte i staden for dei du kan ha installert på systemet ditt.
ocr-source-system = System
ocr-source-imported = Importert
ocr-settings-not-found = Tesseract vart ikkje funne. Sei kvar det er under Program, nedanfor.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Teksten PDF-en har

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Gresken er lagra som teiknnamna i { $fonts }, og kan gjerast om til greske bokstavar.
ocr-text-scheme-expert-names = Kapitélar og gammaldagse tal i { $fonts } er lagra ved namn, og kan gjerast om til bokstavane og sifra sine.
ocr-text-scheme-beta-code = Gresk er skrive i Beta Code, og kan gjerast om til greske bokstavar.
ocr-text-page = Side { $label }
ocr-text-page-none = Ingen tekst på denne sida: den blir lesen frå eit bilete av den.
ocr-text-rest-failed = Sidene etter desse kunne ikkje lesast.
ocr-searchable-make-readable = Gjer lesbar
ocr-searchable-readable-done = { $count ->
    [one] Teksten i PDF-en er lesbar no: éi skrift fekk bokstavane sine
   *[other] Teksten i PDF-en er lesbar no: { $count } skrifter fekk bokstavane sine
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Hald på forma til sidene
ocr-shape-hint = Overskrifter, linjer som blir haldne som linjer, nummer i margen, og topptekstane utelatne. Er det slått av, blir sidene vanlege avsnitt.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Element
ocr-structure-headings = Etter overskriftene
ocr-page-marks = Merk der kvar side byrjar
ocr-page-marks-hint = Eit referansemerke med sidetalet, der sida byrja.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Kva som blir laga av den
ocr-made-headings = { $count ->
    [0] Ingen overskrifter funne
    [one] Etter den eine overskrifta
   *[other] Etter dei { $count } overskriftene
}
ocr-made-pages = { $count ->
    [one] Etter den eine sida
   *[other] Etter dei { $count } sidene
}
ocr-made-failed = Elementa kunne ikkje lagast på nytt
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Dette blir laga
ocr-outline-all = Vis alle { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Tekststilar som er funne
ocr-styles-about = { $count ->
    [one] Éin tekststil går att ved sida av brødteksten. Sei kva den er, eller la den vere tekst.
   *[other] { $count } tekststilar går att ved sida av brødteksten. Sei kva kvar av dei er, eller la dei vere tekst.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Éin gong
   *[other] { $count } gonger
} på { $pages ->
    [one] éi side
   *[other] { $pages } sider
}
ocr-styles-kind = Kva det er
ocr-styles-own = Eit eige slag …
ocr-styles-own-name = Namnet på slaget
ocr-styles-own-hint = Blir laga når dokumentet blir henta inn, utan eigen utsjånad før du gir det ein.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } linjer
   *[other] { $look } tekst
}
ocr-style-indented = { $kept ->
    [yes] innrykte
   *[other] innrykt
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] større
}
ocr-style-bold = { $kept ->
    [yes] feite
   *[other] feit
}
ocr-style-italic = { $kept ->
    [yes] kursive
   *[other] kursiv
}
# A style that differs from the body only by its font.
ocr-style-family = Tekst i { $family }
ocr-style-other = Annan tekst
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] greske
    [Cyrillic] kyrilliske
   *[Latin] latinske
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Det { $a } alfabetet blir lese saman med det { $b }: bokstavar som liknar kvarandre i dei to ({ $alike }), blir ofte lesne som kvarandre, og heile ord blir feil. For berre eitt alfabet, ta bort dei andre.

# Tesseract's Fraktur model, among the languages of the text: named for the type it reads, not for a language.
ocr-language-fraktur-model = Fraktur (gotisk skrift)
# Glaukopis's own Fraktur model for Danish and Norwegian: Tesseract's taught æ, ø and å.
ocr-language-fraktur-dan-model = Fraktur, dansk og norsk (gotisk skrift)
# Under the languages of the text, where a model of Gothic type is installed and neither Norwegian nor Danish is chosen.
ocr-languages-fraktur-hint = Bøker i gotisk skrift, slik norske, danske, svenske og tyske bøker ofte var før kring 1900, blir lesne med frakturmodellen, vald først eller åleine, same kva språk dei er på. Den kjenner ikkje æ, ø og å; norske og danske bøker blir lesne med Fraktur, dansk og norsk, som gjer det.
# The same, where Norwegian or Danish is chosen.
ocr-languages-fraktur-hint-dan = Norske og danske bøker i gotisk skrift, slik mange var før kring 1900, blir lesne med Fraktur, dansk og norsk, vald først eller åleine, same kva språk som står ved sida av: den kjenner æ, ø og å, noko frakturmodellen laga for tysk ikkje gjer.

## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = Sidene
ocr-strip-page = Side { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Ikkje teikna
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Side { $from }–{ $to } kunne ikkje teiknast.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Slik les Tesseract
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Prøv side { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Engelsk, sidan ingen er valt
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = svart-kvitt
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Storleiken på biletet
ocr-picture-fit = Heile sida
ocr-picture-actual = 100 %
ocr-picture-double = 200 %
# The alternative text of the picture of the page in view.
ocr-picture-alt = Side { $label }
ocr-pane-translated = Omsett etter det skriftene seier
ocr-pane-sound = Lesbar tekst
ocr-pane-poor = Ikkje lesbar tekst: bokstavar i ei skrift som ikkje seier kva dei er, eller ei dårleg lesing
ocr-pane-tesseract = Det Tesseract las
ocr-pane-try-hint = Trykk «Prøv side { $page }» for å lese denne sida med innstillingane ved sida av.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Side { $label }:
ocr-confidence-low = Låg sikkerheit ({ $confidence } %)
ocr-confidence-good = God sikkerheit ({ $confidence } %)
ocr-confidence-high = Høg sikkerheit ({ $confidence } %)
ocr-tried-unsure = { $unsure ->
    [0] ingen usikre ord
   *[other] { $unsure } av { $words } ord usikre
}
ocr-tried-low-hint = Under 80 %: prøv eit anna språk, frakturmodellen for gotisk skrift eller eit anna oppsett av sida.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Lese med ei sikkerheit på { $confidence } %
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (blir lesne på ulike måtar)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Prøvd med
ocr-trial-confidence = { $confidence } %
ocr-trial-nothing = Ingenting lese
ocr-trial-use = Bruk desse innstillingane

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] Sida tek teksten PDF-en har.
   *[other] Alle dei { $pages } sidene tek teksten PDF-en har.
}
ocr-pages-said-read = { $pages ->
    [one] Sida blir lesen med Tesseract.
   *[other] Alle dei { $pages } sidene blir lesne med Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] Éi side tek teksten PDF-en har;
   *[other] { $pdf } sider tek teksten PDF-en har;
} { $read ->
    [one] éi blir lesen med Tesseract.
   *[other] { $read } blir lesne med Tesseract.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] Sida kan ikkje lesast: Tesseract er ikkje installert.
   *[other] Ingen av dei { $pages } sidene kan lesast: Tesseract er ikkje installert.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] Éi side tek teksten PDF-en har;
   *[other] { $pdf } sider tek teksten PDF-en har;
} { $read ->
    [one] éi kan ikkje lesast utan Tesseract.
   *[other] { $read } kan ikkje lesast utan Tesseract.
}
ocr-pages-said-picture = Teksten blir lesen frå biletet.
ocr-pages-said-picture-unreadable = Teksten i biletet kan ikkje lesast utan Tesseract.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] For sida
   *[other] For alle dei { $pages } sidene
}
ocr-pages-scope = For { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] side { $pages }
   *[other] sidene { $pages }
}
ocr-pages-all = Alle sidene
ocr-pages-pdf = Teksten i PDF-en
ocr-pages-pdf-hint = Desse sidene tek teksten PDF-en har. Sider utan tekst blir lesne likevel.
ocr-pages-read = Les med Tesseract
ocr-pages-read-hint = Desse sidene blir lesne på nytt frå bilete av dei, same kva tekst dei har.
ocr-pages-decide = Avgjer etter kor god teksten er
ocr-pages-decide-hint = Side for side: tekst som er lesbar, blir teken; tekst som ikkje er det, og sider utan tekst, blir lesne.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Lesen
ocr-strip-source-pdf-hint = Tek teksten PDF-en har.
ocr-strip-source-read-hint = Blir lesen med Tesseract.
ocr-strip-poor = Teksten sida har, er ikkje lesbar.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = Engelsk, der ingen er valt
ocr-strip-band-dpi = { $dpi } punkt per tomme
# Black and white, in short.
ocr-strip-band-contrast = S/K
ocr-strip-band-hint = { $count ->
    [one] Side { $from }: { $said }
   *[other] Sidene { $from }–{ $to }: { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] Éi side
   *[other] { $pages } sider
}
ocr-summary-scanned = skanna med { $dpi } punkt per tomme
ocr-summary-no-text = { $pages ->
    [one] utan eigen tekst
   *[other] utan eigen tekst
}
ocr-summary-text-all = { $pages ->
    [one] med eigen tekst
   *[other] alle med eigen tekst
}
ocr-summary-text-some = { $with ->
    [one] éi av dei med eigen tekst
   *[other] { $with } av dei med eigen tekst
}
ocr-summary-poor = { $poor ->
    [one] der éi ikkje har lesbar tekst
   *[other] der { $poor } ikkje har lesbar tekst
}
ocr-summary-poor-all = som ikkje er lesbar
# Over the choice of what every page takes.
ocr-summary-whole = Kva sidene tek
ocr-summary-mixed = Valt side for side. Eit val her gjeld alle sidene igjen.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = Dei gjeld sidene som blir lesne med Tesseract; ingen blir det no.
ocr-summary-pages-open = Sjå på sidene og prøv dei …
ocr-summary-picture-open = Prøv det …
ocr-summary-back = Tilbake til oversikta
