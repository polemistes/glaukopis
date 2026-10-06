# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Ofta använda
library-form-add-field = Lägg till fält
library-form-citation-key = Hänvisningsnyckel
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = görs av författare och år
library-form-date-problem = Skriv ett datum som 1979, 1979-05 eller 1979-05-12; ett spann som 1979/1985.
library-form-remove-field = Ta bort { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institution eller annat namn som hålls helt
library-names-prefix-suffix = Prefix och suffix
    .hint = ”van”, ”de la” · ”Jr.”, ”III”
library-names-move-up = Flytta upp
library-names-move-down = Flytta ner
library-names-more = Mer för det här namnet
library-names-name = Namn
library-names-name-of = { $role }: namn
library-names-family = Efternamn
library-names-family-of = { $role }: efternamn
library-names-given = Förnamn
library-names-given-of = { $role }: förnamn
library-names-prefix = Prefix: van, de la
library-names-prefix-of = { $role }: prefix
library-names-suffix = Suffix: Jr., III
library-names-suffix-of = { $role }: suffix

## Words for references, wherever they are shown.

library-untitled = Utan titel
library-no-author = Ingen författare
library-no-title = Ingen titel
library-in-library = I ditt bibliotek

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = samma DOI
library-reason-isbn = samma ISBN
library-reason-identical = lika i allt som skiljer ett verk från ett annat
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] samma titel, författare och år
            [like] samma titel och författare, ett år emellan
           *[none] samma titel och författare, året bara på en av dem
        }
        [like] { $year ->
            [same] samma titel och år, och en författare gemensam
            [like] samma titel, en författare gemensam, ett år emellan
           *[none] samma titel, en författare gemensam, året bara på en av dem
        }
       *[none] { $year ->
            [same] samma titel och år, författaren bara på en av dem
            [like] samma titel, ett år emellan, författaren bara på en av dem
           *[none] samma titel, författare och år bara på en av dem
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] samma författare och år, och en titel som liknar den
            [like] samma författare, en titel som liknar den, ett år emellan
           *[none] samma författare, en titel som liknar den, året bara på en av dem
        }
        [like] { $year ->
            [same] samma år, en titel som liknar den, en författare gemensam
            [like] en titel som liknar den, en författare gemensam, ett år emellan
           *[none] en titel som liknar den, en författare gemensam, året bara på en av dem
        }
       *[none] { $year ->
            [same] samma år, en titel som liknar den, författaren bara på en av dem
            [like] en titel som liknar den, ett år emellan, författaren bara på en av dem
           *[none] en titel som liknar den, författare och år bara på en av dem
        }
    }
}
library-reason-file = samma fil
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } och { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Det här finns redan i ditt bibliotek.
library-duplicate-probable = Det här kan redan finnas i ditt bibliotek.
library-duplicate-use = Använd den här

## Duplicates in the library.

library-duplicates-title = Dubbletter
library-duplicates-count = { $count ->
    [one] { $count } referens verkar finnas i biblioteket mer än en gång
   *[other] { $count } referenser verkar finnas i biblioteket mer än en gång
}
library-duplicates-none = Inga dubbletter
    .text = Ingen referens verkar finnas i biblioteket mer än en gång.
library-duplicates-no-more = Inga fler dubbletter
    .text = Källhänvisningar till de referenser som slogs ihop hänvisar nu till dem som behölls.
library-duplicates-how = När referenser görs till en får den du behåller det den saknar från de andra, och behåller sitt eget där de skiljer sig. Deras filer och samlingar förs samman, och det som hänvisar till dem hänvisar till den som behölls.
library-duplicates-same = Samma
library-duplicates-probably-same = Troligen samma
library-duplicates-keep-which = Den som ska behållas
library-duplicates-kept = Behållen
library-duplicates-different = De är olika
library-duplicates-merge = Gör dem till en
library-duplicates-merging = Gör dem till en…
library-duplicates-failed = Biblioteket kunde inte sökas igenom efter dubbletter
library-duplicates-merge-failed = De kunde inte göras till en

## Importing references: what a file holds, against what the library has.

library-import = Importera
library-import-title = Importera referenser
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referens i { $source }
   *[other] { $count } referenser i { $source }
}
library-import-review = { $count ->
    [one] { $count } referens kan redan finnas i ditt bibliotek
   *[other] { $count } referenser kan redan finnas i ditt bibliotek
}
library-import-new = { $count ->
    [one] { $count } ny referens
   *[other] { $count } nya referenser
}
library-import-complete = { $count ->
    [one] { $count } referens som redan finns i ditt bibliotek får fler uppgifter
   *[other] { $count } referenser som redan finns i ditt bibliotek får fler uppgifter
}
library-import-known = { $count ->
    [one] { $count } referens som redan finns i ditt bibliotek
   *[other] { $count } referenser som redan finns i ditt bibliotek
}
library-import-repeated = { $count ->
    [one] { $count } referens upprepad inom importen
   *[other] { $count } referenser upprepade inom importen
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Skulle få: { $fields }
library-import-gains-file = Fil
library-import-gains-zotero = Dess nyckel i Zotero
library-import-what-to-do = Vad som ska göras
library-import-merge = Samma verk: komplettera den jag har
library-import-skip = Samma verk: låt min vara som den är
library-import-add = Ett annat verk: lägg till det
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = För alla { $count } som är samma:
library-import-all-probable = För alla { $count } som troligen är samma:
library-import-all-merge = Komplettera dem jag har
library-import-all-skip = Låt mina vara som de är
library-import-all-add = Lägg till dem ändå
library-import-more = …och { $count } till.
library-import-unread = { $count ->
    [one] { $count } del av filen kunde inte läsas
   *[other] { $count } delar av filen kunde inte läsas
}
library-import-importing = Importerar…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } att lägga till{ $merge ->
        [0] {""}
       *[other] , { $merge } att komplettera
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } utelämnade
    }
