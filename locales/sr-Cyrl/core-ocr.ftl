# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Слика

## When text cannot be read.

ocr-stopped = Читање је заустављено.
ocr-no-language = Tesseract нема податке за језик „{ $language }“.
ocr-no-languages = Tesseract нема податке ни за један језик. Инсталирајте податке за неки, као tesseract-data-eng на систему Arch.
ocr-not-pdf = „{ $file }“ није PDF.
ocr-no-pages = „{ $file }“ нема ниједну страну.
ocr-locked = „{ $file }“ је закључана лозинком, па њене стране не могу да се исцртају.
ocr-unreadable = „{ $file }“ није могла да се прочита као PDF. Можда је оштећена.
ocr-page-not-drawn = Страна { $page } није могла да се исцрта.
ocr-picture-unreadable = Слика није могла да се прочита: { $message }
ocr-drawing = Цртеж (SVG) нема у себи слику из које би се читао текст.

## Making a PDF searchable.

ocr-searchable-locked = PDF је закључан и не може се учинити претраживим. Његов текст се ипак може учитати у пројекат као мапа.
ocr-searchable-unreadable = PDF није могао да се учини претраживим: { $message }
ocr-not-whole = оно што је направљено није се прочитало цело и није сачувано.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Страна { $page } није могла да се прочита: { $message }
ocr-remark-more-failed = { $count ->
    [one] Још { $count } страна није могла да се прочита.
    [few] Још { $count } стране нису могле да се прочитају.
   *[other] Још { $count } страна није могло да се прочита.
}
ocr-remark-empty = Текст није пронађен.
