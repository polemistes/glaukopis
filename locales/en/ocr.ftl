# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDFs and pictures
ocr-no-tesseract = Tesseract, which reads text in pictures, is not installed or could not be found. Install it with the package manager of your system, with the data of the languages you read (on Arch: tesseract and tesseract-data-eng, tesseract-data-nor and so on), or say in the settings where it is.
ocr-failed = The text could not be read.
ocr-looking = Looking at { $file }…
ocr-about-picture = The text is read from the picture.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = The pages are pictures at { $dpi } dots to the inch: too few for their letters to be read well, whatever is chosen.
ocr-low-resolution-text = Reading them anew will not better the text the PDF has.

ocr-trying = Reading page { $page }…
ocr-tried-confidence = Page { $label } was read with a confidence of { $confidence } out of 100.
ocr-tried-poorly = That is poor: try another language, the Fraktur model for Gothic type, or another layout.
ocr-tried-nothing = No text was read on page { $label }.
ocr-tried-blocks = { $count ->
    [one] Show the block of text Tesseract found
   *[other] Show the { $count } blocks of text Tesseract found, numbered in the order it reads them
}
ocr-tried-blocks-hint = Two columns taken as one, or notes taken into the text, read in the wrong order: another layout may part them.

ocr-read = Read the text
ocr-read-pages = { $count ->
    [one] Read one page
   *[other] Read { $count } pages
}
ocr-read-text-pages = Take the pages that have text
ocr-take-text = Take the text
ocr-reading = Reading { $file }…
ocr-reading-pages = { $done } of { $total } pages read
ocr-reading-hint = A page takes a few seconds. Cancel stops the reading.

## How the text is read: what to try when a reading goes badly

ocr-how-dpi = Resolution, in dots to the inch
ocr-how-layout = Layout of the page
ocr-how-layout-auto = As Tesseract judges
ocr-how-layout-column = One column
ocr-how-layout-block = One block of text
ocr-how-layout-sparse = Sparse text
ocr-how-contrast = Black and white
ocr-how-hint = What to try when a reading goes badly: a higher resolution for small print, one column where columns are muddled, one block of text for a single paragraph, and black and white for print that is faint or uneven.

## The languages of the text

ocr-languages = Languages of the text
ocr-languages-hint = The likeliest first. Each one more makes the reading slower, and not always better.
ocr-language-add = Add a language…
ocr-language-remove = Take away { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script } script
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, older
ocr-language-vertical = { $language }, written downwards

## A PDF of the library made searchable

ocr-searchable-button = Make searchable…
ocr-searchable-title = Make the PDF searchable
ocr-searchable-damaged = The PDF could not be taken apart to be changed: it may be damaged. Its text can still be brought into a project as a map.
ocr-searchable-make = Make searchable
ocr-searchable-done = { $count ->
    [one] The PDF is searchable: one page was read
   *[other] The PDF is searchable: { $count } pages were read
}
ocr-searchable-failed = { $count ->
    [one] One page could not be read.
   *[other] { $count } pages could not be read.
}
ocr-searchable-poorly = { $count ->
    [one] One page was read poorly: { $pages }.
   *[other] { $count } pages were read poorly: { $pages }.
} Try a page with another language, or with the Fraktur model for Gothic type.

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Import its text as a map…
ocr-map-title = Import the text as a map
ocr-map-into = Into the project
ocr-map-new-project = A new project, named after it
ocr-map-make = Import
ocr-map-making = Importing…
ocr-map-failed = The elements could not be made.

## The text of a picture of the store

ocr-picture-read = Read the text in it…
ocr-picture-title = The text in the picture
ocr-picture-empty = No text was found in the picture.
ocr-picture-copy = Copy
ocr-picture-copied = The text is copied
ocr-picture-copy-failed = The text could not be copied
ocr-picture-map = Make an element of it

## Tesseract in the settings

