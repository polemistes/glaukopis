# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Ofte brugt
library-form-add-field = Tilføj felt
library-form-citation-key = Nøgle
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = laves af forfatter og år
library-form-date-problem = Skriv en dato som 1979, 1979-05 eller 1979-05-12; et tidsrum som 1979/1985.
library-form-remove-field = Fjern { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institution eller andet navn, der holdes samlet
library-names-prefix-suffix = Præfiks og suffiks
    .hint = »van«, »de la« · »jr.«, »III«
library-names-move-up = Flyt op
library-names-move-down = Flyt ned
library-names-more = Mere for dette navn
library-names-name = Navn
library-names-name-of = { $role }: navn
library-names-family = Efternavn
library-names-family-of = { $role }: efternavn
library-names-given = Fornavne
library-names-given-of = { $role }: fornavne
library-names-prefix = Præfiks: van, de la
library-names-prefix-of = { $role }: præfiks
library-names-suffix = Suffiks: jr., III
library-names-suffix-of = { $role }: suffiks

## Words for references, wherever they are shown.

library-untitled = Uden titel
library-no-author = Ingen forfatter
library-no-title = Ingen titel
library-in-library = I dit bibliotek

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = samme DOI
library-reason-isbn = samme ISBN
library-reason-identical = ens i alt, hvad der skiller det ene værk fra det andet
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] samme titel, forfatter og år
            [like] samme titel og forfatter, et år imellem
           *[none] samme titel og forfatter, året kun på den ene
        }
        [like] { $year ->
            [same] samme titel og år, og en forfatter til fælles
            [like] samme titel, en forfatter til fælles, et år imellem
           *[none] samme titel, en forfatter til fælles, året kun på den ene
        }
       *[none] { $year ->
            [same] samme titel og år, forfatteren kun på den ene
            [like] samme titel, et år imellem, forfatteren kun på den ene
           *[none] samme titel, forfatter og år kun på den ene
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] samme forfatter og år, og en lignende titel
            [like] samme forfatter, en lignende titel, et år imellem
           *[none] samme forfatter, en lignende titel, året kun på den ene
        }
        [like] { $year ->
            [same] samme år, en lignende titel, en forfatter til fælles
            [like] en lignende titel, en forfatter til fælles, et år imellem
           *[none] en lignende titel, en forfatter til fælles, året kun på den ene
        }
       *[none] { $year ->
            [same] samme år, en lignende titel, forfatteren kun på den ene
            [like] en lignende titel, et år imellem, forfatteren kun på den ene
           *[none] en lignende titel, forfatter og år kun på den ene
        }
    }
}
library-reason-file = samme fil
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } og { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Denne er allerede i dit bibliotek.
library-duplicate-probable = Denne er måske allerede i dit bibliotek.
library-duplicate-use = Brug denne

## Duplicates in the library.

library-duplicates-title = Dubletter
library-duplicates-count = { $count ->
    [one] { $count } reference ser ud til at være i biblioteket mere end én gang
   *[other] { $count } referencer ser ud til at være i biblioteket mere end én gang
}
library-duplicates-none = Ingen dubletter
    .text = Ingen reference ser ud til at være i biblioteket mere end én gang.
library-duplicates-no-more = Ikke flere dubletter
    .text = Kildehenvisninger til de referencer, der blev slået sammen, henviser nu til dem, der blev beholdt.
library-duplicates-how = Når referencer gøres til én, får den, du beholder, det, den mangler, fra de andre, og beholder sit eget, hvor de er forskellige. Deres filer og samlinger føres sammen, og det, der henviser til dem, henviser til den beholdte.
library-duplicates-same = De samme
library-duplicates-probably-same = Sandsynligvis de samme
library-duplicates-keep-which = Den, der skal beholdes
library-duplicates-kept = Beholdt
library-duplicates-different = De er forskellige
library-duplicates-merge = Gør dem til én
library-duplicates-merging = Gør dem til én…
library-duplicates-failed = Biblioteket kunne ikke gennemsøges for dubletter
library-duplicates-merge-failed = De kunne ikke gøres til én

## Importing references: what a file holds, against what the library has.

library-import = Importer
library-import-title = Importer referencer
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } reference i { $source }
   *[other] { $count } referencer i { $source }
}
library-import-review = { $count ->
    [one] { $count } reference er måske allerede i dit bibliotek
   *[other] { $count } referencer er måske allerede i dit bibliotek
}
library-import-new = { $count ->
    [one] { $count } ny reference
   *[other] { $count } nye referencer
}
library-import-complete = { $count ->
    [one] { $count } reference, der allerede er i dit bibliotek, får flere oplysninger
   *[other] { $count } referencer, der allerede er i dit bibliotek, får flere oplysninger
}
library-import-known = { $count ->
    [one] { $count } reference allerede i dit bibliotek
   *[other] { $count } referencer allerede i dit bibliotek
}
library-import-repeated = { $count ->
    [one] { $count } reference gentaget inden for importen
   *[other] { $count } referencer gentaget inden for importen
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Ville få: { $fields }
library-import-gains-file = Fil
library-import-gains-zotero = Dens nøgle i Zotero
library-import-what-to-do = Hvad der skal gøres
library-import-merge = Samme værk: suppler den, jeg har
library-import-skip = Samme værk: lad min være, som den er
library-import-add = Et andet værk: tilføj den
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = For alle { $count }, der er de samme:
library-import-all-probable = For alle { $count }, der sandsynligvis er de samme:
library-import-all-merge = Suppler dem, jeg har
library-import-all-skip = Lad mine være, som de er
library-import-all-add = Tilføj dem alligevel
library-import-more = …og { $count } mere.
library-import-unread = { $count ->
    [one] { $count } del af filen kunne ikke læses
   *[other] { $count } dele af filen kunne ikke læses
}
library-import-importing = Importerer…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } at tilføje{ $merge ->
        [0] {""}
       *[other] , { $merge } at supplere
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } udeladt
    }
