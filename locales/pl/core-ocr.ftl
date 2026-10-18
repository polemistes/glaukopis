# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Nie znaleziono żadnego nagłówka: elementami są strony.
ocr-kind-picture = Obraz

## When text cannot be read.

ocr-stopped = Rozpoznawanie zostało przerwane.
ocr-no-language = Tesseract nie ma danych dla języka „{ $language }”.
ocr-no-languages = Tesseract nie ma danych dla żadnego języka. Zaimportuj któryś w Ustawieniach › Programy albo zainstaluj go menedżerem pakietów swojego systemu, na przykład tesseract-data-eng w systemie Arch.
ocr-not-pdf = „{ $file }” nie jest plikiem PDF.
ocr-no-pages = „{ $file }” nie ma stron.
ocr-locked = „{ $file }” jest zablokowany hasłem; jego stron nie da się narysować.
ocr-unreadable = Nie udało się odczytać „{ $file }” jako PDF. Plik może być uszkodzony.
ocr-page-not-drawn = Nie udało się narysować strony { $page }.
ocr-picture-unreadable = Nie udało się odczytać obrazu: { $message }
ocr-not-made = Tesseract nie utworzył { $path }.
ocr-not-made-said = Tesseract nie utworzył { $path }. Powiedział: { $message }
ocr-drawing = Rysunek (SVG) nie ma w sobie obrazu, z którego dałoby się odczytać tekst.

## Making a PDF searchable.

ocr-searchable-locked = PDF jest zablokowany i nie da się go uczynić przeszukiwalnym. Jego tekst można mimo to wczytać do projektu jako mapę.
ocr-searchable-unreadable = Nie udało się uczynić pliku PDF przeszukiwalnym: { $message }
ocr-not-whole = to, co powstało, nie dało się odczytać w całości i nie zostało zachowane.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Nie udało się odczytać strony { $page }: { $message }
ocr-remark-more-failed = { $count ->
    [one] Nie udało się odczytać jeszcze jednej strony.
    [few] Nie udało się odczytać jeszcze { $count } stron.
    [many] Nie udało się odczytać jeszcze { $count } stron.
   *[other] Nie udało się odczytać jeszcze { $count } stron.
}
ocr-remark-empty = Nie znaleziono żadnego tekstu.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Tesseract nie odczytał żadnej strony
    [one] Tesseract odczytał jedną stronę
    [few] Tesseract odczytał { $read } strony
    [many] Tesseract odczytał { $read } stron
   *[other] Tesseract odczytał { $read } stron
}, { $taken ->
    [0] żadnej nie wzięto z własnego tekstu PDF
    [one] jedną wzięto z własnego tekstu PDF
    [few] { $taken } wzięto z własnego tekstu PDF
    [many] { $taken } wzięto z własnego tekstu PDF
   *[other] { $taken } wzięto z własnego tekstu PDF
}, { $failed ->
    [0] każdą dało się odczytać.
    [one] jednej nie dało się odczytać.
    [few] { $failed } nie dało się odczytać.
    [many] { $failed } nie dało się odczytać.
   *[other] { $failed } nie dało się odczytać.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Nie udało się odczytać tej strony: { $message }]
ocr-why-no-tesseract = Tesseract, który odczytuje tekst z obrazów, nie jest zainstalowany.
