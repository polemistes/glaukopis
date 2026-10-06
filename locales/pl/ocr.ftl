# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = Pliki PDF i obrazy
ocr-no-tesseract = Tesseract, który czyta tekst na obrazach, nie jest zainstalowany lub nie został znaleziony. Zainstaluj go menedżerem pakietów swojego systemu, razem z danymi języków, które czytasz (w systemie Arch: tesseract oraz tesseract-data-eng, tesseract-data-pol i tak dalej), albo podaj w ustawieniach, gdzie jest.
ocr-failed = Nie udało się odczytać tekstu.
ocr-looking = Oglądanie { $file }…
ocr-about-picture = Tekst jest czytany z obrazu.
ocr-about-scan = { $pages ->
    [one] PDF nie ma tekstu: jest czytany z obrazu swojej strony.
    [few] Żadna z { $pages } stron nie ma tekstu: są czytane z ich obrazów.
    [many] Żadna z { $pages } stron nie ma tekstu: są czytane z ich obrazów.
   *[other] Żadna z { $pages } stron nie ma tekstu: są czytane z ich obrazów.
}
ocr-about-some = { $without ->
    [one] Jedna z { $pages } stron nie ma tekstu i jest czytana z jej obrazu; pozostałe brane są, jak są.
    [few] { $without } z { $pages } stron nie mają tekstu i są czytane z ich obrazów; pozostałe brane są, jak są.
    [many] { $without } z { $pages } stron nie ma tekstu i jest czytanych z ich obrazów; pozostałe brane są, jak są.
   *[other] { $without } z { $pages } stron nie ma tekstu i jest czytanych z ich obrazów; pozostałe brane są, jak są.
}
ocr-about-text = { $pages ->
    [one] Strona ma tekst, który brany jest, jak jest.
    [few] Każda strona ma tekst, który brany jest, jak jest.
    [many] Każda strona ma tekst, który brany jest, jak jest.
   *[other] Każda strona ma tekst, który brany jest, jak jest.
}
ocr-read-all = Czytaj także strony, które mają tekst
ocr-read-all-hint = Ich tekst zostaje, a to, co odczytano, kładzie się na nim.
ocr-read-all-map-hint = To, co odczytano, zajmuje miejsce ich tekstu: gdy jest kiepski albo nie da się go odczytać.
ocr-read = Czytaj tekst
ocr-read-text-pages = Weź strony, które mają tekst
ocr-take-text = Weź tekst
ocr-reading = Czytanie { $file }…
ocr-reading-pages = Odczytano { $done } z { $total } stron
ocr-reading-hint = Strona zajmuje kilka sekund. Anuluj zatrzymuje czytanie.

## How the text is read: what to try when a reading goes badly

ocr-how = Jak się czyta
ocr-how-dpi = Rozdzielczość, w punktach na cal
ocr-how-layout = Układ strony
ocr-how-layout-auto = Jak oceni Tesseract
ocr-how-layout-column = Jedna kolumna
ocr-how-layout-block = Jeden blok tekstu
ocr-how-layout-sparse = Rzadki tekst
ocr-how-contrast = Czarno-białe
ocr-how-hint = Czego spróbować, gdy czytanie idzie źle: wyższej rozdzielczości dla drobnego druku, jednej kolumny, gdy kolumny się mieszają, jednego bloku tekstu dla pojedynczego akapitu i czerni i bieli dla druku bladego lub nierównego.

## The languages of the text

