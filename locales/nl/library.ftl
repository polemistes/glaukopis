# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Vaak gebruikt
library-form-add-field = Veld toevoegen
library-form-citation-key = Citeersleutel
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = gemaakt uit auteur en jaar
library-form-date-problem = Schrijf een datum als 1979, 1979-05 of 1979-05-12; een periode als 1979/1985.
library-form-remove-field = { $field } verwijderen

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Instelling of andere naam die heel blijft
library-names-prefix-suffix = Tussenvoegsel en achtervoegsel
    .hint = ‘van’, ‘de la’ · ‘jr.’, ‘III’
library-names-move-up = Omhoog
library-names-move-down = Omlaag
library-names-more = Meer voor deze naam
library-names-name = Naam
library-names-name-of = { $role }: naam
library-names-family = Achternaam
library-names-family-of = { $role }: achternaam
library-names-given = Voornamen
library-names-given-of = { $role }: voornamen
library-names-prefix = Tussenvoegsel: van, de la
library-names-prefix-of = { $role }: tussenvoegsel
library-names-suffix = Achtervoegsel: jr., III
library-names-suffix-of = { $role }: achtervoegsel

## Words for references, wherever they are shown.

library-untitled = Zonder titel
library-no-author = Geen auteur
library-no-title = Geen titel
library-in-library = In je bibliotheek

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = dezelfde DOI
library-reason-isbn = hetzelfde ISBN
library-reason-identical = gelijk in alles wat het ene werk van het andere onderscheidt
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] dezelfde titel, auteur en jaar
            [like] dezelfde titel en auteur, een jaar verschil
           *[none] dezelfde titel en auteur, het jaar maar op een van beide
        }
        [like] { $year ->
            [same] dezelfde titel en hetzelfde jaar, en een auteur gemeen
            [like] dezelfde titel, een auteur gemeen, een jaar verschil
           *[none] dezelfde titel, een auteur gemeen, het jaar maar op een van beide
        }
       *[none] { $year ->
            [same] dezelfde titel en hetzelfde jaar, de auteur maar op een van beide
            [like] dezelfde titel, een jaar verschil, de auteur maar op een van beide
           *[none] dezelfde titel, de auteur en het jaar maar op een van beide
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] dezelfde auteur en hetzelfde jaar, en een titel die erop lijkt
            [like] dezelfde auteur, een titel die erop lijkt, een jaar verschil
           *[none] dezelfde auteur, een titel die erop lijkt, het jaar maar op een van beide
        }
        [like] { $year ->
            [same] hetzelfde jaar, een titel die erop lijkt, een auteur gemeen
            [like] een titel die erop lijkt, een auteur gemeen, een jaar verschil
           *[none] een titel die erop lijkt, een auteur gemeen, het jaar maar op een van beide
        }
       *[none] { $year ->
            [same] hetzelfde jaar, een titel die erop lijkt, de auteur maar op een van beide
            [like] een titel die erop lijkt, een jaar verschil, de auteur maar op een van beide
           *[none] een titel die erop lijkt, de auteur en het jaar maar op een van beide
        }
    }
}
library-reason-file = hetzelfde bestand
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } en { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Dit staat al in je bibliotheek.
library-duplicate-probable = Dit staat misschien al in je bibliotheek.
library-duplicate-use = Deze gebruiken

## Duplicates in the library.

library-duplicates-title = Duplicaten
library-duplicates-count = { $count ->
    [one] { $count } referentie lijkt meer dan eens in de bibliotheek te staan
   *[other] { $count } referenties lijken meer dan eens in de bibliotheek te staan
}
library-duplicates-none = Geen duplicaten
    .text = Geen enkele referentie lijkt meer dan eens in de bibliotheek te staan.
library-duplicates-no-more = Geen duplicaten meer
    .text = Verwijzingen naar de samengevoegde referenties verwijzen nu naar de referenties die zijn behouden.
library-duplicates-how = Wanneer referenties één worden gemaakt, krijgt de referentie die je behoudt van de andere wat haar ontbreekt, en houdt ze het hare waar ze verschillen. Hun bestanden en verzamelingen worden samengebracht, en wat ernaar verwijst, verwijst naar de behouden referentie.
library-duplicates-same = Dezelfde
library-duplicates-probably-same = Waarschijnlijk dezelfde
library-duplicates-keep-which = Welke te behouden
library-duplicates-kept = Behouden
library-duplicates-different = Ze zijn verschillend
library-duplicates-merge = Eén maken
library-duplicates-merging = Ze worden één gemaakt…
library-duplicates-failed = De bibliotheek kon niet op duplicaten worden doorzocht
library-duplicates-merge-failed = Ze konden niet één worden gemaakt

## Importing references: what a file holds, against what the library has.

library-import = Importeren
library-import-title = Referenties importeren
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referentie in { $source }
   *[other] { $count } referenties in { $source }
}
library-import-review = { $count ->
    [one] { $count } referentie staat misschien al in je bibliotheek
   *[other] { $count } referenties staan misschien al in je bibliotheek
}
library-import-new = { $count ->
    [one] { $count } nieuwe referentie
   *[other] { $count } nieuwe referenties
}
library-import-complete = { $count ->
    [one] { $count } referentie die al in je bibliotheek staat, krijgt er gegevens bij
   *[other] { $count } referenties die al in je bibliotheek staan, krijgen er gegevens bij
}
library-import-known = { $count ->
    [one] { $count } referentie al in je bibliotheek
   *[other] { $count } referenties al in je bibliotheek
}
library-import-repeated = { $count ->
    [one] { $count } referentie komt in de import meer dan eens voor
   *[other] { $count } referenties komen in de import meer dan eens voor
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Krijgt erbij: { $fields }
library-import-gains-file = Bestand
library-import-gains-zotero = Zijn sleutel in Zotero
library-import-what-to-do = Wat te doen
library-import-merge = Hetzelfde werk: de mijne aanvullen
library-import-skip = Hetzelfde werk: de mijne laten zoals ze is
library-import-add = Een ander werk: toevoegen
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Voor alle { $count } die dezelfde zijn:
library-import-all-probable = Voor alle { $count } die waarschijnlijk dezelfde zijn:
library-import-all-merge = De mijne aanvullen
library-import-all-skip = De mijne laten zoals ze zijn
library-import-all-add = Ze toch toevoegen
library-import-more = …en nog { $count }.
library-import-unread = { $count ->
    [one] { $count } deel van het bestand kon niet worden gelezen
   *[other] { $count } delen van het bestand konden niet worden gelezen
}
library-import-importing = Importeren…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } toe te voegen{ $merge ->
        [0] {""}
       *[other] , { $merge } aan te vullen
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } weggelaten
    }