library-import-failed = Importen mislykkedes.

## The library: the list of references, and what can be done with them.

library-references = Referencer
library-unread = Biblioteket kunne ikke læses
library-all-references = Alle referencer
library-count = { $count ->
    [one] { $count } reference
   *[other] { $count } referencer
}
library-selected = { $count ->
    [one] { $count } reference valgt
   *[other] { $count } referencer valgt
}
library-selected-of = { $count ->
    [one] { $selected } af { $count } reference valgt
   *[other] { $selected } af { $count } referencer valgt
}
library-new-reference = Ny reference
library-search = Søg i biblioteket
library-search-in = Søg i { $name }
library-search-clear = Ryd søgningen
library-sort = Sortér
library-sort-author = Forfatter
library-sort-year = År
library-sort-title = Titel
library-sort-added = Dato tilføjet
library-sort-modified = Dato ændret
library-sort-descending = Faldende

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filter
library-filters-on = { $count ->
    [one] Filter: { $count } slået til
   *[other] Filter: { $count } slået til
}
library-filter-kind = Type
library-filter-publisher = Forlag
library-filter-publisher-hint = En del af navnet
library-filter-any-publisher = Ethvert forlag
library-filter-year = År
library-filter-from = Fra
library-filter-to = Til
library-filter-clear = Ryd filtrene
library-filter-nothing-here = Intet at filtrere her.
# When the filters let nothing through.
library-nothing-passes = Ingen reference i visningen slipper gennem filtrene.
library-import-export = Import og eksport
library-import-file = Importer en fil…
    .hint = BibLaTeX eller BibTeX
library-paste = Indsæt referencer…
library-add-pdfs = Tilføj PDF-filer…
    .hint = Hver slås op og gemmes
library-import-zotero = Importer fra Zotero…
library-find-duplicates = Find dubletter…
library-map-library = Et kort over biblioteket…
library-map-collection = Et kort over »{ $name }«…
library-export-library = Eksporter biblioteket…
library-export-collection = Eksporter »{ $name }«…
library-export-one = Eksporter…
library-export-many = { $count ->
    [one] Eksporter { $count } reference…
   *[other] Eksporter { $count } referencer…
}
library-export-title = Eksporter referencer
# What a file of exported references is called, before it is given a name.
library-export-file-references = referencer
library-export-file-library = bibliotek
library-exported = { $count ->
    [one] { $count } reference eksporteret
   *[other] { $count } referencer eksporteret
}
library-export-failed = Eksporten mislykkedes
library-empty = Dit bibliotek er tomt
    .text = Referencer, du tilføjer her, kan bruges i alle dine projekter. Begynd med én, eller hent dem ind, du allerede har.
library-collection-empty = Intet i denne samling endnu
    .text = Træk referencer hertil fra biblioteket, eller tilføj en ny.
library-nothing-found = Intet fundet
    .text = Ingen reference indeholder alle disse ord.
