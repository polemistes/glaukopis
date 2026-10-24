# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-filer och bilder
ocr-no-tesseract = Tesseract, som läser text i bilder, är inte installerat eller kunde inte hittas. Installera det med systemets pakethanterare, med data för de språk du läser (på Arch: tesseract och tesseract-data-eng, tesseract-data-swe och så vidare), eller ange i inställningarna var det finns.
ocr-failed = Texten kunde inte läsas.
ocr-looking = Tittar på { $file }…
ocr-about-picture = Texten läses från bilden.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Sidorna är bilder med { $dpi } punkter per tum: för få för att deras bokstäver ska kunna läsas väl, vad som än väljs.
ocr-low-resolution-text = Att läsa dem på nytt gör inte texten som PDF:en har bättre.

ocr-trying = Läser sida { $page }…
ocr-tried-nothing = Ingen text lästes på sida { $label }.
ocr-tried-blocks = { $count ->
    [one] Visa textblocket
   *[other] Visa de { $count } textblocken
}
ocr-tried-blocks-hint = Textblocken som Tesseract hittade, numrerade i den ordning det läser dem. Två spalter som tas som en, eller noter som tas in i texten, läses i fel ordning: en annan layout kan skilja dem åt.

ocr-read = Läs texten
ocr-read-pages = { $count ->
    [one] Läs en sida
   *[other] Läs { $count } sidor
}
ocr-read-text-pages = Ta sidorna som har text
ocr-take-text = Ta texten
ocr-reading = Läser { $file }…
ocr-reading-pages = { $done } av { $total } sidor lästa
ocr-reading-hint = En sida tar några sekunder. Avbryt stoppar läsningen.

## How the text is read: what to try when a reading goes badly

ocr-how-dpi = Upplösning, i punkter per tum
ocr-how-layout = Sidans layout
ocr-how-layout-auto = Som Tesseract bedömer
ocr-how-layout-column = En spalt
ocr-how-layout-block = Ett textblock
ocr-how-layout-sparse = Gles text
ocr-how-contrast = Svartvitt
ocr-how-hint = Vad man kan pröva när en läsning går dåligt: högre upplösning för liten stil, en spalt där spalter blandas ihop, ett textblock för ett enda stycke, och svartvitt för tryck som är svagt eller ojämnt.

## The languages of the text

ocr-languages = Textens språk
ocr-languages-hint = Det troligaste först. Varje språk till gör läsningen långsammare, och inte alltid bättre.
ocr-language-add = Lägg till ett språk…
ocr-language-remove = Ta bort { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }, skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, äldre
ocr-language-vertical = { $language }, skrivet uppifrån och ner

## A PDF of the library made searchable

ocr-searchable-button = Gör sökbar…
ocr-searchable-title = Gör PDF:en sökbar
ocr-searchable-damaged = PDF:en kunde inte tas isär för att ändras: den kan vara skadad. Dess text kan ändå hämtas in i ett projekt som en karta.
ocr-searchable-make = Gör sökbar
ocr-searchable-done = { $count ->
    [one] PDF:en är sökbar: en sida lästes
   *[other] PDF:en är sökbar: { $count } sidor lästes
}
ocr-searchable-failed = { $count ->
    [one] En sida kunde inte läsas.
   *[other] { $count } sidor kunde inte läsas.
}
ocr-searchable-poorly = { $count ->
    [one] En sida lästes dåligt: { $pages }.
   *[other] { $count } sidor lästes dåligt: { $pages }.
} Pröva en sida med ett annat språk, eller med frakturmodellen för gotisk skrift.

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importera dess text som en karta…
ocr-map-title = Importera texten som en karta
ocr-map-into = In i projektet
ocr-map-new-project = Ett nytt projekt, uppkallat efter den
ocr-map-make = Importera
ocr-map-making = Importerar…
ocr-map-failed = Elementen kunde inte göras.

## The text of a picture of the store

ocr-picture-read = Läs texten i den…
ocr-picture-title = Texten i bilden
ocr-picture-empty = Ingen text hittades i bilden.
ocr-picture-copy = Kopiera
ocr-picture-copied = Texten är kopierad
ocr-picture-copy-failed = Texten kunde inte kopieras
ocr-picture-map = Gör ett element av den

## Tesseract in the settings