ocr-languages = Języki tekstu
ocr-languages-hint = Najbardziej prawdopodobny pierwszy. Każdy kolejny spowalnia czytanie, i nie zawsze je poprawia.
ocr-language-add = Dodaj język…
ocr-language-remove = Usuń { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Pismo: { $script }
ocr-language-fraktur = { $language }, fraktura
ocr-language-old = { $language }, dawny
ocr-language-vertical = { $language }, pisany pionowo

## A PDF of the library made searchable

ocr-searchable-button = Uczyń przeszukiwalnym…
ocr-searchable-title = Uczyń PDF przeszukiwalnym
ocr-searchable-about = { $without ->
    [one] Jedna z { $pages } stron nie ma tekstu. Zostaje odczytana, a jej tekst kładzie się niewidocznie pod tym, co widać, by dało się go szukać i kopiować. PDF wygląda jak przedtem.
    [few] { $without } z { $pages } stron nie mają tekstu. Zostają odczytane, a ich tekst kładzie się niewidocznie pod tym, co widać, by dało się go szukać i kopiować. PDF wygląda jak przedtem.
    [many] { $without } z { $pages } stron nie ma tekstu. Zostają odczytane, a ich tekst kładzie się niewidocznie pod tym, co widać, by dało się go szukać i kopiować. PDF wygląda jak przedtem.
   *[other] { $without } z { $pages } stron nie ma tekstu. Zostają odczytane, a ich tekst kładzie się niewidocznie pod tym, co widać, by dało się go szukać i kopiować. PDF wygląda jak przedtem.
}
ocr-searchable-has-text = { $pages ->
    [one] Strona ma tekst: PDF już da się przeszukiwać.
    [few] Każda strona ma tekst: PDF już da się przeszukiwać.
    [many] Każda strona ma tekst: PDF już da się przeszukiwać.
   *[other] Każda strona ma tekst: PDF już da się przeszukiwać.
}
ocr-searchable-damaged = Nie udało się rozłożyć pliku PDF, by go zmienić: może być uszkodzony. Jego tekst można mimo to wczytać do projektu jako mapę.
ocr-searchable-make = Uczyń przeszukiwalnym
ocr-strip = Usuń niewidoczny tekst, który mają, i zachowaj tylko to, co odczytano
ocr-strip-hint = Dla kiepskiej warstwy tekstowej, jaką skaner kładzie pod stroną. Widoczne litery zostają, a strona wygląda jak przedtem.
ocr-searchable-done = { $count ->
    [one] PDF jest przeszukiwalny: odczytano jedną stronę
    [few] PDF jest przeszukiwalny: odczytano { $count } strony
    [many] PDF jest przeszukiwalny: odczytano { $count } stron
   *[other] PDF jest przeszukiwalny: odczytano { $count } stron
}
ocr-searchable-failed = { $count ->
    [one] Nie udało się odczytać jednej strony.
    [few] Nie udało się odczytać { $count } stron.
    [many] Nie udało się odczytać { $count } stron.
   *[other] Nie udało się odczytać { $count } stron.
}

## A map from a PDF of the library

ocr-map-button = Mapa jego tekstu…
ocr-map-title = Mapa tekstu
ocr-map-into = Do projektu
ocr-map-new-project = Nowy projekt, nazwany jak on
ocr-map-making = Tworzenie mapy…
ocr-map-failed = Nie udało się utworzyć mapy.

## The text of a picture of the store

ocr-picture-read = Odczytaj tekst z obrazu…
ocr-picture-title = Tekst na obrazie
ocr-picture-empty = Na obrazie nie znaleziono tekstu.
ocr-picture-copy = Kopiuj
ocr-picture-copied = Tekst skopiowano
ocr-picture-map = Zrób z niego mapę

## Tesseract in the settings

ocr-settings-looking = Szukanie…
ocr-settings-missing = Nie znaleziono. Potrzebny do czytania tekstu ze skanów i obrazów. Zainstaluj tesseract menedżerem pakietów swojego systemu, razem z danymi języków, które czytasz (w systemie Arch tesseract-data-eng dla angielskiego, tesseract-data-pol dla polskiego, tesseract-data-grc dla starogreckiego…), albo podaj poniżej, gdzie jest.
ocr-settings-by-itself = Znaleziony samodzielnie
ocr-settings-where = Gdzie jest Tesseract
ocr-settings-look-failed = Nie udało się poszukać Tesseracta
ocr-settings-has = Czyta { $languages }.
ocr-settings-has-none = Nie ma danych żadnego języka: zainstaluj dane któregoś, na przykład tesseract-data-eng.
ocr-settings-first = Czytaj na początku w
ocr-settings-first-hint = Gdy nie wybrano żadnego, język tekstu i język interfejsu.
ocr-settings-how = Jak tekst jest czytany na początku
