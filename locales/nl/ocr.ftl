# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF's en afbeeldingen
ocr-no-tesseract = Tesseract, dat tekst in afbeeldingen leest, is niet geïnstalleerd of kon niet worden gevonden. Installeer het met de pakketbeheerder van je systeem, met de gegevens van de talen die je leest (op Arch: tesseract en tesseract-data-nld, tesseract-data-eng enzovoort), of zeg in de instellingen waar het staat.
ocr-failed = De tekst kon niet worden gelezen.
ocr-looking = { $file } wordt bekeken…
ocr-about-picture = De tekst wordt uit de afbeelding gelezen.
ocr-about-scan = { $pages ->
    [one] De PDF heeft geen tekst: hij wordt gelezen van een afbeelding van zijn pagina.
   *[other] Geen van de { $pages } pagina's heeft tekst: ze worden gelezen van afbeeldingen ervan.
}
ocr-about-some = { $without ->
    [one] Eén van de { $pages } pagina's heeft geen tekst en wordt gelezen van een afbeelding ervan; de andere worden overgenomen zoals ze zijn.
   *[other] { $without } van de { $pages } pagina's hebben geen tekst en worden gelezen van afbeeldingen ervan; de andere worden overgenomen zoals ze zijn.
}
ocr-about-text = { $pages ->
    [one] De pagina heeft tekst, die wordt overgenomen zoals ze is.
   *[other] Elke pagina heeft tekst, die wordt overgenomen zoals ze is.
}
ocr-read-all = Ook de pagina's met tekst lezen
ocr-read-all-hint = Hun tekst blijft, en wat wordt gelezen, komt eroverheen.
ocr-read-all-map-hint = Wat wordt gelezen, komt in de plaats van hun tekst: voor als die slecht is, of niet kan worden gelezen.
ocr-read = De tekst lezen
ocr-read-text-pages = De pagina's met tekst overnemen
ocr-take-text = De tekst overnemen
ocr-reading = { $file } wordt gelezen…
ocr-reading-pages = { $done } van { $total } pagina's gelezen
ocr-reading-hint = Een pagina duurt een paar seconden. Annuleren stopt het lezen.

## How the text is read: what to try when a reading goes badly

ocr-how = Hoe het wordt gelezen
ocr-how-dpi = Resolutie, in punten per inch
ocr-how-layout = Indeling van de pagina
ocr-how-layout-auto = Zoals Tesseract het inschat
ocr-how-layout-column = Eén kolom
ocr-how-layout-block = Eén blok tekst
ocr-how-layout-sparse = Verspreide tekst
ocr-how-contrast = Zwart-wit
ocr-how-hint = Wat te proberen als het lezen slecht gaat: een hogere resolutie voor kleine letters, één kolom waar kolommen door elkaar raken, één blok tekst voor een enkele alinea, en zwart-wit voor druk die vaag of ongelijk is.

## The languages of the text

ocr-languages = Talen van de tekst
ocr-languages-hint = De waarschijnlijkste eerst. Elke taal erbij maakt het lezen trager, en niet altijd beter.
ocr-language-add = Een taal toevoegen…
ocr-language-remove = { $language } weghalen
# A script rather than a language: "Latin script".
ocr-language-script = Schrift: { $script }
ocr-language-fraktur = { $language }, fraktuur
ocr-language-old = { $language }, ouder
ocr-language-vertical = { $language }, verticaal geschreven

## A PDF of the library made searchable

ocr-searchable-button = Doorzoekbaar maken…
ocr-searchable-title = De PDF doorzoekbaar maken
ocr-searchable-about = { $without ->
    [one] Eén van de { $pages } pagina's heeft geen tekst. Ze wordt gelezen, en haar tekst wordt onzichtbaar onder het getoonde gelegd, zodat hij kan worden doorzocht en gekopieerd. De PDF ziet eruit zoals hij was.
   *[other] { $without } van de { $pages } pagina's hebben geen tekst. Ze worden gelezen, en hun tekst wordt onzichtbaar onder het getoonde gelegd, zodat hij kan worden doorzocht en gekopieerd. De PDF ziet eruit zoals hij was.
}
ocr-searchable-has-text = { $pages ->
    [one] De pagina heeft tekst: de PDF kan al worden doorzocht.
   *[other] Elke pagina heeft tekst: de PDF kan al worden doorzocht.
}
ocr-searchable-damaged = De PDF kon niet uit elkaar worden gehaald om te worden veranderd: hij is misschien beschadigd. Zijn tekst kan wel als mindmap in een project worden binnengehaald.
ocr-searchable-make = Doorzoekbaar maken
ocr-strip = De onzichtbare tekst die ze hebben weghalen, en alleen houden wat wordt gelezen
ocr-strip-hint = Voor een tekstlaag die slecht is, zoals een scanner die onder de pagina legt. Letters die zichtbaar zijn, blijven, en de pagina ziet eruit zoals ze was.
ocr-searchable-done = { $count ->
    [one] De PDF is doorzoekbaar: één pagina is gelezen
   *[other] De PDF is doorzoekbaar: { $count } pagina's zijn gelezen
}
ocr-searchable-failed = { $count ->
    [one] Eén pagina kon niet worden gelezen.
   *[other] { $count } pagina's konden niet worden gelezen.
}

## A map from a PDF of the library

ocr-map-button = Een mindmap van zijn tekst…
ocr-map-title = Een mindmap van de tekst
ocr-map-into = In het project
ocr-map-new-project = Een nieuw project, ernaar genoemd
ocr-map-making = De mindmap wordt gemaakt…
ocr-map-failed = De mindmap kon niet worden gemaakt.

## The text of a picture of the store

ocr-picture-read = De tekst erin lezen…
ocr-picture-title = De tekst in de afbeelding
ocr-picture-empty = Er is geen tekst in de afbeelding gevonden.
ocr-picture-copy = Kopiëren
ocr-picture-copied = De tekst is gekopieerd
ocr-picture-map = Er een mindmap van maken

## Tesseract in the settings

ocr-settings-looking = Zoeken…
ocr-settings-missing = Niet gevonden. Nodig om tekst uit scans en afbeeldingen te lezen. Installeer tesseract met de pakketbeheerder van je systeem, met de gegevens van de talen die je leest (tesseract-data-nld voor Nederlands op Arch, tesseract-data-eng voor Engels, tesseract-data-grc voor Oudgrieks, …), of zeg hieronder waar het staat.
ocr-settings-by-itself = Vanzelf gevonden
ocr-settings-where = Waar Tesseract staat
ocr-settings-look-failed = Er kon niet naar Tesseract worden gezocht
ocr-settings-has = Het leest { $languages }.
ocr-settings-has-none = Het heeft van geen enkele taal gegevens: installeer die van een taal, zoals tesseract-data-nld.
ocr-settings-first = Eerst lezen in
ocr-settings-first-hint = Als er geen zijn gekozen, de taal van de tekst en die van de interface.
ocr-settings-how = Hoe tekst eerst wordt gelezen
