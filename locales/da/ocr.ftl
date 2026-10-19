# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF'er og billeder
ocr-no-tesseract = Tesseract, som læser tekst i billeder, er ikke installeret eller blev ikke fundet. Installer det med dit systems pakkehåndtering, sammen med dataene for de sprog, du læser (på Arch: tesseract og tesseract-data-eng, tesseract-data-dan og så videre), eller sig i indstillingerne, hvor det er.
ocr-failed = Teksten kunne ikke læses.
ocr-looking = Ser på { $file }…
ocr-about-picture = Teksten læses fra billedet.
ocr-read = Læs teksten
ocr-read-text-pages = Tag de sider, der har tekst
ocr-take-text = Tag teksten
ocr-reading = Læser { $file }…
ocr-reading-pages = { $done } af { $total } sider læst
ocr-reading-hint = En side tager nogle sekunder. Annuller standser læsningen.

## How the text is read: what to try when a reading goes badly

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
ocr-searchable-damaged = PDF'en kunne ikke skilles ad for at blive ændret: den kan være beskadiget. Dens tekst kan stadig hentes ind i et projekt som et kort.
ocr-searchable-make = Gør søgbar
ocr-searchable-done = { $count ->
    [one] PDF'en er søgbar: én side blev læst
   *[other] PDF'en er søgbar: { $count } sider blev læst
}
ocr-searchable-failed = { $count ->
    [one] Én side kunne ikke læses.
   *[other] { $count } sider kunne ikke læses.
}

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importer dens tekst som et kort…
ocr-map-title = Importer teksten som et kort
ocr-map-into = Ind i projektet
ocr-map-new-project = Et nyt projekt, opkaldt efter den
ocr-map-make = Importer
ocr-map-making = Importerer…
ocr-map-failed = Elementerne kunne ikke laves.

## The text of a picture of the store

ocr-picture-read = Læs teksten i det…
ocr-picture-title = Teksten i billedet
ocr-picture-empty = Der blev ikke fundet nogen tekst i billedet.
ocr-picture-copy = Kopiér
ocr-picture-copied = Teksten er kopieret
ocr-picture-map = Lav et element af den

## Tesseract in the settings

ocr-settings-looking = Leder…
ocr-settings-missing = Ikke fundet. Behøves for at læse tekst fra skanninger og billeder. Installer tesseract med dit systems pakkehåndtering, sammen med dataene for de sprog, du læser (tesseract-data-eng for engelsk på Arch, tesseract-data-dan for dansk, tesseract-data-grc for oldgræsk, …), eller sig nedenfor, hvor det er.
ocr-settings-by-itself = Fundet af sig selv
ocr-settings-where = Hvor Tesseract er
ocr-settings-look-failed = Der kunne ikke ledes efter Tesseract
ocr-settings-title = Tekstgenkendelse (OCR)
ocr-settings-has-none = Det har ingen sprogs data: importer et nedenfor, eller installer et med dit systems pakkehåndtering, såsom tesseract-data-eng.
ocr-settings-first = Standardsprog til OCR
ocr-settings-how = Standardindstillinger til OCR
ocr-settings-languages = Sprog til OCR
ocr-settings-languages-hint = Glaukopis bruger Tesseract til OCR. De sprogfiler, du importerer her, bruges i stedet for dem, du måtte have installeret på dit system.
ocr-source-system = System
ocr-source-imported = Importeret
ocr-settings-not-found = Tesseract blev ikke fundet. Angiv, hvor det er, under Programmer nedenfor.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = PDF'ens tekst

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Den græske tekst er gemt som glyffernes navne i { $fonts } og kan gøres til græske bogstaver.
ocr-text-scheme-expert-names = Kapitæler og minuskeltal i { $fonts } er gemt ved navn og kan gøres til deres bogstaver og cifre.
ocr-text-scheme-beta-code = Græsk er skrevet i Beta Code og kan gøres til græske bogstaver.
ocr-text-page = Side { $label }
ocr-text-page-none = Ingen tekst på denne side: den læses fra et billede af den.
ocr-searchable-make-readable = Gør læsbar
ocr-searchable-readable-done = { $count ->
    [one] PDF'ens tekst er læsbar nu: én skrift fik sine bogstaver
   *[other] PDF'ens tekst er læsbar nu: { $count } skrifter fik deres bogstaver
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Bevar sidernes form
ocr-shape-hint = Overskrifter, linjer bevaret som linjer, numre i margenen, og sidehovederne udeladt. Slået fra bliver siderne almindelige afsnit.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Elementer
ocr-structure-headings = Efter overskrifterne
ocr-page-marks = Angiv, hvor hver side begynder
ocr-page-marks-hint = Et stedmærke med sidens nummer, der hvor den begyndte.
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Det, der bliver lavet
ocr-outline-all = Vis alle { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Fundne typografier
ocr-styles-about = { $count ->
    [one] Én typografi går igen ved siden af brødteksten. Sig, hvad den er, eller lad den være tekst.
   *[other] { $count } typografier går igen ved siden af brødteksten. Sig, hvad hver af dem er, eller lad dem være tekst.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Én gang
   *[other] { $count } gange
} på { $pages ->
    [one] én side
   *[other] { $pages } sider
}
ocr-styles-kind = Hvad den er
ocr-styles-own = En egen art…
ocr-styles-own-name = Artens navn
ocr-styles-own-hint = Laves, når dokumentet hentes ind, uden eget udseende, til du giver den et.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } bevarede linjer
   *[other] { $look } tekst
}
ocr-style-indented = { $kept ->
    [yes] indrykkede
   *[other] indrykket
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] større
}
ocr-style-bold = { $kept ->
    [yes] fede
   *[other] fed
}
ocr-style-italic = { $kept ->
    [yes] kursive
   *[other] kursiv
}
# A style that differs from the body only by its font.
ocr-style-family = Tekst i { $family }
ocr-style-other = Anden tekst
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] græske
    [Cyrillic] kyrilliske
   *[Latin] latinske
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Det { $a } alfabet læses sammen med det { $b }: bogstaver, der ligner hinanden i de to ({ $alike }), læses ofte som hinanden, og hele ord bliver forkerte. Vil du kun have ét alfabet, så fjern de andre.
