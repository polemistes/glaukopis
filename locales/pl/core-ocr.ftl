# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Obraz

## When text cannot be read.

ocr-stopped = Rozpoznawanie zostało przerwane.
ocr-no-language = Tesseract nie ma danych dla języka „{ $language }”.
ocr-no-languages = Tesseract nie ma danych dla żadnego języka. Zainstaluj dane któregoś, na przykład tesseract-data-eng w systemie Arch.
ocr-not-pdf = „{ $file }” nie jest plikiem PDF.
ocr-no-pages = „{ $file }” nie ma stron.
ocr-locked = „{ $file }” jest zablokowany hasłem; jego stron nie da się narysować.
ocr-unreadable = Nie udało się odczytać „{ $file }” jako PDF. Plik może być uszkodzony.
ocr-page-not-drawn = Nie udało się narysować strony { $page }.
ocr-picture-unreadable = Nie udało się odczytać obrazu: { $message }
ocr-drawing = Rysunek (SVG) nie ma w sobie obrazu, z którego dałoby się odczytać tekst.

## Making a PDF searchable.

ocr-searchable-locked = PDF jest zablokowany i nie da się go uczynić przeszukiwalnym. Jego tekst można mimo to wczytać do projektu jako mapę.
ocr-searchable-unreadable = Nie udało się uczynić pliku PDF przeszukiwalnym: { $message }
ocr-not-whole = to, co powstało, nie dało się odczytać w całości i nie zostało zachowane.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Jedną stronę odczytano z jej obrazu.
    [few] { $count } strony odczytano z ich obrazów.
    [many] { $count } stron odczytano z ich obrazów.
   *[other] { $count } stron odczytano z ich obrazów.
}
ocr-remark-text = { $count ->
    [one] Jedna strona miała tekst; wzięto go tak, jak jest w pliku.
    [few] { $count } strony miały tekst; wzięto go tak, jak jest w pliku.
    [many] { $count } stron miało tekst; wzięto go tak, jak jest w pliku.
   *[other] { $count } stron miało tekst; wzięto go tak, jak jest w pliku.
}
ocr-remark-no-tesseract = { $count ->
    [one] Jedna strona nie ma tekstu i pozostaje pusta: Tesseract, który czyta tekst na obrazach, nie jest zainstalowany.
    [few] { $count } strony nie mają tekstu i pozostają puste: Tesseract, który czyta tekst na obrazach, nie jest zainstalowany.
    [many] { $count } stron nie ma tekstu i pozostaje pustych: Tesseract, który czyta tekst na obrazach, nie jest zainstalowany.
   *[other] { $count } stron nie ma tekstu i pozostaje pustych: Tesseract, który czyta tekst na obrazach, nie jest zainstalowany.
}
ocr-remark-not-read = Stron bez tekstu nie udało się odczytać: { $message }
ocr-remark-failed = Nie udało się odczytać strony { $page }: { $message }
ocr-remark-more-failed = { $count ->
    [one] Nie udało się odczytać jeszcze jednej strony.
    [few] Nie udało się odczytać jeszcze { $count } stron.
    [many] Nie udało się odczytać jeszcze { $count } stron.
   *[other] Nie udało się odczytać jeszcze { $count } stron.
}
ocr-remark-empty = Nie znaleziono żadnego tekstu.
