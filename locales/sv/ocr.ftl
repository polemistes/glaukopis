# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-filer och bilder
ocr-no-tesseract = Tesseract, som läser text i bilder, är inte installerat eller kunde inte hittas. Installera det med systemets pakethanterare, med data för de språk du läser (på Arch: tesseract och tesseract-data-eng, tesseract-data-swe och så vidare), eller ange i inställningarna var det finns.
ocr-failed = Texten kunde inte läsas.
ocr-looking = Tittar på { $file }…
ocr-about-picture = Texten läses från bilden.
ocr-about-scan = { $pages ->
    [one] PDF:en har ingen text: den läses från en bild av dess sida.
   *[other] Ingen av de { $pages } sidorna har text: de läses från bilder av dem.
}
ocr-about-some = { $without ->
    [one] En av de { $pages } sidorna har ingen text och läses från en bild av den; de andra tas som de är.
   *[other] { $without } av de { $pages } sidorna har ingen text och läses från bilder av dem; de andra tas som de är.
}
ocr-about-text = { $pages ->
    [one] Sidan har text, som tas som den är.
   *[other] Varje sida har text, som tas som den är.
}
ocr-read-all = Läs också sidorna som har text
ocr-read-all-hint = Deras text blir kvar, och det som läses läggs över den.
ocr-read-all-map-hint = Det som läses tar deras texts plats: för när den är dålig, eller inte kan läsas.
ocr-read = Läs texten
ocr-read-text-pages = Ta sidorna som har text
ocr-take-text = Ta texten
ocr-reading = Läser { $file }…
ocr-reading-pages = { $done } av { $total } sidor lästa
ocr-reading-hint = En sida tar några sekunder. Avbryt stoppar läsningen.

## How the text is read: what to try when a reading goes badly

ocr-how = Hur den läses
ocr-how-dpi = Upplösning, i punkter per tum
ocr-how-layout = Sidans layout
ocr-how-layout-auto = Som Tesseract bedömer
ocr-how-layout-column = En spalt
ocr-how-layout-block = Ett textblock
ocr-how-layout-sparse = Gles text
ocr-how-contrast = Svartvitt
ocr-how-hint = Vad man kan pröva när en läsning går dåligt: högre upplösning för liten stil, en spalt där spalter blandas ihop, ett textblock för ett enda stycke, och svartvitt för tryck som är svagt eller ojämnt.

## The languages of the text

ocr-languages = Textens språk
ocr-languages-hint = Det troligaste först. Varje språk till gör läsningen långsammare, och inte alltid bättre.
ocr-language-add = Lägg till ett språk…
ocr-language-remove = Ta bort { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }, skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, äldre
ocr-language-vertical = { $language }, skrivet uppifrån och ner

## A PDF of the library made searchable

ocr-searchable-button = Gör sökbar…
ocr-searchable-title = Gör PDF:en sökbar
ocr-searchable-about = { $without ->
    [one] En av de { $pages } sidorna har ingen text. Den läses, och dess text läggs osynlig under det som visas, så att den kan sökas och kopieras. PDF:en ser ut som förut.
   *[other] { $without } av de { $pages } sidorna har ingen text. De läses, och deras text läggs osynlig under det som visas, så att den kan sökas och kopieras. PDF:en ser ut som förut.
}
ocr-searchable-has-text = { $pages ->
    [one] Sidan har text: PDF:en kan redan sökas.
   *[other] Varje sida har text: PDF:en kan redan sökas.
}
ocr-searchable-damaged = PDF:en kunde inte tas isär för att ändras: den kan vara skadad. Dess text kan ändå hämtas in i ett projekt som en karta.
ocr-searchable-make = Gör sökbar
ocr-strip = Ta bort den osynliga text de har, och behåll bara det som läses
ocr-strip-hint = För ett textlager som är dåligt, så som en skanner lägger det under sidan. Bokstäver som syns blir kvar, och sidan ser ut som förut.
ocr-searchable-done = { $count ->
    [one] PDF:en är sökbar: en sida lästes
   *[other] PDF:en är sökbar: { $count } sidor lästes
}
ocr-searchable-failed = { $count ->
    [one] En sida kunde inte läsas.
   *[other] { $count } sidor kunde inte läsas.
}

## A map from a PDF of the library

ocr-map-button = En karta över dess text…
ocr-map-title = En karta över texten
ocr-map-into = In i projektet
ocr-map-new-project = Ett nytt projekt, uppkallat efter den
ocr-map-making = Gör kartan…
ocr-map-failed = Kartan kunde inte göras.

## The text of a picture of the store

ocr-picture-read = Läs texten i den…
ocr-picture-title = Texten i bilden
ocr-picture-empty = Ingen text hittades i bilden.
ocr-picture-copy = Kopiera
ocr-picture-copied = Texten är kopierad
ocr-picture-map = Gör en karta av den

## Tesseract in the settings

ocr-settings-looking = Letar…
ocr-settings-missing = Hittades inte. Behövs för att läsa text ur inskanningar och bilder. Installera tesseract med systemets pakethanterare, med data för de språk du läser (tesseract-data-eng för engelska på Arch, tesseract-data-swe för svenska, tesseract-data-grc för klassisk grekiska, …), eller ange nedan var det finns.
ocr-settings-by-itself = Hittat av sig självt
ocr-settings-where = Var Tesseract finns
ocr-settings-look-failed = Tesseract kunde inte letas upp
ocr-settings-has = Det läser { $languages }.
ocr-settings-has-none = Det har inga data för något språk: installera data för ett, som tesseract-data-eng.
ocr-settings-first = Läses in från början
ocr-settings-first-hint = När inga är valda, textens språk och gränssnittets.
ocr-settings-how = Hur text läses från början