ocr-settings-looking = Letar…
ocr-settings-missing = Hittades inte. Behövs för att läsa text ur inskanningar och bilder. Installera tesseract med systemets pakethanterare, med data för de språk du läser (tesseract-data-eng för engelska på Arch, tesseract-data-swe för svenska, tesseract-data-grc för klassisk grekiska, …), eller ange nedan var det finns.
ocr-settings-by-itself = Hittat av sig självt
ocr-settings-where = Var Tesseract finns
ocr-settings-look-failed = Tesseract kunde inte letas upp
ocr-settings-title = Textigenkänning (OCR)
ocr-settings-has-none = Det har inga data för något språk: importera ett nedan, eller installera ett med systemets pakethanterare, som tesseract-data-eng.
ocr-settings-first = Förvalda språk för textigenkänning
ocr-settings-how = Förvalda inställningar för textigenkänning
ocr-settings-languages = Språk för textigenkänning
ocr-settings-languages-hint = Glaukopis använder Tesseract för textigenkänning. De språkfiler du importerar här används i stället för dem du kan ha installerat på systemet.
ocr-source-system = Från systemet
ocr-source-imported = Importerad
ocr-settings-not-found = Tesseract hittades inte. Ange var det finns under Program, nedan.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Texten som PDF:en har

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Grekiskan är lagrad som glyfnamnen i { $fonts }, och kan göras om till grekiska bokstäver.
ocr-text-scheme-expert-names = Kapitäler och mediavalsiffror i { $fonts } är lagrade efter namn, och kan göras om till sina bokstäver och siffror.
ocr-text-scheme-beta-code = Grekiskan är skriven i Beta Code, och kan göras om till grekiska bokstäver.
ocr-text-page = Sida { $label }
ocr-text-page-none = Ingen text på den här sidan: den läses från en bild av den.
ocr-text-rest-failed = Sidorna efter de här kunde inte läsas.
ocr-searchable-make-readable = Gör läsbar
ocr-searchable-readable-done = { $count ->
    [one] PDF:ens text är läsbar nu: ett typsnitt fick sina bokstäver
   *[other] PDF:ens text är läsbar nu: { $count } typsnitt fick sina bokstäver
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Behåll sidornas form
ocr-shape-hint = Rubriker, rader som behålls som rader, nummer i marginalen, och kolumntitlarna utelämnade. Utan det blir sidorna vanliga stycken.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Element
ocr-structure-headings = Efter dess rubriker
ocr-page-marks = Märk ut var varje sida börjar
ocr-page-marks-hint = Ett referensmärke med sidans nummer, där den började.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Vad som görs av den
ocr-made-headings = { $count ->
    [0] Inga rubriker hittades
    [one] Efter dess enda rubrik
   *[other] Efter dess { $count } rubriker
}
ocr-made-pages = { $count ->
    [one] Efter dess enda sida
   *[other] Efter dess { $count } sidor
}
ocr-made-failed = Elementen kunde inte göras på nytt
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Det som kommer att göras
ocr-outline-all = Visa alla { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Textstilar som hittades
ocr-styles-about = { $count ->
    [one] En textstil återkommer vid sidan av brödtexten. Säg vad den är, eller låt den vara text.
   *[other] { $count } textstilar återkommer vid sidan av brödtexten. Säg vad var och en är, eller låt dem vara text.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] En gång
   *[other] { $count } gånger
} på { $pages ->
    [one] en sida
   *[other] { $pages } sidor
}
ocr-styles-kind = Vad den är
ocr-styles-own = Ett eget slag…
ocr-styles-own-name = Slagets namn
ocr-styles-own-hint = Görs när dokumentet hämtas in, utan eget utseende tills du ger det ett.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } bevarade rader
   *[other] { $look } text
}
ocr-style-indented = { $kept ->
    [yes] indragna
   *[other] indragen
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] större
}
ocr-style-bold = { $kept ->
    [yes] feta
   *[other] fet
}
ocr-style-italic = { $kept ->
    [yes] kursiva
   *[other] kursiv
}
# A style that differs from the body only by its font.
ocr-style-family = Text i { $family }
ocr-style-other = Annan text
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] grekiska
    [Cyrillic] kyrilliska
   *[Latin] latinska
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Den { $a } skriften läses tillsammans med den { $b }: bokstäver som liknar varandra i de två ({ $alike }) förväxlas ofta, och hela ord blir fel. För en enda skrift, ta bort de andra.


## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = Sidorna
ocr-strip-page = Sida { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Inte uppritad
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Sidorna { $from }–{ $to } kunde inte ritas upp.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Hur Tesseract läser
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Pröva sida { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Engelska, eftersom inget är valt
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = S/V
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Bildens storlek
ocr-picture-fit = Hela sidan
ocr-picture-actual = 100 %
ocr-picture-double = 200 %
# The alternative text of the picture of the page in view.
ocr-picture-alt = Sida { $label }
ocr-pane-translated = Översatt efter vad typsnitten säger
ocr-pane-sound = Läses som text
ocr-pane-poor = Läses inte som text: bokstäver i ett typsnitt som inte säger vilka de är, eller en dålig läsning
ocr-pane-tesseract = Det Tesseract läste
ocr-pane-try-hint = Tryck på ”Pröva sida { $page }” för att läsa den här sidan med inställningarna bredvid.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Sida { $label }:
ocr-confidence-low = Låg säkerhet ({ $confidence } %)
ocr-confidence-good = God säkerhet ({ $confidence } %)
ocr-confidence-high = Hög säkerhet ({ $confidence } %)
ocr-tried-unsure = { $unsure ->
    [0] inget ord osäkert
   *[other] { $unsure } av { $words } ord osäkra
}
ocr-tried-low-hint = Under 80 %: pröva ett annat språk, frakturmodellen för gotisk skrift eller en annan layout.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Läst med en säkerhet på { $confidence } %
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (läses på olika sätt)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Prövad med
ocr-trial-confidence = { $confidence } %
ocr-trial-nothing = Inget läst
ocr-trial-use = Använd de här inställningarna

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] Sidan får texten som PDF:en har.
   *[other] Alla { $pages } sidor får texten som PDF:en har.
}
ocr-pages-said-read = { $pages ->
    [one] Sidan läses med Tesseract.
   *[other] Alla { $pages } sidor läses med Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] En sida får texten som PDF:en har;
   *[other] { $pdf } sidor får texten som PDF:en har;
} { $read ->
    [one] en läses med Tesseract.
   *[other] { $read } läses med Tesseract.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] Sidan kan inte läsas: Tesseract är inte installerat.
   *[other] Ingen av de { $pages } sidorna kan läsas: Tesseract är inte installerat.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] En sida får texten som PDF:en har;
   *[other] { $pdf } sidor får texten som PDF:en har;
} { $read ->
    [one] en kan inte läsas utan Tesseract.
   *[other] { $read } kan inte läsas utan Tesseract.
}
ocr-pages-said-picture = Texten läses från bilden.
ocr-pages-said-picture-unreadable = Bildens text kan inte läsas utan Tesseract.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] För sidan
   *[other] För alla { $pages } sidor
}
ocr-pages-scope = För { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] sida { $pages }
   *[other] sidorna { $pages }
}
ocr-pages-all = Alla sidor
ocr-pages-pdf = PDF:ens text
ocr-pages-pdf-hint = De här sidorna får texten som PDF:en har. Sidor utan text läses ändå.
ocr-pages-read = Läs med Tesseract
ocr-pages-read-hint = De här sidorna läses på nytt från bilder av dem, vilken text de än har.
ocr-pages-decide = Avgör efter textens kvalitet
ocr-pages-decide-hint = Sida för sida: text som läses som text tas; text som inte gör det, och sidor utan text, läses.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Läses
ocr-strip-source-pdf-hint = Får texten som PDF:en har.
ocr-strip-source-read-hint = Läses med Tesseract.
ocr-strip-poor = Texten den har läses inte som text.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = Engelska, där inget är valt
ocr-strip-band-dpi = { $dpi } punkter per tum
# Black and white, in short.
ocr-strip-band-contrast = S/V
ocr-strip-band-hint = { $count ->
    [one] Sida { $from }: { $said }
   *[other] Sidorna { $from }–{ $to }: { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] En sida
   *[other] { $pages } sidor
}
ocr-summary-scanned = inskannad med { $dpi } punkter per tum
ocr-summary-no-text = { $pages ->
    [one] utan egen text
   *[other] utan egen text
}
ocr-summary-text-all = { $pages ->
    [one] med egen text
   *[other] alla med egen text
}
ocr-summary-text-some = { $with ->
    [one] en av dem med egen text
   *[other] { $with } av dem med egen text
}
ocr-summary-poor = { $poor ->
    [one] varav en inte läses som text
   *[other] varav { $poor } inte läses som text
}
ocr-summary-poor-all = som inte läses som text
# Over the choice of what every page takes.
ocr-summary-whole = Vad sidorna får
ocr-summary-mixed = Valt sida för sida. Ett val här gäller för varje sida igen.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = De gäller för sidorna som läses med Tesseract; inga gör det nu.
ocr-summary-pages-open = Titta på sidorna och pröva dem…
ocr-summary-picture-open = Pröva den…
ocr-summary-back = Tillbaka till översikten

## The settings in plain words, stage 1: the Fraktur models named by the languages they were trained on.

# Tesseract's Fraktur model, among the languages of the text: named for the type it reads, then for the language it was trained on.
ocr-language-fraktur-german = Fraktur (gotisk skrift), tyska
# Glaukopis's own Fraktur model: Tesseract's, taught æ, ø and å on Norwegian books; it reads Danish as well.
ocr-language-fraktur-norwegian = Fraktur (gotisk skrift), norska och danska
# Under the languages of the text, where a model of Gothic type is installed and neither Norwegian nor Danish is chosen.
ocr-languages-fraktur-hint = Böcker i gotisk skrift, som norska, danska, svenska och tyska böcker ofta trycktes i före omkring 1900, läses med Fraktur (gotisk skrift), tyska, vald som första eller enda språk, vilket språk de än är skrivna på. Den känner inte till æ, ø och å; norska och danska böcker läses med Fraktur (gotisk skrift), norska och danska, som gör det.
# The same, where Norwegian or Danish is chosen.
ocr-languages-fraktur-hint-dan = Norska och danska böcker i gotisk skrift, som många trycktes i före omkring 1900, läses med Fraktur (gotisk skrift), norska och danska, vald som första eller enda språk, vilka språk som än står bredvid: den känner till æ, ø och å, vilket den tyska inte gör.
