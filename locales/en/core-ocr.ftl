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
ocr-picture-unreadable = The picture could not be read: { $message }
ocr-drawing = A drawing (SVG) has no picture in it to read text from.

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