library-import-failed = Importen misslyckades.

## The library: the list of references, and what can be done with them.

library-references = Referenser
library-unread = Biblioteket kunde inte läsas
library-all-references = Alla referenser
library-count = { $count ->
    [one] { $count } referens
   *[other] { $count } referenser
}
library-selected = { $count ->
    [one] { $count } referens markerad
   *[other] { $count } referenser markerade
}
library-selected-of = { $count ->
    [one] { $selected } av { $count } referens markerad
   *[other] { $selected } av { $count } referenser markerade
}
library-new-reference = Ny referens
library-search = Sök i biblioteket
library-search-in = Sök i { $name }
library-search-clear = Rensa sökningen
library-sort = Sortera
library-sort-author = Författare
library-sort-year = År
library-sort-title = Titel
library-sort-added = Tillagd
library-sort-modified = Ändrad
library-sort-descending = Fallande

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filter
library-filters-on = { $count ->
    [one] Filter: { $count } på
   *[other] Filter: { $count } på
}
library-filter-kind = Slag
library-filter-publisher = Förlag
library-filter-publisher-hint = Del av namnet
library-filter-any-publisher = Vilket förlag som helst
library-filter-year = År
library-filter-from = Från
library-filter-to = Till
library-filter-clear = Rensa filtren
library-filter-nothing-here = Inget att filtrera här.
# When the filters let nothing through.
library-nothing-passes = Ingen referens i vyn passerar filtren.
library-import-export = Import och export
library-import-file = Importera en fil…
    .hint = BibLaTeX eller BibTeX
library-paste = Klistra in referenser…
library-add-pdfs = Lägg till PDF-filer…
    .hint = Var och en slås upp, och sparas
library-import-zotero = Importera från Zotero…
library-find-duplicates = Hitta dubbletter…
library-map-library = En karta över biblioteket…
library-map-collection = En karta över ”{ $name }”…
library-export-library = Exportera biblioteket…
library-export-collection = Exportera ”{ $name }”…
library-export-one = Exportera…
library-export-many = { $count ->
    [one] Exportera { $count } referens…
   *[other] Exportera { $count } referenser…
}
library-export-title = Exportera referenser
# What a file of exported references is called, before it is given a name.
library-export-file-references = referenser
library-export-file-library = bibliotek
library-exported = { $count ->
    [one] { $count } referens exporterad
   *[other] { $count } referenser exporterade
}
library-export-failed = Exporten misslyckades
library-empty = Ditt bibliotek är tomt
    .text = Referenser du lägger till här finns i alla dina projekt. Börja med en, eller hämta in dem du redan har.
library-collection-empty = Inget i den här samlingen än
    .text = Dra referenser hit från biblioteket, eller lägg till en ny.
library-nothing-found = Inget hittat
    .text = Ingen referens innehåller alla de här orden.
