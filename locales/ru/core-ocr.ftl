# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Изображение

## When text cannot be read.

ocr-stopped = Чтение остановлено.
ocr-no-language = У Tesseract нет данных для языка «{ $language }».
ocr-no-languages = У Tesseract нет данных ни для одного языка. Установите данные какого-нибудь, например tesseract-data-eng в Arch.
ocr-not-pdf = «{ $file }» — не PDF.
ocr-no-pages = В «{ $file }» нет страниц.
ocr-locked = «{ $file }» защищён паролем, и его страницы нельзя отрисовать.
ocr-unreadable = «{ $file }» не удалось прочитать как PDF. Возможно, он повреждён.
ocr-page-not-drawn = Страницу { $page } не удалось отрисовать.
ocr-picture-unreadable = Не удалось прочитать изображение: { $message }
ocr-drawing = В чертеже (SVG) нет изображения, с которого можно было бы прочитать текст.

## Making a PDF searchable.

ocr-searchable-locked = PDF защищён паролем, и текстовый слой в него не добавить. Его текст всё же можно загрузить в проект как карту.
ocr-searchable-unreadable = Не удалось добавить в PDF текстовый слой: { $message }
ocr-not-whole = сделанное не прочиталось обратно целиком и не сохранено.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Страницу { $page } не удалось прочитать: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ещё { $count } страницу не удалось прочитать.
    [few] Ещё { $count } страницы не удалось прочитать.
    [many] Ещё { $count } страниц не удалось прочитать.
   *[other] Ещё { $count } страницы не удалось прочитать.
}
ocr-remark-empty = Текст не найден.
