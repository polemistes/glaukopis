# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDFs and pictures
ocr-no-tesseract = Tesseract, which reads text in pictures, is not installed or could not be found. Install it with the package manager of your system, with the data of the languages you read (on Arch: tesseract and tesseract-data-eng, tesseract-data-nor and so on), or say in the settings where it is.
ocr-failed = The text could not be read.
ocr-looking = Looking at { $file }…
ocr-about-picture = The text is read from the picture.
ocr-about-scan = { $pages ->
    [one] The PDF has no text: it is read from a picture of its page.
   *[other] None of the { $pages } pages has text: they are read from pictures of them.
}
ocr-about-some = { $without ->
    [one] One of the { $pages } pages has no text, and is read from a picture of it; the others are taken as they are.
   *[other] { $without } of the { $pages } pages have no text, and are read from pictures of them; the others are taken as they are.
}
ocr-about-text = { $pages ->
    [one] The page has text, which is taken as it is.
   *[other] Every page has text, which is taken as it is.
}
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = The pages are pictures at { $dpi } dots to the inch: too few for their letters to be read well, whatever is chosen.
ocr-low-resolution-text = Reading them anew will not better the text the PDF has.

# A page tried before the whole is read: shown beside the choices, in place of the text the PDF has.
ocr-view-text = The text it has
ocr-view-try = Try a page
ocr-try-page = Page
ocr-try-of = of { $pages }
ocr-try = Try
ocr-try-hint = Read one page with the languages and settings chosen, and see what Tesseract makes of it before the whole is read. A page takes a few seconds; change a language or a setting and try again.
ocr-trying = Reading page { $page }…
ocr-tried-confidence = Page { $label } was read with a confidence of { $confidence } out of 100.
ocr-tried-poorly = That is poor: try another language, the Fraktur model for Gothic type, or another layout.
ocr-tried-nothing = No text was read on page { $label }.
ocr-tried-changed = The languages or settings have changed since: try again to see what they read.
# The alternative text of the picture of the page tried.
ocr-tried-picture = Page { $label } as Tesseract saw it
ocr-tried-blocks = { $count ->
    [one] Show the block of text Tesseract found
   *[other] Show the { $count } blocks of text Tesseract found, numbered in the order it reads them
}
ocr-tried-blocks-hint = Two columns taken as one, or notes taken into the text, read in the wrong order: another layout may part them.
# Stretches of pages read with languages and a layout of their own, as chips over the strip of pages.
ocr-stretches = Stretches of pages
ocr-stretch-page = Page { $page }
ocr-stretch-pages = Pages { $from }–{ $to }
# $languages: the languages, with commas between them; $layout: the layout of the page, as the settings name it.
ocr-stretch-with-layout = { $languages } · { $layout }
ocr-stretch-no-language = English, where none is chosen
ocr-stretch-remove = Read the pages from { $page } as those before them
ocr-stretches-hint = A book that changes language or type part way can be read in stretches: choose a page below, and begin a stretch there.
ocr-stretches-editing = The languages and the layout chosen hold for the stretch that is marked: choose another to set its own.
ocr-stretches-outline = Begin a stretch at each of the { $count } parts of the file's outline

ocr-read = Read the text
ocr-read-text-pages = Take the pages that have text
ocr-take-text = Take the text
ocr-reading = Reading { $file }…
ocr-reading-pages = { $done } of { $total } pages read
ocr-reading-hint = A page takes a few seconds. Cancel stops the reading.

## How the text is read: what to try when a reading goes badly