library-import-failed = De import is mislukt.

## The library: the list of references, and what can be done with them.

library-references = Referenties
library-unread = De bibliotheek kon niet worden gelezen
library-all-references = Alle referenties
library-count = { $count ->
    [one] { $count } referentie
   *[other] { $count } referenties
}
library-selected = { $count ->
    [one] { $count } referentie geselecteerd
   *[other] { $count } referenties geselecteerd
}
library-selected-of = { $count ->
    [one] { $selected } van { $count } referentie geselecteerd
   *[other] { $selected } van { $count } referenties geselecteerd
}
library-new-reference = Nieuwe referentie
library-search = In de bibliotheek zoeken
library-search-in = Zoeken in { $name }
library-search-clear = De zoekopdracht wissen
library-sort = Sorteren
library-sort-author = Auteur
library-sort-year = Jaar
library-sort-title = Titel
library-sort-added = Datum toegevoegd
library-sort-modified = Datum gewijzigd
library-sort-descending = Aflopend

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filter
library-filters-on = { $count ->
    [one] Filter: { $count } aan
   *[other] Filter: { $count } aan
}
library-filter-kind = Soort
library-filter-publisher = Uitgever
library-filter-publisher-hint = Deel van de naam
library-filter-any-publisher = Elke uitgever
library-filter-year = Jaar
library-filter-from = Van
library-filter-to = Tot
library-filter-clear = De filters wissen
library-filter-nothing-here = Hier is niets te filteren.
# When the filters let nothing through.
library-nothing-passes = Geen referentie in beeld komt door de filters.
library-import-export = Importeren en exporteren
library-import-file = Een bestand importeren…
    .hint = BibLaTeX of BibTeX
