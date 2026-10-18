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
ocr-searchable-done = { $count ->
    [one] PDF:en är sökbar: en sida lästes
   *[other] PDF:en är sökbar: { $count } sidor lästes
}
ocr-searchable-failed = { $count ->
    [one] En sida kunde inte läsas.
   *[other] { $count } sidor kunde inte läsas.
}

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importera dess text som en karta…
ocr-map-title = Importera texten som en karta
ocr-map-into = In i projektet
ocr-map-new-project = Ett nytt projekt, uppkallat efter den
ocr-map-make = Importera
ocr-map-making = Importerar…
ocr-map-failed = Elementen kunde inte göras.

## The text of a picture of the store

ocr-picture-read = Läs texten i den…
ocr-picture-title = Texten i bilden
ocr-picture-empty = Ingen text hittades i bilden.
ocr-picture-copy = Kopiera
ocr-picture-copied = Texten är kopierad
ocr-picture-map = Gör ett element av den

## Tesseract in the settings

ocr-settings-looking = Letar…
ocr-settings-missing = Hittades inte. Behövs för att läsa text ur inskanningar och bilder. Installera tesseract med systemets pakethanterare, med data för de språk du läser (tesseract-data-eng för engelska på Arch, tesseract-data-swe för svenska, tesseract-data-grc för klassisk grekiska, …), eller ange nedan var det finns.
ocr-settings-by-itself = Hittat av sig självt
ocr-settings-where = Var Tesseract finns
ocr-settings-look-failed = Tesseract kunde inte letas upp
ocr-settings-title = Textigenkänning (OCR)
ocr-settings-has-none = Det har inga data för något språk: importera ett nedan, eller installera ett med systemets pakethanterare, som tesseract-data-eng.
ocr-settings-first = Förvalda språk för textigenkänning
ocr-settings-how = Förvalda inställningar för textigenkänning
ocr-settings-languages = Språk för textigenkänning
ocr-settings-languages-hint = Glaukopis använder Tesseract för textigenkänning. De språkfiler du importerar här används i stället för dem du kan ha installerat på systemet.
ocr-source-system = Från systemet
ocr-source-imported = Importerad
ocr-settings-not-found = Tesseract hittades inte. Ange var det finns under Program, nedan.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Texten som PDF:en har
# Said where some pages have text that does not read as text.
ocr-text-poor = { $poor ->
    [one] På en av de { $pages } sidorna som har text går den inte att läsa som text, som när ett typsnitt inte säger vilka bokstäver det visar, eller en läsning var dålig.
   *[other] På { $poor } av de { $pages } sidorna som har text går den inte att läsa som text, som när ett typsnitt inte säger vilka bokstäver det visar, eller en läsning var dålig.
}
# Said where every page that has text has text that does not read as text.
ocr-text-poor-all = { $pages ->
    [one] Texten som PDF:en har går inte att läsa som text, som när ett typsnitt inte säger vilka bokstäver det visar, eller en läsning var dålig.
   *[other] På alla { $pages } sidor som har text går den inte att läsa som text, som när ett typsnitt inte säger vilka bokstäver det visar, eller en läsning var dålig.
}
ocr-text-keep = Behåll texten som PDF:en har
ocr-text-keep-hint = Bara sidorna utan text läses; de andra tas som de är.
ocr-text-keep-searchable-hint = Bara sidorna utan text läses; de andra behåller den text de har.
ocr-text-anew = Läs varje sida på nytt med Tesseract
ocr-text-anew-hint = Bara det Tesseract läser ur bilder av sidorna behålls; texten som PDF:en har tas inte från någon sida.
ocr-text-anew-searchable-hint = Den osynliga text som sidorna har tas bort, och det som läses läggs i dess ställe. Sidorna ser ut som förut.
ocr-about-anew = { $pages ->
    [one] Sidan läses på nytt, från en bild av den.
   *[other] Alla { $pages } sidor läses på nytt, från bilder av dem.
}
ocr-searchable-anew = { $pages ->
    [one] Sidan läses på nytt, och dess text läggs osynlig under det som visas, i stället för den text den hade. PDF:en ser ut som förut.
   *[other] Alla { $pages } sidor läses på nytt, och deras text läggs osynlig under det som visas, i stället för den text de hade. PDF:en ser ut som förut.
}

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-found = Text på { $withText } av { $pages } sidor, i { $fonts }.
ocr-text-found-no-fonts = Text på { $withText } av { $pages } sidor.
# The first fonts, and how many more there are.
ocr-text-fonts-more = { $fonts } och { $count ->
    [one] ett till
   *[other] { $count } till
}
ocr-text-scheme-greek-names = Grekiskan är lagrad som glyfnamnen i { $fonts }, och kan göras om till grekiska bokstäver.
ocr-text-scheme-expert-names = Kapitäler och mediavalsiffror i { $fonts } är lagrade efter namn, och kan göras om till sina bokstäver och siffror.
ocr-text-scheme-beta-code = Grekiskan är skriven i Beta Code, och kan göras om till grekiska bokstäver.
ocr-text-translate = Gör om den till läsbar text
ocr-text-translate-hint = Texten görs läsbar efter det typsnitten säger om sina bokstäver; ingen sida läses från en bild för det.
ocr-text-translate-searchable-hint = PDF:ens egna tabeller rättas, så att varje PDF-läsare kopierar och söker i texten rätt; inget av det som ritas ändras.
ocr-text-anew-no-tesseract = Tesseract, som läser text i bilder, är inte installerat.
ocr-text-page = Sida { $label }
ocr-text-page-none = Ingen text på den här sidan: den läses från en bild av den.
ocr-about-translate = { $without ->
    [0] Texten som PDF:en har görs läsbar; ingen sida läses från en bild.
    [one] Texten som PDF:en har görs läsbar, och den enda sidan utan text läses från en bild av den.
   *[other] Texten som PDF:en har görs läsbar, och de { $without } sidorna utan text läses från bilder av dem.
}
ocr-searchable-translate = { $without ->
    [0] PDF:ens typsnitt får sina bokstäver, så att dess text kan kopieras och sökas rätt. PDF:en ser ut som förut.
    [one] PDF:ens typsnitt får sina bokstäver, och den enda sidan utan text läses och får text. PDF:en ser ut som förut.
   *[other] PDF:ens typsnitt får sina bokstäver, och de { $without } sidorna utan text läses och får text. PDF:en ser ut som förut.
}
ocr-searchable-make-readable = Gör läsbar
ocr-searchable-readable-done = { $count ->
    [one] PDF:ens text är läsbar nu: ett typsnitt fick sina bokstäver
   *[other] PDF:ens text är läsbar nu: { $count } typsnitt fick sina bokstäver
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Behåll sidornas form
ocr-shape-hint = Rubriker, rader som behålls som rader, nummer i marginalen, och kolumntitlarna utelämnade. Utan det blir sidorna vanliga stycken.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Element
ocr-structure-headings = Efter dess rubriker
ocr-structure-pages = Efter dess sidor
ocr-page-marks = Märk ut var varje sida börjar
ocr-page-marks-hint = Ett referensmärke med sidans nummer, där den började.
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Det som kommer att göras
ocr-outline-all = Visa alla { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Textstilar som hittades
ocr-styles-about = { $count ->
    [one] En textstil återkommer vid sidan av brödtexten. Säg vad den är, eller låt den vara text.
   *[other] { $count } textstilar återkommer vid sidan av brödtexten. Säg vad var och en är, eller låt dem vara text.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] En gång
   *[other] { $count } gånger
} på { $pages ->
    [one] en sida
   *[other] { $pages } sidor
}
ocr-styles-kind = Vad den är
ocr-styles-own = Ett eget slag…
ocr-styles-own-name = Slagets namn
ocr-styles-own-hint = Görs när dokumentet hämtas in, utan eget utseende tills du ger det ett.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } bevarade rader
   *[other] { $look } text
}
ocr-style-indented = { $kept ->
    [yes] indragna
   *[other] indragen
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] större
}
ocr-style-bold = { $kept ->
    [yes] feta
   *[other] fet
}
ocr-style-italic = { $kept ->
    [yes] kursiva
   *[other] kursiv
}
# A style that differs from the body only by its font.
ocr-style-family = Text i { $family }
ocr-style-other = Annan text
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] grekiska
    [Cyrillic] kyrilliska
   *[Latin] latinska
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Den { $a } skriften läses tillsammans med den { $b }: bokstäver som liknar varandra i de två ({ $alike }) förväxlas ofta, och hela ord blir fel. För en enda skrift, ta bort de andra.