ocr-settings-looking = Looking…
ocr-settings-missing = Not found. Needed to read text from scans and pictures. Install tesseract with the package manager of your system, with the data of the languages you read (tesseract-data-eng for English on Arch, tesseract-data-nor for Norwegian, tesseract-data-grc for Ancient Greek, …), or say below where it is.
ocr-settings-by-itself = Found by itself
ocr-settings-where = Where Tesseract is
ocr-settings-look-failed = Tesseract could not be looked for
ocr-settings-title = Optical Character Recognition (OCR)
ocr-settings-has-none = It has the data of no language: import one below, or install one with the package manager of your system, such as tesseract-data-eng.
ocr-settings-first = Default OCR language(s)
ocr-settings-how = Default OCR settings
ocr-settings-languages = OCR languages
ocr-settings-languages-hint = Glaukopis uses Tesseract for OCR. The language files you import here will be used instead of the ones you may have installed on your system.
ocr-source-system = System
ocr-source-imported = Imported
ocr-settings-not-found = Tesseract was not found. Say where it is under Programs, below.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = The text the PDF has

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = The Greek is stored as the glyph names of { $fonts }, and can be made into Greek letters.
ocr-text-scheme-expert-names = Small capitals and old-style figures of { $fonts } are stored by name, and can be made into their letters and digits.
ocr-text-scheme-beta-code = Greek is written in Beta Code, and can be made into Greek letters.
ocr-text-page = Page { $label }
ocr-text-page-none = No text on this page: it is read from a picture of it.
ocr-text-rest-failed = The pages after these could not be read.
ocr-searchable-make-readable = Make readable
ocr-searchable-readable-done = { $count ->
    [one] The PDF's text is readable now: one font was given its letters
   *[other] The PDF's text is readable now: { $count } fonts were given their letters
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Keep the shape of the pages
ocr-shape-hint = Headings, lines kept as lines, numbers in the margin, and the running heads left out. Off, the pages become plain paragraphs.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Elements
ocr-structure-headings = By its headings
ocr-page-marks = Mark where each page begins
ocr-page-marks-hint = A reference mark with the page's number, where it began.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = What is made of it
ocr-made-headings = { $count ->
    [one] By its one heading
   *[other] By its { $count } headings
}
ocr-made-pages = { $count ->
    [one] By its one page
   *[other] By its { $count } pages
}
ocr-made-no-headings = No headings were found: an element is made for each page.
ocr-made-failed = The elements could not be made anew
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = What will be made
ocr-outline-all = Show all { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Styles found
ocr-styles-about = { $count ->
    [one] One style of text recurs beside the body. Say what it is, or leave it as text.
   *[other] { $count } styles of text recur beside the body. Say what each is, or leave them as text.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Once
   *[other] { $count } times
} on { $pages ->
    [one] one page
   *[other] { $pages } pages
}
ocr-styles-kind = What it is
ocr-styles-own = A kind of your own…
ocr-styles-own-name = Name of the kind
ocr-styles-own-hint = Made when the document is brought in, with no look of its own until you give it one.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } lines kept
   *[other] { $look } text
}
ocr-style-indented = { $kept ->
   *[other] indented
}
ocr-style-smaller = { $kept ->
   *[other] smaller
}
ocr-style-larger = { $kept ->
   *[other] larger
}
ocr-style-bold = { $kept ->
   *[other] bold
}
ocr-style-italic = { $kept ->
   *[other] italic
}
# A style that differs from the body only by its font.
ocr-style-family = Text in { $family }
ocr-style-other = Other text
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] Greek
    [Cyrillic] Cyrillic
   *[Latin] Latin
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = The { $a } script is read together with the { $b }: letters that look alike in the two ({ $alike }) are often read as the other, and whole words come out wrong. For one script alone, take the others away.

# Tesseract's Fraktur model, among the languages of the text: named for the type it reads, not for a language.
ocr-language-fraktur-model = Fraktur (Gothic type)
# Glaukopis's own Fraktur model for Danish and Norwegian: Tesseract's taught æ, ø and å.
ocr-language-fraktur-dan-model = Fraktur, Danish and Norwegian (Gothic type)
# Under the languages of the text, where a model of Gothic type is installed and neither Norwegian nor Danish is chosen.
ocr-languages-fraktur-hint = Books in Gothic type, as Norwegian, Danish, Swedish and German ones often were before about 1900, are read with the Fraktur model, chosen first or alone, whatever their language. It knows no æ, ø or å; Norwegian and Danish books are read with Fraktur, Danish and Norwegian, which does.
# The same, where Norwegian or Danish is chosen.
ocr-languages-fraktur-hint-dan = Norwegian and Danish books in Gothic type, as many were before about 1900, are read with Fraktur, Danish and Norwegian, chosen first or alone, whatever the languages beside it: it knows æ, ø and å, which the Fraktur model made for German does not.

## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = The pages
ocr-strip-page = Page { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Not drawn
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Pages { $from }–{ $to } could not be drawn.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = How Tesseract reads
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Try page { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = English, as none is chosen
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = B/W
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Size of the picture
ocr-picture-fit = Fit
ocr-picture-actual = 100%
ocr-picture-double = 200%
# The alternative text of the picture of the page in view.
ocr-picture-alt = Page { $label }
# The button in the header of a pane of text: that text is what the pages get. $scope: which pages, "this page", "pages 3–5", "all pages".
ocr-pane-use = Use for { $scope }
ocr-pane-translated = Translated by what the fonts say
ocr-pane-sound = Reads as text
ocr-pane-poor = Does not read as text: letters of a font that does not say which they are, or a poor reading
ocr-pane-tesseract = What Tesseract read
ocr-pane-try-hint = Press “Try page { $page }” to read this page with the settings beside.
# Of the words Tesseract read on the page tried, those it was unsure of, which are underlined.
ocr-pane-unsure = { $unsure ->
    [0] { $words ->
        [one] Tesseract was sure of the one word
       *[other] Tesseract was sure of all { $words } words
    }
    [one] { $words ->
        [one] Tesseract was unsure of the one word
       *[other] One of { $words } words unsure
    }
   *[other] { $unsure } of { $words } words unsure
}
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Read with a confidence of { $confidence } out of 100
# The pages the buttons of the panes act on, after "Use for": the page in view alone, or every page.
ocr-pane-scope-page = this page
ocr-pane-scope-all = all pages
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (read in different ways)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Tried with
ocr-trial-confidence = { $confidence } of 100
ocr-trial-nothing = Nothing read
ocr-trial-differs = Not what holds for the page now
ocr-trial-use = Use these settings

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] The page takes the text the PDF has.
   *[other] All { $pages } pages take the text the PDF has.
}
ocr-pages-said-read = { $pages ->
    [one] The page is read with Tesseract.
   *[other] All { $pages } pages are read with Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] One page takes the text the PDF has;
   *[other] { $pdf } pages take the text the PDF has;
} { $read ->
    [one] one is read with Tesseract.
   *[other] { $read } are read with Tesseract.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] The page cannot be read: Tesseract is not installed.
   *[other] None of the { $pages } pages can be read: Tesseract is not installed.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] One page takes the text the PDF has;
   *[other] { $pdf } pages take the text the PDF has;
} { $read ->
    [one] one cannot be read without Tesseract.
   *[other] { $read } cannot be read without Tesseract.
}
ocr-pages-said-picture = The text is read from the picture.
ocr-pages-said-picture-unreadable = The text of the picture cannot be read without Tesseract.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] For the page
   *[other] For all { $pages } pages
}
ocr-pages-scope = For { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] page { $pages }
   *[other] pages { $pages }
}
ocr-pages-all = All pages
ocr-pages-pdf = The PDF's text
ocr-pages-pdf-hint = These pages take the text the PDF has. Pages without text are read all the same.
ocr-pages-read = Read with Tesseract
ocr-pages-read-hint = These pages are read anew from pictures of them, whatever text they have.
ocr-pages-decide = Decide by the text's quality
ocr-pages-decide-hint = Page by page: text that reads as text is taken; text that does not, and pages without text, are read.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Read
ocr-strip-source-pdf-hint = Takes the text the PDF has.
ocr-strip-source-read-hint = Is read with Tesseract.
ocr-strip-poor = The text it has does not read as text.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = English, where none is chosen
ocr-strip-band-dpi = { $dpi } dots to the inch
# Black and white, in short.
ocr-strip-band-contrast = B/W
ocr-strip-band-hint = { $count ->
    [one] Page { $from }: { $said }
   *[other] Pages { $from }–{ $to }: { $said }
}