library-paste = Referenties plakken…
library-add-pdfs = PDF-bestanden toevoegen…
    .hint = Elk wordt opgezocht en bewaard
library-import-zotero = Importeren uit Zotero…
library-find-duplicates = Duplicaten zoeken…
library-map-library = Een mindmap van de bibliotheek…
library-map-collection = Een mindmap van ‘{ $name }’…
library-export-library = De bibliotheek exporteren…
library-export-collection = ‘{ $name }’ exporteren…
library-export-one = Exporteren…
library-export-many = { $count ->
    [one] { $count } referentie exporteren…
   *[other] { $count } referenties exporteren…
}
library-export-title = Referenties exporteren
# What a file of exported references is called, before it is given a name.
library-export-file-references = referenties
library-export-file-library = bibliotheek
library-exported = { $count ->
    [one] { $count } referentie geëxporteerd
   *[other] { $count } referenties geëxporteerd
}
library-export-failed = Het exporteren is mislukt
library-empty = Je bibliotheek is leeg
    .text = Referenties die je hier toevoegt, zijn beschikbaar in al je projecten. Begin met één, of haal binnen wat je al hebt.
library-collection-empty = Nog niets in deze verzameling
    .text = Sleep referenties hierheen uit de bibliotheek, of voeg een nieuwe toe.
library-nothing-found = Niets gevonden
    .text = Geen referentie bevat al deze woorden.
library-open-file = Het bestand openen
library-file-open-failed = Het bestand kon niet worden geopend
library-add-to-collection = Aan verzameling toevoegen
library-remove-from = Uit ‘{ $name }’ verwijderen
library-copy-key = Citeersleutel kopiëren
library-copied-key = ‘{ $key }’ gekopieerd
library-copy-biblatex = Kopiëren als BibLaTeX
library-copied = Gekopieerd
library-delete-one-title = ‘{ $name }’ wissen?
library-delete-many-title = { $count ->
    [one] { $count } referentie wissen?
   *[other] { $count } referenties wissen?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Dit verwijdert de referentie uit je bibliotheek, uit elke verzameling{ $files ->
        [0] {""}
        [one] , samen met { $files } bijgevoegd bestand
       *[other] , samen met { $files } bijgevoegde bestanden
    }.{ $projects ->
        [0] {""}
        [one] {" "}Ze wordt geciteerd in een project, dat er een kopie van houdt.
       *[other] {" "}Ze wordt geciteerd in { $projects } projecten, die er een kopie van houden.
    }
library-delete-many = Dit verwijdert ze uit je bibliotheek, uit elke verzameling{ $files ->
        [0] {""}
        [one] , samen met { $files } bijgevoegd bestand
       *[other] , samen met { $files } bijgevoegde bestanden
    }.{ $projects ->
        [0] {""}
        [one] {" "}Een project dat er enkele van citeert, houdt daar een kopie van.
       *[other] {" "}{ $projects } projecten die er enkele van citeren, houden daar een kopie van.
    }
library-delete-failed = De referenties konden niet worden gewist
library-not-done = Dat kon niet worden gedaan

## Collections.

library-collections = Verzamelingen
# The projects that cite a work, in its pane.
library-cited-in = Geciteerd in
library-not-cited = In geen enkel project geciteerd.
library-cited-reading = De projecten worden gelezen…
library-collections-hint = Verzamelingen brengen referenties bijeen voor een onderwerp of een stuk werk. Een referentie kan in zoveel verzamelingen staan als je wilt.
library-collection-new = Nieuwe verzameling
library-collection-new-inside = Nieuwe verzameling hierin
library-collection-new-under = Nieuwe verzameling in ‘{ $name }’
library-collection-move-to = Verplaatsen naar
library-collection-name = Naam van de verzameling
library-collection-name-failed = De verzameling kon geen naam krijgen
library-collection-expand = Uitvouwen
library-collection-collapse = Invouwen
library-collection-to-top = Naar het hoogste niveau verplaatsen
library-collection-move-failed = De verzameling kon niet worden verplaatst
library-collection-added = { $count ->
    [one] { $count } referentie toegevoegd aan ‘{ $name }’
   *[other] { $count } referenties toegevoegd aan ‘{ $name }’
}
library-collection-already = Al in ‘{ $name }’
library-collection-delete = Verzameling wissen
library-collection-delete-title = De verzameling ‘{ $name }’ wissen?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] De referenties blijven in je bibliotheek.
   *[other] De verzamelingen erin worden ook gewist. De referenties blijven in je bibliotheek.
}
library-collection-delete-failed = De verzameling kon niet worden gewist
library-collection-count = { $count ->
    [one] { $count } verzameling
   *[other] { $count } verzamelingen
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Een mindmap van de bibliotheek
library-map-title-collection = Een mindmap van een verzameling
# The name a project made of the whole library is given.
library-map-library-name = De bibliotheek
library-map-name = Naam
library-map-name-hint = De naam van het project, van zijn mindmap, en van het element in de kern van de mindmap.
library-map-what-library = De verzamelingen worden elementen, genest zoals ze zijn, en elke referentie een element onder haar verzameling, met een verwijzing ernaar als tekst. Referenties in geen enkele verzameling staan bij de kern.
library-map-what-collection = De verzamelingen erin worden elementen, genest zoals ze zijn, en elke referentie een element onder haar verzameling, met een verwijzing ernaar als tekst.
library-map-nothing = Er zijn geen referenties om op de mindmap te zetten.
library-map-make = Het project maken
library-map-making = Het project wordt gemaakt…
library-map-failed = Het project kon niet worden gemaakt.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } bestand
   *[other] { $count } bestanden
}
library-open-failed = De referentie kon niet worden geopend
library-known = { $count ->
    [one] Ze staat al in je bibliotheek
   *[other] Ze staan al in je bibliotheek
}
library-nothing-to-import = Niets te importeren
library-none-found = Er zijn geen referenties gevonden.
library-import-kinds = Referenties worden gelezen uit .bib-bestanden, en gemaakt van PDF-bestanden.
library-filter-bib = BibLaTeX en BibTeX
library-filter-all = Alle bestanden
library-files-read-failed = { $count ->
    [one] Het bestand kon niet worden gelezen
   *[other] De bestanden konden niet worden gelezen
}
library-text-read-failed = De tekst kon niet worden gelezen
library-add-pdfs-title = PDF-bestanden toevoegen
library-pdfs-working = { $count ->
    [one] Uitzoeken wat het bestand is…
   *[other] Uitzoeken wat { $count } bestanden zijn…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } van { $count }: { $name }