library-open-file = Åbn filen
library-file-open-failed = Filen kunne ikke åbnes
library-add-to-collection = Føj til samling
library-remove-from = Fjern fra »{ $name }«
library-copy-key = Kopiér nøglen
library-copied-key = Kopierede »{ $key }«
library-copy-biblatex = Kopiér som BibLaTeX
library-copied = Kopieret
library-delete-one-title = Slet »{ $name }«?
library-delete-many-title = { $count ->
    [one] Slet { $count } reference?
   *[other] Slet { $count } referencer?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Dette fjerner referencen fra dit bibliotek, fra alle samlinger{ $files ->
        [0] {""}
        [one] , sammen med { $files } vedhæftet fil
       *[other] , sammen med { $files } vedhæftede filer
    }.{ $projects ->
        [0] {""}
        [one] {" "}Den er citeret i et projekt, som beholder en kopi af den.
       *[other] {" "}Den er citeret i { $projects } projekter, som beholder en kopi af den.
    }
library-delete-many = Dette fjerner dem fra dit bibliotek, fra alle samlinger{ $files ->
        [0] {""}
        [one] , sammen med { $files } vedhæftet fil
       *[other] , sammen med { $files } vedhæftede filer
    }.{ $projects ->
        [0] {""}
        [one] {" "}Et projekt, der citerer nogle af dem, beholder en kopi af dem.
       *[other] {" "}{ $projects } projekter, der citerer nogle af dem, beholder en kopi af dem.
    }
library-delete-failed = Referencerne kunne ikke slettes
library-not-done = Det kunne ikke gøres

## Collections.

library-collections = Samlinger
# The projects that cite a work, in its pane.
library-cited-in = Citeret i
library-not-cited = Ikke citeret i noget projekt.
library-cited-reading = Læser projekterne…
library-collections-hint = Samlinger samler referencer til et emne eller et stykke arbejde. En reference kan være i så mange af dem, det skal være.
library-collection-new = Ny samling
library-collection-new-inside = Ny samling heri
library-collection-new-under = Ny samling i »{ $name }«
library-collection-move-to = Flyt til
library-collection-name = Samlingens navn
library-collection-name-failed = Samlingen kunne ikke navngives
library-collection-expand = Fold ud
library-collection-collapse = Fold sammen
library-collection-to-top = Flyt til øverste niveau
library-collection-move-failed = Samlingen kunne ikke flyttes
library-collection-added = { $count ->
    [one] { $count } reference føjet til »{ $name }«
   *[other] { $count } referencer føjet til »{ $name }«
}
library-collection-already = Allerede i »{ $name }«
library-collection-delete = Slet samlingen
library-collection-delete-title = Slet samlingen »{ $name }«?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Referencerne bliver i dit bibliotek.
   *[other] Samlingerne i den slettes også. Referencerne bliver i dit bibliotek.
}
library-collection-delete-failed = Samlingen kunne ikke slettes
library-collection-count = { $count ->
    [one] { $count } samling
   *[other] { $count } samlinger
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Et kort over biblioteket
library-map-title-collection = Et kort over en samling
# The name a project made of the whole library is given.
library-map-library-name = Biblioteket
library-map-name = Navn
library-map-name-hint = Navnet på projektet, på dets kort og på elementet i kortets midte.
library-map-what-library = Samlingerne bliver elementer, indlejret som de er, og hver reference et element under sin samling, med en kildehenvisning til den som tekst. Referencer uden samling står i midten.
library-map-what-collection = Samlingerne i den bliver elementer, indlejret som de er, og hver reference et element under sin samling, med en kildehenvisning til den som tekst.
library-map-nothing = Der er ingen referencer at sætte på kortet.
library-map-make = Lav projektet
library-map-making = Laver projektet…
library-map-failed = Projektet kunne ikke laves.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
library-open-failed = Referencen kunne ikke åbnes
library-known = { $count ->
    [one] Den er allerede i dit bibliotek
   *[other] De er allerede i dit bibliotek
}
library-nothing-to-import = Intet at importere
library-none-found = Der blev ikke fundet nogen referencer.
library-import-kinds = Referencer læses fra .bib-filer og laves af PDF-filer.
library-filter-bib = BibLaTeX og BibTeX
library-filter-all = Alle filer
library-files-read-failed = { $count ->
    [one] Filen kunne ikke læses
   *[other] Filerne kunne ikke læses
}
library-text-read-failed = Teksten kunne ikke læses
library-add-pdfs-title = Tilføj PDF-filer
library-pdfs-working = { $count ->
    [one] Finder ud af, hvad filen er…
   *[other] Finder ud af, hvad { $count } filer er…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } af { $count }: { $name }
library-stop = Stop
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } reference tilføjet
   *[other] { $count } referencer tilføjet
}
library-imported-completed = { $count } suppleret
library-imported-skipped = { $count } allerede i biblioteket
library-imported-files = { $count ->
    [one] { $count } fil gemt
   *[other] { $count } filer gemt
}
library-imported-nothing = Intet blev ændret
library-paste-title = Indsæt referencer
library-paste-subtitle = BibLaTeX eller BibTeX, så mange poster du vil
library-paste-continue = Fortsæt
library-source-label = BibLaTeX-kilde

## Importing from Zotero.