ocr-how = How it is read
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
ocr-searchable-about = { $without ->
    [one] One of the { $pages } pages has no text. It is read, and its text is laid unseen under what is shown, so that it can be searched and copied. The PDF looks as it did.
   *[other] { $without } of the { $pages } pages have no text. They are read, and their text is laid unseen under what is shown, so that it can be searched and copied. The PDF looks as it did.
}
ocr-searchable-has-text = { $pages ->
    [one] The page has text: the PDF can be searched already.
   *[other] Every page has text: the PDF can be searched already.
}
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
# Said where some pages have text that does not read as text.
ocr-text-poor = { $poor ->
    [one] On one of the { $pages } pages that have text, it does not read as text, as when a font does not say which letters it shows, or a reading was poor.
   *[other] On { $poor } of the { $pages } pages that have text, it does not read as text, as when a font does not say which letters it shows, or a reading was poor.
}
# Said where every page that has text has text that does not read as text.
ocr-text-poor-all = { $pages ->
    [one] The text the PDF has does not read as text, as when a font does not say which letters it shows, or a reading was poor.
   *[other] On all { $pages } pages that have text, it does not read as text, as when a font does not say which letters it shows, or a reading was poor.
}
ocr-text-keep = Keep the text the PDF has
ocr-text-keep-hint = Only the pages without text are read; the others are taken as they are.
ocr-text-keep-searchable-hint = Only the pages without text are read; the others keep the text they have.
ocr-text-anew = Read every page anew with Tesseract
ocr-text-anew-hint = Only what Tesseract reads from pictures of the pages is kept; the text the PDF has is taken from no page.
ocr-text-anew-searchable-hint = The unseen text the pages have is taken away, and what is read is laid in its place. The pages look as they did.
ocr-about-anew = { $pages ->
    [one] The page is read anew, from a picture of it.
   *[other] All { $pages } pages are read anew, from pictures of them.
}
ocr-searchable-anew = { $pages ->
    [one] The page is read anew, and its text is laid unseen under what is shown, in place of what it had. The PDF looks as it did.
   *[other] All { $pages } pages are read anew, and their text is laid unseen under what is shown, in place of what they had. The PDF looks as it did.
}

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-found = Text on { $withText } of { $pages } pages, in { $fonts }.
ocr-text-found-no-fonts = Text on { $withText } of { $pages } pages.
# The first fonts, and how many more there are.
ocr-text-fonts-more = { $fonts } and { $count ->
    [one] one more
   *[other] { $count } more
}
ocr-text-scheme-greek-names = The Greek is stored as the glyph names of { $fonts }, and can be made into Greek letters.
ocr-text-scheme-expert-names = Small capitals and old-style figures of { $fonts } are stored by name, and can be made into their letters and digits.
ocr-text-scheme-beta-code = Greek is written in Beta Code, and can be made into Greek letters.
ocr-text-translate = Translate it into readable text
ocr-text-translate-hint = The text is made readable by what the fonts say of their letters; no page is read from a picture for it.
ocr-text-translate-searchable-hint = The PDF's own tables are put right, so that every reader copies and searches the text rightly; nothing drawn changes.
ocr-text-anew-no-tesseract = Tesseract, which reads text in pictures, is not installed.
ocr-text-page = Page { $label }
ocr-text-page-none = No text on this page: it is read from a picture of it.
ocr-text-rest-failed = The pages after these could not be read.
ocr-about-translate = { $without ->
    [0] The text the PDF has is made readable; no page is read from a picture.
    [one] The text the PDF has is made readable, and the one page without text is read from a picture of it.
   *[other] The text the PDF has is made readable, and the { $without } pages without text are read from pictures of them.
}
ocr-searchable-translate = { $without ->
    [0] The fonts of the PDF are given their letters, so that its text can be copied and searched rightly. The PDF looks as it did.
    [one] The fonts of the PDF are given their letters, and the one page without text is read and given text. The PDF looks as it did.
   *[other] The fonts of the PDF are given their letters, and the { $without } pages without text are read and given text. The PDF looks as it did.
}
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
ocr-structure-pages = By its pages
ocr-page-marks = Mark where each page begins
ocr-page-marks-hint = A reference mark with the page's number, where it began.
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
# Under the languages of the text, where the Fraktur model is installed.
ocr-languages-fraktur-hint = Books in Gothic type, as Norwegian, Danish, Swedish and German ones often were before about 1900, are read with the Fraktur model, chosen first or alone, whatever their language.

## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = The pages
ocr-strip-page = Page { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Not drawn
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Pages { $from }–{ $to } could not be drawn.
# On the page chosen in the strip: the pages from it on are read with languages and a layout of their own.
ocr-strip-begin = Begin a stretch here