library-stop = Stoppen
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referentie toegevoegd
   *[other] { $count } referenties toegevoegd
}
library-imported-completed = { $count } aangevuld
library-imported-skipped = { $count } al in de bibliotheek
library-imported-files = { $count ->
    [one] { $count } bestand opgeborgen
   *[other] { $count } bestanden opgeborgen
}
library-imported-nothing = Er is niets veranderd
library-paste-title = Referenties plakken
library-paste-subtitle = BibLaTeX of BibTeX, zoveel items als je wilt
library-paste-continue = Verder
library-source-label = BibLaTeX-bron

## Importing from Zotero.

library-zotero-title = Importeren uit Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Er is op deze computer geen Zotero gevonden op de plaatsen waar het zijn gegevens gewoonlijk bewaart. Als het ze elders bewaart, wijs dan aan waar: de map die { $file } bevat.
library-zotero-lead = Wat wordt geïmporteerd, wordt naar je bibliotheek gekopieerd, met de bestanden. Zotero wordt alleen gelezen en er wordt niets in veranderd; het mag ondertussen openstaan.
library-zotero-choose = De gegevensmap van Zotero
library-zotero-none-there = Daar is geen Zotero.
library-zotero-unread = Zotero kon niet worden gelezen.
library-zotero-library = Bibliotheek
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Mijn bibliotheek
library-zotero-what = Wat te importeren
library-zotero-everything = Alles
library-zotero-with-files = Met de bijgevoegde bestanden
library-zotero-with-notes = Met de notities, als annotaties
library-zotero-elsewhere = Een andere plaats…
library-zotero-show-where = Aanwijzen waar…
library-zotero-reading = Lezen…
library-zotero-read = { $count ->
    [0] Gelezen
    [one] { $count } referentie gelezen
   *[other] { $count } referenties gelezen
}

## Writing a reference.