library-zotero-title = Importer fra Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Der blev ikke fundet nogen Zotero på denne computer de steder, hvor den plejer at have sine data. Har den dem et andet sted, så vis hvor: den mappe, der indeholder { $file }.
library-zotero-lead = Det, der importeres, kopieres ind i dit bibliotek, med dets filer. Zotero bliver kun læst, og intet i den ændres; den kan godt køre imens.
library-zotero-choose = Zoteros datamappe
library-zotero-none-there = Der er ingen Zotero der.
library-zotero-unread = Zotero kunne ikke læses.
library-zotero-library = Bibliotek
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Mit bibliotek
library-zotero-what = Hvad der skal importeres
library-zotero-everything = Alt
library-zotero-with-files = Med de vedhæftede filer
library-zotero-with-notes = Med notaterne, som annotationer
library-zotero-elsewhere = Et andet sted…
library-zotero-show-where = Vis hvor…
library-zotero-reading = Læser…
library-zotero-read = { $count ->
    [0] Indlæs
    [one] Indlæs { $count } reference
   *[other] Indlæs { $count } referencer
}

## Writing a reference.

library-dialog-edit = Rediger reference
library-dialog-add = Tilføj reference
library-dialog-back = Tilbage til formularen
library-dialog-open-failed = Referencen kunne ikke åbnes.
library-dialog-save-failed = Referencen kunne ikke gemmes.
# The entry as BibLaTeX, as against the form.
library-source = Kilde
library-source-unread = Kilden kunne ikke læses.

## A reference, beside the list.

library-pane-label = Reference
library-pane-more = Mere
library-pane-saved = Gemt
library-pane-editing = Redigerer…
library-pane-not-saved = Ikke gemt
library-pane-unread = Referencen kunne ikke læses.
library-pane-save-failed = Ændringerne kunne ikke gemmes.
library-pane-note-placeholder = Hvad du får ud af det. Til dig selv: det er ikke en del af det, der henvises til.
library-pane-files = Filer
library-pane-attach = Vedhæft
library-pane-attach-title = Vedhæft filer
library-pane-attach-failed = Filen kunne ikke vedhæftes
# Of a file that is attached, and not where it should be.
library-pane-missing = mangler
library-pane-reveal = Vis i filhåndteringen
library-pane-reveal-failed = Mappen kunne ikke åbnes
library-pane-no-files = Ingen filer. Vedhæft en PDF, eller slip en her.
library-pane-detach = Fjern filen
library-pane-detach-title = Fjern »{ $name }«?
library-pane-detach-message = Filen slettes fra bibliotekets lager, medmindre en anden reference bruger den.
library-pane-detach-failed = Filen kunne ikke fjernes
library-pane-leave-collection = Fjern fra { $name }
library-pane-duplicate = Dupliker
    .hint = En ny reference, der begynder med disse oplysninger
library-pane-edit-source = Rediger kilden…
library-pane-source-subtitle = Posten som BibLaTeX. Det meste er lettere i formularen.
library-pane-source-failed = Kilden kunne ikke vises
library-pane-added = Tilføjet { $date }
library-pane-added-changed = Tilføjet { $added } · ændret { $changed }

## Looking up a reference.

library-lookup-placeholder = Slå den op: en DOI, et ISBN eller ord fra titlen og forfatteren
library-lookup-label = Slå en reference op
library-lookup-failed = Intet kunne slås op.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Udfyldt fra { $source }.
library-lookup-others = { $count ->
    [one] { $count } anden post
   *[other] { $count } andre poster
}
library-lookup-scope = Hvad der skal søges efter
library-lookup-any = Hvad som helst
library-lookup-books = Bøger
library-lookup-articles = Artikler
library-lookup-none = Intet blev fundet. Færre ord finder måske mere: forfatterens efternavn og et par ord af titlen.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Intet er kendt om { $kind ->
        [doi] denne DOI
        [isbn] dette ISBN
        [arxiv] dette arXiv-nummer
       *[pmid] dette PubMed-nummer
    }, hvor der blev spurgt. Referencen kan indtastes manuelt nedenfor.

## What the writer writes about a work.

library-notes = Notater
library-notes-yours = Dine notater
library-notes-on-work = Dine notater om dette værk
library-notes-read = Læs dine notater
library-notes-write = Skriv et notat
library-notes-write-on-work = Skriv et notat om dette værk
library-notes-not-in-library = En reference, der ikke er i dit bibliotek
library-notes-this-project = I dette projekt
library-notes-all-projects = I alle projekter
library-notes-project-placeholder = Hvad du får ud af det, til dette arbejde
library-notes-all-placeholder = Hvad du får ud af det, hvor end du henviser til det
library-notes-keep-for-all = Gem det for alle projekter
library-notes-write-for-all = Skriv for alle projekter
library-notes-carried = Referencen kom med projektet og er ikke i dit bibliotek. Det, der skrives her, er hos alle, der har projektet.
library-notes-kept = Gemt med referencen i dit bibliotek. Det følger med et projekt, der citerer værket.
library-notes-unread = Dine notater kunne ikke læses
library-notes-unsaved = Dit notat kunne ikke gemmes
