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

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Its text as elements…
ocr-map-title = The text as elements
ocr-map-into = Into the project
ocr-map-new-project = A new project, named after it
ocr-map-making = Making the elements…
ocr-map-failed = The elements could not be made.

## The text of a picture of the store

ocr-picture-read = Read the text in it…
ocr-picture-title = The text in the picture
ocr-picture-empty = No text was found in the picture.
ocr-picture-copy = Copy
ocr-picture-copied = The text is copied
ocr-picture-map = Make an element of it

## Tesseract in the settings

ocr-settings-looking = Looking…
ocr-settings-missing = Not found. Needed to read text from scans and pictures. Install tesseract with the package manager of your system, with the data of the languages you read (tesseract-data-eng for English on Arch, tesseract-data-nor for Norwegian, tesseract-data-grc for Ancient Greek, …), or say below where it is.
ocr-settings-by-itself = Found by itself
ocr-settings-where = Where Tesseract is
ocr-settings-look-failed = Tesseract could not be looked for
ocr-settings-has = It reads { $languages }.
ocr-settings-has-none = It has the data of no language: import one below, or install one with the package manager of your system, such as tesseract-data-eng.
ocr-settings-first = Read in at first
ocr-settings-first-hint = When none are chosen, the language of the text and that of the interface.
ocr-settings-how = How text is read at first

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
ocr-text-sample = As the PDF has it, on page { $page }:
ocr-text-keep = Keep the text the PDF has
ocr-text-keep-hint = Only the pages without text are read; the others are taken as they are.
ocr-text-keep-searchable-hint = Only the pages without text are read; the others keep the text they have.
ocr-text-anew = Read every page anew, in place of the text the PDF has
ocr-text-anew-hint = Only what is read is kept: for text that is poor, or cannot be read.
ocr-text-anew-searchable-hint = The unseen text the pages have is taken away, and what is read is laid in its place. The pages look as they did.
ocr-about-anew = { $pages ->
    [one] The page is read anew, from a picture of it.
   *[other] All { $pages } pages are read anew, from pictures of them.
}
ocr-searchable-anew = { $pages ->
    [one] The page is read anew, and its text is laid unseen under what is shown, in place of what it had. The PDF looks as it did.
   *[other] All { $pages } pages are read anew, and their text is laid unseen under what is shown, in place of what they had. The PDF looks as it did.
}
