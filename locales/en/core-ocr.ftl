# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = No heading was found: the pages are the elements.
ocr-kind-picture = Picture

## When text cannot be read.

ocr-stopped = The reading was stopped.
ocr-no-language = Tesseract has no data for the language “{ $language }”.
ocr-no-languages = Tesseract has no data for any language. Import one under Settings › Programs, or install one with the package manager of your system, such as tesseract-data-eng on Arch.
ocr-not-pdf = “{ $file }” is not a PDF.
ocr-no-pages = “{ $file }” has no pages.
ocr-locked = “{ $file }” is locked with a password, and its pages cannot be drawn.
ocr-unreadable = “{ $file }” could not be read as a PDF. It may be damaged.
ocr-page-not-drawn = Page { $page } could not be drawn.
ocr-no-such-page = The PDF has no page { $page }: it has { $pages }.
ocr-picture-unreadable = The picture could not be read: { $message }
ocr-not-made = Tesseract did not make { $path }.
ocr-not-made-said = Tesseract did not make { $path }. It said: { $message }
ocr-drawing = A drawing (SVG) has no picture in it to read text from.
ocr-child-time = Reading “{ $file }” took longer than it may, and was stopped. The file may be damaged, or made in a way that cannot be read.
ocr-child-memory = Reading “{ $file }” took more memory than it may, and was stopped. The file may be damaged, or made in a way that cannot be read.
ocr-child-failed = “{ $file }” could not be read: { $message }
ocr-child-not-started = “{ $file }” could not be read, since no process could be started to read it in: { $message }

## Making a PDF searchable.

ocr-searchable-locked = The PDF is locked, and cannot be made searchable. Its text can still be brought into a project as a map.
ocr-searchable-unreadable = The PDF could not be made searchable: { $message }
ocr-not-whole = what was made did not read back whole, and was not kept.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Page { $page } could not be read: { $message }
ocr-remark-more-failed = { $count ->
    [one] One more page could not be read.
   *[other] { $count } more pages could not be read.
}
ocr-remark-empty = No text was found.
ocr-remark-poorly = { $count ->
    [one] One page was read poorly: { $pages }. Another language, the Fraktur model for Gothic type, or another layout may read it better; try it before reading it again.
   *[other] { $count } pages were read poorly: { $pages }. Another language, the Fraktur model for Gothic type, or another layout may read them better; try a page before reading them all again.
}
ocr-remark-fraktur = Books in Gothic type, as many Norwegian, Danish, Swedish and German ones were before about 1900, are read with the Fraktur model, chosen first or alone, whatever their language. It knows no æ, ø or å, and reads them as e, o and a.
# The same, where Norwegian or Danish was read: the Fraktur model of Glaukopis's server that knows æ, ø and å.
ocr-remark-fraktur-dan = Norwegian and Danish books in Gothic type, as many were before about 1900, are read with Fraktur, Danish and Norwegian, imported from the server of Glaukopis and chosen first or alone, whatever the languages beside it: it knows æ, ø and å, which the Fraktur model made for German does not.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] No page read by Tesseract
    [one] One page read by Tesseract
   *[other] { $read } pages read by Tesseract
}, { $taken ->
    [0] none taken from the PDF's own text
    [one] one taken from the PDF's own text
   *[other] { $taken } taken from the PDF's own text
}, { $failed ->
    [0] none that could not be read.
    [one] one that could not be read.
   *[other] { $failed } that could not be read.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [This page could not be read: { $message }]
ocr-why-no-tesseract = Tesseract, which reads text in pictures, is not installed.
