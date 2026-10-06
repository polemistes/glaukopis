# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
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

ocr-remark-read = { $count ->
    [one] One page was read from a picture of it.
   *[other] { $count } pages were read from pictures of them.
}
ocr-remark-text = { $count ->
    [one] One page had text, which is taken as the file has it.
   *[other] { $count } pages had text, which is taken as the file has it.
}
ocr-remark-no-tesseract = { $count ->
    [one] One page has no text, and is left empty: Tesseract, which reads text in pictures, is not installed.
   *[other] { $count } pages have no text, and are left empty: Tesseract, which reads text in pictures, is not installed.
}
ocr-remark-not-read = The pages that have no text could not be read: { $message }
ocr-remark-failed = Page { $page } could not be read: { $message }
ocr-remark-more-failed = { $count ->
    [one] One more page could not be read.
   *[other] { $count } more pages could not be read.
}
ocr-remark-empty = No text was found.
