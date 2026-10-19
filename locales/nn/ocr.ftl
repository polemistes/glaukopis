# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-ar og bilete
ocr-no-tesseract = Tesseract, som les tekst i bilete, er ikkje installert eller vart ikkje funne. Installer det med pakkehandsamaren på systemet ditt, saman med dataa for språka du les (på Arch: tesseract og tesseract-data-eng, tesseract-data-nor og så vidare), eller sei i innstillingane kvar det er.
ocr-failed = Teksten kunne ikkje lesast.
ocr-looking = Ser på { $file } …
ocr-about-picture = Teksten blir lesen frå biletet.
ocr-read = Les teksten
ocr-read-text-pages = Ta sidene som har tekst
ocr-take-text = Ta teksten
ocr-reading = Les { $file } …
ocr-reading-pages = { $done } av { $total } sider lesne
ocr-reading-hint = Ei side tek nokre sekund. Avbryt stoppar lesinga.

## How the text is read: what to try when a reading goes badly

ocr-how-dpi = Oppløysing, i punkt per tomme
ocr-how-layout = Oppsettet på sida
ocr-how-layout-auto = Som Tesseract vurderer
ocr-how-layout-column = Éi spalte
ocr-how-layout-block = Éi tekstblokk
ocr-how-layout-sparse = Spreidd tekst
ocr-how-contrast = Svart-kvitt
ocr-how-hint = Det som kan prøvast når ei lesing går dårleg: høgare oppløysing for lita skrift, éi spalte der spalter blir blanda saman, éi tekstblokk for eitt einskilt avsnitt, og svart-kvitt for trykk som er svakt eller ujamt.

## The languages of the text

ocr-languages = Språk i teksten
ocr-languages-hint = Det mest sannsynlege først. Kvart språk til gjer lesinga seinare, og ikkje alltid betre.
ocr-language-add = Legg til eit språk …
ocr-language-remove = Ta bort { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }-skrift
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, eldre
ocr-language-vertical = { $language }, skrive nedover

## A PDF of the library made searchable

ocr-searchable-button = Gjer søkbar …
ocr-searchable-title = Gjer PDF-en søkbar
ocr-searchable-damaged = PDF-en kunne ikkje takast frå kvarandre for å endrast: den kan vere skadd. Teksten kan likevel hentast inn i eit prosjekt som eit kart.
ocr-searchable-make = Gjer søkbar
ocr-searchable-done = { $count ->
    [one] PDF-en er søkbar: éi side vart lesen
   *[other] PDF-en er søkbar: { $count } sider vart lesne
}
ocr-searchable-failed = { $count ->
    [one] Éi side kunne ikkje lesast.
   *[other] { $count } sider kunne ikkje lesast.
}

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importer teksten i den som eit kart …
ocr-map-title = Importer teksten som eit kart
ocr-map-into = Inn i prosjektet
ocr-map-new-project = Eit nytt prosjekt, kalla opp etter den
ocr-map-make = Importer
ocr-map-making = Importerer …
ocr-map-failed = Elementa kunne ikkje lagast.

## The text of a picture of the store

ocr-picture-read = Les teksten i det …
ocr-picture-title = Teksten i biletet
ocr-picture-empty = Ingen tekst vart funnen i biletet.
ocr-picture-copy = Kopier
ocr-picture-copied = Teksten er kopiert
ocr-picture-map = Lag eit element av den

## Tesseract in the settings

ocr-settings-looking = Leitar …
ocr-settings-missing = Ikkje funne. Trengst for å lese tekst frå skanna sider og bilete. Installer tesseract med pakkehandsamaren på systemet ditt, saman med dataa for språka du les (tesseract-data-eng for engelsk på Arch, tesseract-data-nor for norsk, tesseract-data-grc for gammalgresk, …), eller sei nedanfor kvar det er.
ocr-settings-by-itself = Funne av seg sjølv
ocr-settings-where = Kvar Tesseract er
ocr-settings-look-failed = Det gjekk ikkje å leite etter Tesseract
ocr-settings-title = Optisk teiknattkjenning (OCR)
ocr-settings-has-none = Det har ikkje dataa for noko språk: importer eitt nedanfor, eller installer eitt med pakkehandsamaren på systemet ditt, til dømes tesseract-data-eng.
ocr-settings-first = Standardspråk for OCR
ocr-settings-how = Standardinnstillingar for OCR
ocr-settings-languages = Språk for OCR
ocr-settings-languages-hint = Glaukopis bruker Tesseract til OCR. Språkfilene du importerer her, blir brukte i staden for dei du kan ha installert på systemet ditt.
ocr-source-system = System
ocr-source-imported = Importert
ocr-settings-not-found = Tesseract vart ikkje funne. Sei kvar det er under Program, nedanfor.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Teksten PDF-en har

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Gresken er lagra som teiknnamna i { $fonts }, og kan gjerast om til greske bokstavar.
ocr-text-scheme-expert-names = Kapitélar og gammaldagse tal i { $fonts } er lagra ved namn, og kan gjerast om til bokstavane og sifra sine.
ocr-text-scheme-beta-code = Gresk er skrive i Beta Code, og kan gjerast om til greske bokstavar.
ocr-text-page = Side { $label }
ocr-text-page-none = Ingen tekst på denne sida: den blir lesen frå eit bilete av den.
ocr-searchable-make-readable = Gjer lesbar
ocr-searchable-readable-done = { $count ->
    [one] Teksten i PDF-en er lesbar no: éi skrift fekk bokstavane sine
   *[other] Teksten i PDF-en er lesbar no: { $count } skrifter fekk bokstavane sine
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Hald på forma til sidene
ocr-shape-hint = Overskrifter, linjer som blir haldne som linjer, nummer i margen, og topptekstane utelatne. Er det slått av, blir sidene vanlege avsnitt.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Element
ocr-structure-headings = Etter overskriftene
ocr-page-marks = Merk der kvar side byrjar
ocr-page-marks-hint = Eit referansemerke med sidetalet, der sida byrja.
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Dette blir laga
ocr-outline-all = Vis alle { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Tekststilar som er funne
ocr-styles-about = { $count ->
    [one] Éin tekststil går att ved sida av brødteksten. Sei kva den er, eller la den vere tekst.
   *[other] { $count } tekststilar går att ved sida av brødteksten. Sei kva kvar av dei er, eller la dei vere tekst.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Éin gong
   *[other] { $count } gonger
} på { $pages ->
    [one] éi side
   *[other] { $pages } sider
}
ocr-styles-kind = Kva det er
ocr-styles-own = Eit eige slag …
ocr-styles-own-name = Namnet på slaget
ocr-styles-own-hint = Blir laga når dokumentet blir henta inn, utan eigen utsjånad før du gir det ein.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } linjer
   *[other] { $look } tekst
}
ocr-style-indented = { $kept ->
    [yes] innrykte
   *[other] innrykt
}
ocr-style-smaller = { $kept ->
   *[other] mindre
}
ocr-style-larger = { $kept ->
   *[other] større
}
ocr-style-bold = { $kept ->
    [yes] feite
   *[other] feit
}
ocr-style-italic = { $kept ->
    [yes] kursive
   *[other] kursiv
}
# A style that differs from the body only by its font.
ocr-style-family = Tekst i { $family }
ocr-style-other = Annan tekst
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] greske
    [Cyrillic] kyrilliske
   *[Latin] latinske
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Det { $a } alfabetet blir lese saman med det { $b }: bokstavar som liknar kvarandre i dei to ({ $alike }), blir ofte lesne som kvarandre, og heile ord blir feil. For berre eitt alfabet, ta bort dei andre.