library-dialog-edit = Referentie bewerken
library-dialog-add = Referentie toevoegen
library-dialog-back = Terug naar het formulier
library-dialog-open-failed = De referentie kon niet worden geopend.
library-dialog-save-failed = De referentie kon niet worden opgeslagen.
# The entry as BibLaTeX, as against the form.
library-source = Bron
library-source-unread = De bron kon niet worden gelezen.

## A reference, beside the list.

library-pane-label = Referentie
library-pane-more = Meer
library-pane-saved = Opgeslagen
library-pane-editing = Bewerken…
library-pane-not-saved = Niet opgeslagen
library-pane-unread = De referentie kon niet worden gelezen.
library-pane-save-failed = De wijzigingen konden niet worden opgeslagen.
library-pane-note-placeholder = Wat je ervan vindt. Voor jezelf: het hoort niet bij wat wordt geciteerd.
library-pane-files = Bestanden
library-pane-attach = Bijvoegen
library-pane-attach-title = Bestanden bijvoegen
library-pane-attach-failed = Het bestand kon niet worden bijgevoegd
# Of a file that is attached, and not where it should be.
library-pane-missing = ontbreekt
library-pane-reveal = Tonen in de bestandsbeheerder
library-pane-reveal-failed = De map kon niet worden geopend
library-pane-no-files = Geen bestanden. Voeg een PDF bij, of laat er hier een vallen.
library-pane-detach = Bestand verwijderen
library-pane-detach-title = ‘{ $name }’ verwijderen?
library-pane-detach-message = Het bestand wordt uit de opslag van de bibliotheek gewist, tenzij een andere referentie het gebruikt.
library-pane-detach-failed = Het bestand kon niet worden verwijderd
library-pane-leave-collection = Uit { $name } verwijderen
library-pane-duplicate = Dupliceren
    .hint = Een nieuwe referentie die met deze gegevens begint
library-pane-edit-source = De bron bewerken…
library-pane-source-subtitle = Het item als BibLaTeX. Het meeste gaat makkelijker in het formulier.
library-pane-source-failed = De bron kon niet worden getoond
library-pane-added = Toegevoegd { $date }
library-pane-added-changed = Toegevoegd { $added } · gewijzigd { $changed }

## Looking up a reference.

library-lookup-placeholder = Opzoeken: een DOI, een ISBN, of woorden uit de titel en de auteur
library-lookup-label = Een referentie opzoeken
library-lookup-failed = Er kon niets worden opgezocht.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Ingevuld vanuit { $source }.
library-lookup-others = { $count ->
    [one] { $count } ander record
   *[other] { $count } andere records
}
library-lookup-scope = Waarnaar te zoeken
library-lookup-any = Alles
library-lookup-books = Boeken
library-lookup-articles = Artikelen
library-lookup-none = Er is niets gevonden. Minder woorden vinden misschien meer: de achternaam van de auteur en een paar woorden van de titel.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Over { $kind ->
        [doi] deze DOI
        [isbn] dit ISBN
        [arxiv] dit arXiv-nummer
       *[pmid] dit PubMed-nummer
    } is niets bekend waar ernaar is gevraagd. De referentie kan hieronder met de hand worden ingevuld.

## What the writer writes about a work.

library-notes = Notities
library-notes-yours = Je notities
library-notes-on-work = Je notities bij dit werk
library-notes-read = Je notities lezen
library-notes-write = Een notitie schrijven
library-notes-write-on-work = Een notitie bij dit werk schrijven
library-notes-not-in-library = Een referentie die niet in je bibliotheek staat
library-notes-this-project = In dit project
library-notes-all-projects = In alle projecten
library-notes-project-placeholder = Wat je ervan vindt, voor dit werk
library-notes-all-placeholder = Wat je ervan vindt, waar je het ook citeert
library-notes-keep-for-all = Voor alle projecten bewaren
library-notes-write-for-all = Voor alle projecten schrijven
library-notes-carried = De referentie kwam mee met het project en staat niet in je bibliotheek. Wat hier wordt geschreven, is bij iedereen die het project heeft.
library-notes-kept = Bewaard bij de referentie in je bibliotheek. Het gaat mee met een project dat het werk citeert.
library-notes-unread = Je notities konden niet worden gelezen
library-notes-unsaved = Je notitie kon niet worden bewaard