library-open-file = Öppna filen
library-file-open-failed = Filen kunde inte öppnas
library-add-to-collection = Lägg till i samling
library-remove-from = Ta bort från ”{ $name }”
library-copy-key = Kopiera hänvisningsnyckeln
library-copied-key = Kopierade ”{ $key }”
library-copy-biblatex = Kopiera som BibLaTeX
library-copied = Kopierat
library-delete-one-title = Radera ”{ $name }”?
library-delete-many-title = { $count ->
    [one] Radera { $count } referens?
   *[other] Radera { $count } referenser?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Det här tar bort referensen ur ditt bibliotek, ur varje samling{ $files ->
        [0] {""}
        [one] , tillsammans med { $files } bifogad fil
       *[other] , tillsammans med { $files } bifogade filer
    }.{ $projects ->
        [0] {""}
        [one] {" "}Den hänvisas till i ett projekt, som behåller en kopia av den.
       *[other] {" "}Den hänvisas till i { $projects } projekt, som behåller en kopia av den.
    }
library-delete-many = Det här tar bort dem ur ditt bibliotek, ur varje samling{ $files ->
        [0] {""}
        [one] , tillsammans med { $files } bifogad fil
       *[other] , tillsammans med { $files } bifogade filer
    }.{ $projects ->
        [0] {""}
        [one] {" "}Ett projekt som hänvisar till några av dem behåller en kopia av dem.
       *[other] {" "}{ $projects } projekt som hänvisar till några av dem behåller en kopia av dem.
    }
library-delete-failed = Referenserna kunde inte raderas
library-not-done = Det kunde inte göras

## Collections.

library-collections = Samlingar
# The projects that cite a work, in its pane.
library-cited-in = Hänvisad till i
library-not-cited = Inte hänvisad till i något projekt.
library-cited-reading = Läser projekten…
library-collections-hint = Samlingar samlar referenser för ett ämne eller ett arbete. En referens kan ligga i hur många som helst.
library-collection-new = Ny samling
library-collection-new-inside = Ny samling inuti
library-collection-new-under = Ny samling i ”{ $name }”
library-collection-move-to = Flytta till
library-collection-name = Samlingens namn
library-collection-name-failed = Samlingen kunde inte namnges
library-collection-expand = Fäll ut
library-collection-collapse = Fäll ihop
library-collection-to-top = Flytta till översta nivån
library-collection-move-failed = Samlingen kunde inte flyttas
library-collection-added = { $count ->
    [one] { $count } referens tillagd i ”{ $name }”
   *[other] { $count } referenser tillagda i ”{ $name }”
}
library-collection-already = Finns redan i ”{ $name }”
library-collection-delete = Radera samlingen
library-collection-delete-title = Radera samlingen ”{ $name }”?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Referenserna blir kvar i ditt bibliotek.
   *[other] Samlingarna inuti den raderas också. Referenserna blir kvar i ditt bibliotek.
}
library-collection-delete-failed = Samlingen kunde inte raderas
library-collection-count = { $count ->
    [one] { $count } samling
   *[other] { $count } samlingar
}

## A map of the library, or of a collection: a new project.

library-map-title-library = En karta över biblioteket
library-map-title-collection = En karta över en samling
# The name a project made of the whole library is given.
library-map-library-name = Biblioteket
library-map-name = Namn
library-map-name-hint = Namnet på projektet, på dess karta, och på elementet i kartans mitt.
library-map-what-library = Samlingarna blir element, nästlade som de är, och varje referens ett element under sin samling, med en källhänvisning till den som text. Referenser utan samling står i mitten.
library-map-what-collection = Samlingarna inuti den blir element, nästlade som de är, och varje referens ett element under sin samling, med en källhänvisning till den som text.
library-map-nothing = Det finns inga referenser att sätta på kartan.
library-map-make = Gör projektet
library-map-making = Gör projektet…
library-map-failed = Projektet kunde inte göras.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
library-open-failed = Referensen kunde inte öppnas
library-known = { $count ->
    [one] Den finns redan i ditt bibliotek
   *[other] De finns redan i ditt bibliotek
}
library-nothing-to-import = Inget att importera
library-none-found = Inga referenser hittades.
library-import-kinds = Referenser läses från .bib-filer, och görs av PDF-filer.
library-filter-bib = BibLaTeX och BibTeX
library-filter-all = Alla filer
library-files-read-failed = { $count ->
    [one] Filen kunde inte läsas
   *[other] Filerna kunde inte läsas
}
library-text-read-failed = Texten kunde inte läsas
library-add-pdfs-title = Lägg till PDF-filer
library-pdfs-working = { $count ->
    [one] Tar reda på vad filen är…
   *[other] Tar reda på vad { $count } filer är…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } av { $count }: { $name }
library-stop = Stoppa
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referens tillagd
   *[other] { $count } referenser tillagda
}
library-imported-completed = { $count } kompletterade
library-imported-skipped = { $count } redan i biblioteket
library-imported-files = { $count ->
    [one] { $count } fil sparad
   *[other] { $count } filer sparade
}
library-imported-nothing = Inget ändrades
library-paste-title = Klistra in referenser
library-paste-subtitle = BibLaTeX eller BibTeX, så många poster du vill
library-paste-continue = Fortsätt
library-source-label = BibLaTeX-källtext

## Importing from Zotero.

