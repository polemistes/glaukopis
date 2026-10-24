# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Ingen rubrik hittades: sidorna är elementen.
ocr-kind-picture = Bild

## When text cannot be read.

ocr-stopped = Läsningen avbröts.
ocr-no-language = Tesseract har inga data för språket ”{ $language }”.
ocr-no-languages = Tesseract har inga data för något språk. Importera ett under Inställningar › Program, eller installera ett med systemets pakethanterare, som tesseract-data-eng på Arch.
ocr-not-pdf = ”{ $file }” är inte en PDF.
ocr-no-pages = ”{ $file }” har inga sidor.
ocr-locked = ”{ $file }” är låst med ett lösenord, och dess sidor kan inte ritas upp.
ocr-unreadable = ”{ $file }” kunde inte läsas som PDF. Den kan vara skadad.
ocr-page-not-drawn = Sidan { $page } kunde inte ritas upp.
ocr-no-such-page = PDF:en har ingen sida { $page }: den har { $pages }.
ocr-reading-gone = Läsningen finns inte längre kvar: läs filen igen.
ocr-picture-unreadable = Bilden kunde inte läsas: { $message }
ocr-not-made = Tesseract gjorde inte { $path }.
ocr-not-made-said = Tesseract gjorde inte { $path }. Det sa: { $message }
ocr-drawing = En ritning (SVG) har ingen bild i sig att läsa text ur.
ocr-child-time = Läsningen av ”{ $file }” tog längre tid än den får, och stoppades. Filen kan vara skadad, eller gjord på ett sätt som inte kan läsas.
ocr-child-memory = Läsningen av ”{ $file }” tog mer minne än den får, och stoppades. Filen kan vara skadad, eller gjord på ett sätt som inte kan läsas.
ocr-child-failed = ”{ $file }” kunde inte läsas: { $message }
ocr-child-not-started = ”{ $file }” kunde inte läsas, eftersom ingen process kunde startas för att läsa in den: { $message }

## Making a PDF searchable.

ocr-searchable-locked = PDF:en är låst och kan inte göras sökbar. Dess text kan ändå hämtas in i ett projekt som en karta.
ocr-searchable-unreadable = PDF:en kunde inte göras sökbar: { $message }
ocr-not-whole = det som gjordes gick inte att läsa tillbaka helt, och sparades inte.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Sidan { $page } kunde inte läsas: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ytterligare en sida kunde inte läsas.
   *[other] Ytterligare { $count } sidor kunde inte läsas.
}
ocr-remark-empty = Ingen text hittades.
ocr-remark-poorly = { $count ->
    [one] En sida lästes dåligt: { $pages }. Ett annat språk, frakturmodellen för gotisk skrift eller en annan layout kan läsa den bättre; pröva den innan du läser den igen.
   *[other] { $count } sidor lästes dåligt: { $pages }. Ett annat språk, frakturmodellen för gotisk skrift eller en annan layout kan läsa dem bättre; pröva en sida innan du läser om alla.
}

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Ingen sida läst av Tesseract
    [one] En sida läst av Tesseract
   *[other] { $read } sidor lästa av Tesseract
}, { $taken ->
    [0] ingen tagen ur PDF:ens egen text
    [one] en tagen ur PDF:ens egen text
   *[other] { $taken } tagna ur PDF:ens egen text
}, { $failed ->
    [0] ingen som inte kunde läsas.
    [one] en som inte kunde läsas.
   *[other] { $failed } som inte kunde läsas.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Den här sidan kunde inte läsas: { $message }]
ocr-why-no-tesseract = Tesseract, som läser text i bilder, är inte installerat.

## The settings in plain words, stage 1: the Fraktur models named by the languages they were trained on.

# Under pages read poorly, where the language read was once set in Gothic type, and neither Norwegian nor Danish was read.
ocr-remark-fraktur = Böcker i gotisk skrift, som många norska, danska, svenska och tyska böcker trycktes i före omkring 1900, läses med Fraktur (gotisk skrift), tyska, vald som första eller enda språk, vilket språk de än är skrivna på. Den känner inte till æ, ø och å, utan läser dem som e, o och a.
# The same, where Norwegian or Danish was read: the Fraktur model of Glaukopis's server that knows æ, ø and å.
ocr-remark-fraktur-dan = Norska och danska böcker i gotisk skrift, som många trycktes i före omkring 1900, läses med Fraktur (gotisk skrift), norska och danska, importerad från Glaukopis server och vald som första eller enda språk, vilka språk som än står bredvid: den känner till æ, ø och å, vilket den tyska inte gör.
