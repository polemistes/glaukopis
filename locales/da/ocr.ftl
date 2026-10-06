# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF'er og billeder
ocr-no-tesseract = Tesseract, som læser tekst i billeder, er ikke installeret eller blev ikke fundet. Installer det med dit systems pakkehåndtering, sammen med dataene for de sprog, du læser (på Arch: tesseract og tesseract-data-eng, tesseract-data-dan og så videre), eller sig i indstillingerne, hvor det er.
ocr-failed = Teksten kunne ikke læses.
ocr-looking = Ser på { $file }…
ocr-about-picture = Teksten læses fra billedet.
ocr-about-scan = { $pages ->
    [one] PDF'en har ingen tekst: den læses fra et billede af dens side.
   *[other] Ingen af de { $pages } sider har tekst: de læses fra billeder af dem.
}
ocr-about-some = { $without ->
    [one] Én af de { $pages } sider har ingen tekst og læses fra et billede af den; de andre tages, som de er.
   *[other] { $without } af de { $pages } sider har ingen tekst og læses fra billeder af dem; de andre tages, som de er.
}
ocr-about-text = { $pages ->
    [one] Siden har tekst, som tages, som den er.
   *[other] Alle siderne har tekst, som tages, som den er.
}
ocr-read-all = Læs også de sider, der har tekst
ocr-read-all-hint = Deres tekst bliver, og det, der læses, lægges over den.
ocr-read-all-map-hint = Det, der læses, træder i stedet for deres tekst: når den er dårlig eller ikke kan læses.
ocr-read = Læs teksten
ocr-read-text-pages = Tag de sider, der har tekst
ocr-take-text = Tag teksten
ocr-reading = Læser { $file }…
ocr-reading-pages = { $done } af { $total } sider læst
ocr-reading-hint = En side tager nogle sekunder. Annuller standser læsningen.

## How the text is read: what to try when a reading goes badly

ocr-how = Hvordan den læses
ocr-how-dpi = Opløsning, i punkter pr. tomme
ocr-how-layout = Sidens opsætning
ocr-how-layout-auto = Som Tesseract bedømmer det
ocr-how-layout-column = Én spalte
ocr-how-layout-block = Én tekstblok
ocr-how-layout-sparse = Spredt tekst
ocr-how-contrast = Sort-hvid
ocr-how-hint = Hvad der kan prøves, når en læsning går dårligt: en højere opløsning til lille skrift, én spalte, hvor spalter blandes sammen, én tekstblok til et enkelt afsnit, og sort-hvid til tryk, der er svagt eller ujævnt.

## The languages of the text

ocr-languages = Tekstens sprog
ocr-languages-hint = Det mest sandsynlige først. Hvert sprog mere gør læsningen langsommere, og ikke altid bedre.
ocr-language-add = Tilføj et sprog…
ocr-language-remove = Fjern { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }-skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, ældre
ocr-language-vertical = { $language }, skrevet lodret

## A PDF of the library made searchable

ocr-searchable-button = Gør søgbar…
ocr-searchable-title = Gør PDF'en søgbar
ocr-searchable-about = { $without ->
    [one] Én af de { $pages } sider har ingen tekst. Den læses, og dens tekst lægges usynligt under det, der vises, så den kan søges i og kopieres. PDF'en ser ud, som den gjorde.
   *[other] { $without } af de { $pages } sider har ingen tekst. De læses, og deres tekst lægges usynligt under det, der vises, så den kan søges i og kopieres. PDF'en ser ud, som den gjorde.
}
ocr-searchable-has-text = { $pages ->
    [one] Siden har tekst: PDF'en kan allerede søges i.
   *[other] Alle siderne har tekst: PDF'en kan allerede søges i.
}
ocr-searchable-damaged = PDF'en kunne ikke skilles ad for at blive ændret: den kan være beskadiget. Dens tekst kan stadig hentes ind i et projekt som et kort.
ocr-searchable-make = Gør søgbar
ocr-strip = Fjern den usynlige tekst, de har, og behold kun det, der læses
ocr-strip-hint = Til et tekstlag, der er dårligt, som en skanner lægger det under siden. Bogstaver, der ses, bliver, og siden ser ud, som den gjorde.
ocr-searchable-done = { $count ->
    [one] PDF'en er søgbar: én side blev læst
   *[other] PDF'en er søgbar: { $count } sider blev læst
}
ocr-searchable-failed = { $count ->
    [one] Én side kunne ikke læses.
   *[other] { $count } sider kunne ikke læses.
}

## A map from a PDF of the library

ocr-map-button = Et kort af dens tekst…
ocr-map-title = Et kort af teksten
ocr-map-into = Ind i projektet
ocr-map-new-project = Et nyt projekt, opkaldt efter den
ocr-map-making = Laver kortet…
ocr-map-failed = Kortet kunne ikke laves.

## The text of a picture of the store

ocr-picture-read = Læs teksten i det…
ocr-picture-title = Teksten i billedet
ocr-picture-empty = Der blev ikke fundet nogen tekst i billedet.
ocr-picture-copy = Kopiér
ocr-picture-copied = Teksten er kopieret
ocr-picture-map = Lav et kort af den

## Tesseract in the settings

ocr-settings-looking = Leder…
ocr-settings-missing = Ikke fundet. Behøves for at læse tekst fra skanninger og billeder. Installer tesseract med dit systems pakkehåndtering, sammen med dataene for de sprog, du læser (tesseract-data-eng for engelsk på Arch, tesseract-data-dan for dansk, tesseract-data-grc for oldgræsk, …), eller sig nedenfor, hvor det er.
ocr-settings-by-itself = Fundet af sig selv
ocr-settings-where = Hvor Tesseract er
ocr-settings-look-failed = Der kunne ikke ledes efter Tesseract
ocr-settings-has = Det læser { $languages }.
ocr-settings-has-none = Det har ingen sprogs data: installer et sprogs, såsom tesseract-data-eng.
ocr-settings-first = Sprog til at begynde med
ocr-settings-first-hint = Når ingen er valgt, tekstens sprog og grænsefladens.
ocr-settings-how = Hvordan tekst læses til at begynde med