library-zotero-title = Importera från Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Inget Zotero hittades på den här datorn på de ställen där det brukar ha sina data. Om det har dem någon annanstans, visa var: mappen som innehåller { $file }.
library-zotero-lead = Det som importeras kopieras in i ditt bibliotek, med sina filer. Zotero läses bara, och inget i det ändras; det kan vara igång under tiden.
library-zotero-choose = Zoteros datamapp
library-zotero-none-there = Det finns inget Zotero där.
library-zotero-unread = Zotero kunde inte läsas.
library-zotero-library = Bibliotek
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Mitt bibliotek
library-zotero-what = Vad som ska importeras
library-zotero-everything = Allt
library-zotero-with-files = Med de bifogade filerna
library-zotero-with-notes = Med anteckningarna, som annotationer
library-zotero-elsewhere = Ett annat ställe…
library-zotero-show-where = Visa var…
library-zotero-reading = Läser…
library-zotero-read = { $count ->
    [0] Läs in
    [one] Läs in { $count } referens
   *[other] Läs in { $count } referenser
}

## Writing a reference.

library-dialog-edit = Redigera referensen
library-dialog-add = Lägg till referens
library-dialog-back = Tillbaka till formuläret
library-dialog-open-failed = Referensen kunde inte öppnas.
library-dialog-save-failed = Referensen kunde inte sparas.
# The entry as BibLaTeX, as against the form.
library-source = Källtext
library-source-unread = Källtexten kunde inte läsas.

## A reference, beside the list.

library-pane-label = Referens
library-pane-more = Mer
library-pane-saved = Sparad
library-pane-editing = Redigerar…
library-pane-not-saved = Inte sparad
library-pane-unread = Referensen kunde inte läsas.
library-pane-save-failed = Ändringarna kunde inte sparas.
library-pane-note-placeholder = Vad du tycker om det. För dig själv: det är inte en del av det som hänvisas till.
library-pane-files = Filer
library-pane-attach = Bifoga
library-pane-attach-title = Bifoga filer
library-pane-attach-failed = Filen kunde inte bifogas
# Of a file that is attached, and not where it should be.
library-pane-missing = saknas
library-pane-reveal = Visa i filhanteraren
library-pane-reveal-failed = Mappen kunde inte öppnas
library-pane-no-files = Inga filer. Bifoga en PDF, eller släpp en här.
library-pane-detach = Ta bort filen
library-pane-detach-title = Ta bort ”{ $name }”?
library-pane-detach-message = Filen raderas från bibliotekets förråd, om inte en annan referens använder den.
library-pane-detach-failed = Filen kunde inte tas bort
library-pane-leave-collection = Ta bort från { $name }
library-pane-duplicate = Kopiera
    .hint = En ny referens som börjar med de här uppgifterna
library-pane-edit-source = Redigera källtexten…
library-pane-source-subtitle = Posten som BibLaTeX. Det mesta är lättare i formuläret.
library-pane-source-failed = Källtexten kunde inte visas
library-pane-added = Tillagd { $date }
library-pane-added-changed = Tillagd { $added } · ändrad { $changed }

## Looking up a reference.

library-lookup-placeholder = Slå upp: en DOI, ett ISBN, eller ord ur titeln och författarens namn
library-lookup-label = Slå upp en referens
library-lookup-failed = Inget kunde slås upp.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Ifylld från { $source }.
library-lookup-others = { $count ->
    [one] { $count } annan post
   *[other] { $count } andra poster
}
library-lookup-scope = Vad som ska sökas
library-lookup-any = Vad som helst
library-lookup-books = Böcker
library-lookup-articles = Artiklar
library-lookup-none = Inget hittades. Färre ord kan hitta mer: författarens efternamn och ett par ord ur titeln.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Inget är känt om { $kind ->
        [doi] denna DOI
        [isbn] detta ISBN
        [arxiv] detta arXiv-nummer
       *[pmid] detta PubMed-nummer
    } där det efterfrågades. Referensen kan skrivas in för hand nedan.

## What the writer writes about a work.

library-notes = Anteckningar
library-notes-yours = Dina anteckningar
library-notes-on-work = Dina anteckningar om det här verket
library-notes-read = Läs dina anteckningar
library-notes-write = Skriv en anteckning
library-notes-write-on-work = Skriv en anteckning om det här verket
library-notes-not-in-library = En referens som inte finns i ditt bibliotek
library-notes-this-project = I det här projektet
library-notes-all-projects = I alla projekt
library-notes-project-placeholder = Vad du tycker om det, för det här verket
library-notes-all-placeholder = Vad du tycker om det, var du än hänvisar till det
library-notes-keep-for-all = Behåll den för alla projekt
library-notes-write-for-all = Skriv för alla projekt
library-notes-carried = Referensen kom med projektet och finns inte i ditt bibliotek. Det som skrivs här finns hos alla som har projektet.
library-notes-kept = Sparad med referensen i ditt bibliotek. Den följer med ett projekt som hänvisar till verket.
library-notes-unread = Dina anteckningar kunde inte läsas
library-notes-unsaved = Din anteckning kunde inte sparas
