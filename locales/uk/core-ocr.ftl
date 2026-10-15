# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Зображення

## When text cannot be read.

ocr-stopped = Читання зупинено.
ocr-no-language = Tesseract не має даних для мови «{ $language }».
ocr-no-languages = Tesseract не має даних для жодної мови. Встановіть дані якоїсь, наприклад tesseract-data-ukr на Arch.
ocr-not-pdf = «{ $file }» — не PDF.
ocr-no-pages = «{ $file }» не має сторінок.
ocr-locked = «{ $file }» захищено паролем, і його сторінки не можна відобразити.
ocr-unreadable = «{ $file }» не вдалося прочитати як PDF. Можливо, він пошкоджений.
ocr-page-not-drawn = Сторінку { $page } не вдалося відобразити.
ocr-picture-unreadable = Не вдалося прочитати зображення: { $message }
ocr-drawing = У кресленні (SVG) немає зображення, з якого можна читати текст.

## Making a PDF searchable.

ocr-searchable-locked = PDF захищено паролем, і його не можна зробити придатним для пошуку. Його текст усе ж можна внести в проєкт як мапу.
ocr-searchable-unreadable = PDF не вдалося зробити придатним для пошуку: { $message }
ocr-not-whole = створене не прочиталося назад цілим, і його не збережено.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Сторінку { $page } не вдалося прочитати: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ще { $count } сторінку не вдалося прочитати.
    [few] Ще { $count } сторінки не вдалося прочитати.
    [many] Ще { $count } сторінок не вдалося прочитати.
   *[other] Ще { $count } сторінки не вдалося прочитати.
}
ocr-remark-empty = Тексту не знайдено.
