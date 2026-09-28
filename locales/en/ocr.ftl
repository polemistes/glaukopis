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
ocr-read-all = Read the pages that have text as well
ocr-read-all-hint = Their text stays, and what is read is laid over it.
ocr-read = Read the text
ocr-read-text-pages = Take the pages that have text
ocr-reading = Reading { $file }…
ocr-reading-pages = { $done } of { $total } pages read
ocr-reading-hint = A page takes a few seconds. Cancel stops the reading.

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
ocr-searchable-make = Make searchable
ocr-searchable-done = { $count ->
    [one] The PDF is searchable: one page was read
   *[other] The PDF is searchable: { $count } pages were read
}
ocr-searchable-failed = { $count ->
    [one] One page could not be read.
   *[other] { $count } pages could not be read.
}

## The text of a picture of the store

ocr-picture-read = Read the text in it…
ocr-picture-title = The text in the picture
ocr-picture-empty = No text was found in the picture.
ocr-picture-copy = Copy
ocr-picture-copied = The text is copied
ocr-picture-map = Make a map of it

## Tesseract in the settings

ocr-settings-looking = Looking…
ocr-settings-missing = Not found. Needed to read text from scans and pictures. Install tesseract with the package manager of your system, with the data of the languages you read (tesseract-data-eng for English on Arch, tesseract-data-nor for Norwegian, tesseract-data-grc for Ancient Greek, …), or say below where it is.
ocr-settings-by-itself = Found by itself
ocr-settings-where = Where Tesseract is
ocr-settings-look-failed = Tesseract could not be looked for
ocr-settings-has = It reads { $languages }.
ocr-settings-has-none = It has the data of no language: install that of one, such as tesseract-data-eng.
ocr-settings-first = Read in at first
ocr-settings-first-hint = When none are chosen, the language of the text and that of the interface.
