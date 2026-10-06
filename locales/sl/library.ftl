# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Pogosto uporabljena
library-form-add-field = Dodaj polje
library-form-citation-key = Ključ navedbe
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = narejen iz avtorja in leta
library-form-date-problem = Datum zapišite kot 1979, 1979-05 ali 1979-05-12; razpon kot 1979/1985.
library-form-remove-field = Odstrani { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Ustanova ali drugo ime, ki ostane celo
library-names-prefix-suffix = Predpona in pripona
    .hint = »van«, »de la« · »ml.«, »III«
library-names-move-up = Premakni gor
library-names-move-down = Premakni dol
library-names-more = Več za to ime
library-names-name = Ime
library-names-name-of = { $role }: ime
library-names-family = Priimek
library-names-family-of = { $role }: priimek
library-names-given = Imena
library-names-given-of = { $role }: imena
library-names-prefix = Predpona: van, de la
library-names-prefix-of = { $role }: predpona
library-names-suffix = Pripona: ml., III
library-names-suffix-of = { $role }: pripona

## Words for references, wherever they are shown.

library-untitled = Brez naslova
library-no-author = Brez avtorja
library-no-title = Brez naslova
library-in-library = V vaši knjižnici

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = isti DOI
library-reason-isbn = isti ISBN
library-reason-identical = enaka v vsem, po čemer se dela ločijo med seboj
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] isti naslov, avtor in leto
            [like] isti naslov in avtor, leto se razlikuje za eno
           *[none] isti naslov in avtor, leto le pri enem od njiju
        }
        [like] { $year ->
            [same] isti naslov in leto ter skupen avtor
            [like] isti naslov, skupen avtor, leto se razlikuje za eno
           *[none] isti naslov, skupen avtor, leto le pri enem od njiju
        }
       *[none] { $year ->
            [same] isti naslov in leto, avtor le pri enem od njiju
            [like] isti naslov, leto se razlikuje za eno, avtor le pri enem od njiju
           *[none] isti naslov, avtor in leto le pri enem od njiju
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] isti avtor in leto ter podoben naslov
            [like] isti avtor, podoben naslov, leto se razlikuje za eno
           *[none] isti avtor, podoben naslov, leto le pri enem od njiju
        }
        [like] { $year ->
            [same] isto leto, podoben naslov, skupen avtor
            [like] podoben naslov, skupen avtor, leto se razlikuje za eno
           *[none] podoben naslov, skupen avtor, leto le pri enem od njiju
        }
       *[none] { $year ->
            [same] isto leto, podoben naslov, avtor le pri enem od njiju
            [like] podoben naslov, leto se razlikuje za eno, avtor le pri enem od njiju
           *[none] podoben naslov, avtor in leto le pri enem od njiju
        }
    }
}
library-reason-file = ista datoteka
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } in { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = To je že v vaši knjižnici.
library-duplicate-probable = To je morda že v vaši knjižnici.
library-duplicate-use = Uporabi tega

## Duplicates in the library.

library-duplicates-title = Dvojniki
library-duplicates-count = { $count ->
    [one] { $count } vir je v knjižnici, kot kaže, več kot enkrat
    [two] { $count } vira sta v knjižnici, kot kaže, več kot enkrat
    [few] { $count } viri so v knjižnici, kot kaže, več kot enkrat
   *[other] { $count } virov je v knjižnici, kot kaže, več kot enkrat
}
library-duplicates-none = Ni dvojnikov
    .text = Noben vir, kot kaže, ni v knjižnici več kot enkrat.
library-duplicates-no-more = Ni več dvojnikov
    .text = Navedbe združenih virov zdaj navajajo tiste, ki so bili obdržani.
library-duplicates-how = Ko se viri združijo v enega, tisti, ki ga obdržite, dobi od drugih, kar mu manjka, in obdrži svoje, kjer se razlikujejo. Njihove datoteke in zbirke se zberejo skupaj, in kar jih navaja, navaja obdržanega.
library-duplicates-same = Isti
library-duplicates-probably-same = Verjetno isti
library-duplicates-keep-which = Kateri naj se obdrži
library-duplicates-kept = Obdržan
library-duplicates-different = Različna sta
library-duplicates-merge = Združi ju v enega
library-duplicates-merging = Združevanje…
library-duplicates-failed = Po knjižnici ni bilo mogoče iskati dvojnikov
library-duplicates-merge-failed = Ni ju bilo mogoče združiti

## Importing references: what a file holds, against what the library has.

library-import = Uvozi
library-import-title = Uvozi vire
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } vir v { $source }
    [two] { $count } vira v { $source }
    [few] { $count } viri v { $source }
   *[other] { $count } virov v { $source }
}
library-import-review = { $count ->
    [one] { $count } vir je morda že v vaši knjižnici
    [two] { $count } vira sta morda že v vaši knjižnici
    [few] { $count } viri so morda že v vaši knjižnici
   *[other] { $count } virov je morda že v vaši knjižnici
}
library-import-new = { $count ->
    [one] { $count } nov vir
    [two] { $count } nova vira
    [few] { $count } novi viri
   *[other] { $count } novih virov
}
library-import-complete = { $count ->
    [one] { $count } vir, ki je že v vaši knjižnici, dobi podatke
    [two] { $count } vira, ki sta že v vaši knjižnici, dobita podatke
    [few] { $count } viri, ki so že v vaši knjižnici, dobijo podatke
   *[other] { $count } virov, ki so že v vaši knjižnici, dobi podatke
}
library-import-known = { $count ->
    [one] { $count } vir je že v vaši knjižnici
    [two] { $count } vira sta že v vaši knjižnici
    [few] { $count } viri so že v vaši knjižnici
   *[other] { $count } virov je že v vaši knjižnici
}
library-import-repeated = { $count ->
    [one] { $count } vir se v uvozu ponovi
    [two] { $count } vira se v uvozu ponovita
    [few] { $count } viri se v uvozu ponovijo
   *[other] { $count } virov se v uvozu ponovi
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Dobil bi: { $fields }
library-import-gains-file = Datoteka
library-import-gains-zotero = Njegov ključ v Zoteru
library-import-what-to-do = Kaj naj se zgodi
library-import-merge = Isto delo: dopolni mojega
library-import-skip = Isto delo: pusti mojega, kakršen je
library-import-add = Drugo delo: dodaj ga
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Za { $count }, ki je isti:
    [two] Za oba { $count }, ki sta ista:
    [few] Za vse { $count }, ki so isti:
   *[other] Za vseh { $count }, ki so isti:
}
library-import-all-probable = { $count ->
    [one] Za { $count }, ki je verjetno isti:
    [two] Za oba { $count }, ki sta verjetno ista:
    [few] Za vse { $count }, ki so verjetno isti:
   *[other] Za vseh { $count }, ki so verjetno isti:
}
library-import-all-merge = Dopolni moje
library-import-all-skip = Pusti moje, kakršni so
library-import-all-add = Vseeno jih dodaj vse
library-import-more = …in še { $count }.
library-import-unread = { $count ->
    [one] { $count } dela datoteke ni bilo mogoče prebrati
    [two] { $count } delov datoteke ni bilo mogoče prebrati
    [few] { $count } delov datoteke ni bilo mogoče prebrati
   *[other] { $count } delov datoteke ni bilo mogoče prebrati
}
library-import-importing = Uvažanje…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } za dodati{ $merge ->
        [0] {""}
       *[other] , { $merge } za dopolniti
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } izpuščenih
    }
library-import-failed = Uvoz ni uspel.

## The library: the list of references, and what can be done with them.

library-references = Viri
library-unread = Knjižnice ni bilo mogoče prebrati
library-all-references = Vsi viri
library-count = { $count ->
    [one] { $count } vir
    [two] { $count } vira
    [few] { $count } viri
   *[other] { $count } virov
}
library-selected = { $count ->
    [one] { $count } vir izbran
    [two] { $count } vira izbrana
    [few] { $count } viri izbrani
   *[other] { $count } virov izbranih
}
library-selected-of = { $count ->
    [one] { $selected } od { $count } vira izbran
    [two] { $selected } od { $count } virov izbrana
    [few] { $selected } od { $count } virov izbrani
   *[other] { $selected } od { $count } virov izbranih
}
library-new-reference = Nov vir
library-search = Išči po knjižnici
library-search-in = Išči v { $name }
library-search-clear = Počisti iskanje
library-sort = Razvrsti
library-sort-author = Avtor
library-sort-year = Leto
library-sort-title = Naslov
library-sort-added = Datum dodajanja
library-sort-modified = Datum spremembe
library-sort-descending = Padajoče

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filter
library-filters-on = { $count ->
    [one] Filter: { $count } vključen
    [two] Filter: { $count } vključena
    [few] Filter: { $count } vključeni
   *[other] Filter: { $count } vključenih
}
library-filter-kind = Tip
library-filter-publisher = Založnik
library-filter-publisher-hint = Del imena
library-filter-any-publisher = Kateri koli založnik
library-filter-year = Leto
library-filter-from = Od
library-filter-to = Do
library-filter-clear = Počisti filtre
library-filter-nothing-here = Tu ni česa filtrirati.
# When the filters let nothing through.
library-nothing-passes = Noben prikazani vir ne gre skozi filtre.
library-import-export = Uvoz in izvoz
library-import-file = Uvozi datoteko…
    .hint = BibLaTeX ali BibTeX
library-paste = Prilepi vire…
library-add-pdfs = Dodaj datoteke PDF…
    .hint = Za vsako se poizve in se shrani
library-import-zotero = Uvozi iz Zotera…
library-find-duplicates = Poišči dvojnike…
library-map-library = Miselni vzorec knjižnice…
library-map-collection = Miselni vzorec zbirke »{ $name }«…
library-export-library = Izvozi knjižnico…
library-export-collection = Izvozi »{ $name }«…
library-export-one = Izvozi…
library-export-many = { $count ->
    [one] Izvozi { $count } vir…
    [two] Izvozi { $count } vira…
    [few] Izvozi { $count } vire…
   *[other] Izvozi { $count } virov…
}
library-export-title = Izvozi vire
# What a file of exported references is called, before it is given a name.
library-export-file-references = viri
library-export-file-library = knjiznica
library-exported = { $count ->
    [one] { $count } vir izvožen
    [two] { $count } vira izvožena
    [few] { $count } viri izvoženi
   *[other] { $count } virov izvoženih
}
library-export-failed = Izvoz ni uspel
library-empty = Vaša knjižnica je prazna
    .text = Viri, ki jih dodate sem, so na voljo v vseh vaših projektih. Začnite z enim ali uvozite tiste, ki jih že imate.
library-collection-empty = V tej zbirki še ni ničesar
    .text = Povlecite vire sem iz knjižnice ali dodajte novega.
library-nothing-found = Nič ni najdeno
    .text = Noben vir ne vsebuje vseh teh besed.
library-open-file = Odpri datoteko
library-file-open-failed = Datoteke ni bilo mogoče odpreti
library-add-to-collection = Dodaj v zbirko
library-remove-from = Odstrani iz »{ $name }«
library-copy-key = Kopiraj ključ navedbe
library-copied-key = Kopirano »{ $key }«
library-copy-biblatex = Kopiraj kot BibLaTeX
library-copied = Kopirano
library-delete-one-title = Izbrisati »{ $name }«?
library-delete-many-title = { $count ->
    [one] Izbrisati { $count } vir?
    [two] Izbrisati { $count } vira?
    [few] Izbrisati { $count } vire?
   *[other] Izbrisati { $count } virov?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = To odstrani vir iz vaše knjižnice, iz vsake zbirke{ $files ->
        [0] {""}
        [one] , skupaj s { $files } priloženo datoteko
        [two] , skupaj s { $files } priloženima datotekama
        [few] , skupaj s { $files } priloženimi datotekami
       *[other] , skupaj s { $files } priloženimi datotekami
    }.{ $projects ->
        [0] {""}
        [one] {" "}Naveden je v enem projektu, ki obdrži svojo kopijo.
        [two] {" "}Naveden je v { $projects } projektih, ki obdržita svojo kopijo.
        [few] {" "}Naveden je v { $projects } projektih, ki obdržijo svojo kopijo.
       *[other] {" "}Naveden je v { $projects } projektih, ki obdržijo svojo kopijo.
    }
library-delete-many = To jih odstrani iz vaše knjižnice, iz vsake zbirke{ $files ->
        [0] {""}
        [one] , skupaj s { $files } priloženo datoteko
        [two] , skupaj s { $files } priloženima datotekama
        [few] , skupaj s { $files } priloženimi datotekami
       *[other] , skupaj s { $files } priloženimi datotekami
    }.{ $projects ->
        [0] {""}
        [one] {" "}Projekt, ki navaja nekatere od njih, obdrži svojo kopijo tistih.
        [two] {" "}{ $projects } projekta, ki navajata nekatere od njih, obdržita svojo kopijo tistih.
        [few] {" "}{ $projects } projekti, ki navajajo nekatere od njih, obdržijo svojo kopijo tistih.
       *[other] {" "}{ $projects } projektov, ki navajajo nekatere od njih, obdrži svojo kopijo tistih.
    }
library-delete-failed = Virov ni bilo mogoče izbrisati
library-not-done = Tega ni bilo mogoče narediti

## Collections.

library-collections = Zbirke
# The projects that cite a work, in its pane.
library-cited-in = Naveden v
library-not-cited = Ni naveden v nobenem projektu.
library-cited-reading = Branje projektov…
library-collections-hint = Zbirke zbirajo vire za kako temo ali delo. Vir je lahko v poljubno mnogo zbirkah.
library-collection-new = Nova zbirka
library-collection-new-inside = Nova zbirka znotraj
library-collection-new-under = Nova zbirka v »{ $name }«
library-collection-move-to = Premakni v
library-collection-name = Ime zbirke
library-collection-name-failed = Zbirke ni bilo mogoče poimenovati
library-collection-expand = Razširi
library-collection-collapse = Strni
library-collection-to-top = Premakni na vrhnjo raven
library-collection-move-failed = Zbirke ni bilo mogoče premakniti
library-collection-added = { $count ->
    [one] { $count } vir dodan v »{ $name }«
    [two] { $count } vira dodana v »{ $name }«
    [few] { $count } viri dodani v »{ $name }«
   *[other] { $count } virov dodanih v »{ $name }«
}
library-collection-already = Že v »{ $name }«
library-collection-delete = Izbriši zbirko
library-collection-delete-title = Izbrisati zbirko »{ $name }«?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Viri ostanejo v vaši knjižnici.
   *[other] Izbrišejo se tudi zbirke v njej. Viri ostanejo v vaši knjižnici.
}
library-collection-delete-failed = Zbirke ni bilo mogoče izbrisati
library-collection-count = { $count ->
    [one] { $count } zbirka
    [two] { $count } zbirki
    [few] { $count } zbirke
   *[other] { $count } zbirk
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Miselni vzorec knjižnice
library-map-title-collection = Miselni vzorec zbirke
# The name a project made of the whole library is given.
library-map-library-name = Knjižnica
library-map-name = Ime
library-map-name-hint = Ime projekta, njegovega miselnega vzorca in elementa v središču miselnega vzorca.
library-map-what-library = Zbirke postanejo elementi, gnezdeni, kakor so, in vsak vir element pod svojo zbirko, katerega besedilo je njegova navedba. Viri, ki niso v nobeni zbirki, stojijo v središču.
library-map-what-collection = Zbirke v njej postanejo elementi, gnezdeni, kakor so, in vsak vir element pod svojo zbirko, katerega besedilo je njegova navedba.
library-map-nothing = Ni virov, ki bi jih postavili v miselni vzorec.
library-map-make = Naredi projekt
library-map-making = Izdelava projekta…
library-map-failed = Projekta ni bilo mogoče narediti.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } datoteka
    [two] { $count } datoteki
    [few] { $count } datoteke
   *[other] { $count } datotek
}
library-open-failed = Vira ni bilo mogoče odpreti
library-known = { $count ->
    [one] Je že v vaši knjižnici
    [two] Sta že v vaši knjižnici
    [few] So že v vaši knjižnici
   *[other] So že v vaši knjižnici
}
library-nothing-to-import = Ni česa uvoziti
library-none-found = Noben vir ni bil najden.
library-import-kinds = Viri se berejo iz datotek .bib in se naredijo iz datotek PDF.
library-filter-bib = BibLaTeX in BibTeX
library-filter-all = Vse datoteke
library-files-read-failed = { $count ->
    [one] Datoteke ni bilo mogoče prebrati
    [two] Datotek ni bilo mogoče prebrati
    [few] Datotek ni bilo mogoče prebrati
   *[other] Datotek ni bilo mogoče prebrati
}
library-text-read-failed = Besedila ni bilo mogoče prebrati
library-add-pdfs-title = Dodaj datoteke PDF
library-pdfs-working = { $count ->
    [one] Ugotavljanje, kaj je datoteka…
    [two] Ugotavljanje, kaj sta { $count } datoteki…
    [few] Ugotavljanje, kaj so { $count } datoteke…
   *[other] Ugotavljanje, kaj je { $count } datotek…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } od { $count }: { $name }
library-stop = Ustavi
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } vir dodan
    [two] { $count } vira dodana
    [few] { $count } viri dodani
   *[other] { $count } virov dodanih
}
library-imported-completed = { $count ->
    [one] { $count } dopolnjen
    [two] { $count } dopolnjena
    [few] { $count } dopolnjeni
   *[other] { $count } dopolnjenih
}
library-imported-skipped = { $count } že v knjižnici
library-imported-files = { $count ->
    [one] { $count } datoteka shranjena
    [two] { $count } datoteki shranjeni
    [few] { $count } datoteke shranjene
   *[other] { $count } datotek shranjenih
}
library-imported-nothing = Nič ni bilo spremenjeno
library-paste-title = Prilepi vire
library-paste-subtitle = BibLaTeX ali BibTeX, poljubno mnogo vnosov
library-paste-continue = Nadaljuj
library-source-label = Izvorna koda BibLaTeX

## Importing from Zotero.

library-zotero-title = Uvozi iz Zotera
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Na tem računalniku ni bil najden noben Zotero na mestih, kjer navadno hrani svoje podatke. Če jih hrani drugje, pokažite kje: mapo, v kateri je { $file }.
library-zotero-lead = Kar se uvozi, se skopira v vašo knjižnico skupaj z datotekami. Zotero se le bere in nič v njem se ne spremeni; medtem lahko teče.
library-zotero-choose = Podatkovna mapa Zotera
library-zotero-none-there = Tam ni Zotera.
library-zotero-unread = Zotera ni bilo mogoče prebrati.
library-zotero-library = Knjižnica
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Moja knjižnica
library-zotero-what = Kaj naj se uvozi
library-zotero-everything = Vse
library-zotero-with-files = S priloženimi datotekami
library-zotero-with-notes = Z zapiski, kot anotacijami
library-zotero-elsewhere = Drugo mesto…
library-zotero-show-where = Pokaži kje…
library-zotero-reading = Branje…
library-zotero-read = { $count ->
    [0] Preberi
    [one] Preberi { $count } vir
    [two] Preberi { $count } vira
    [few] Preberi { $count } vire
   *[other] Preberi { $count } virov
}

## Writing a reference.

library-dialog-edit = Uredi vir
library-dialog-add = Dodaj vir
library-dialog-back = Nazaj na obrazec
library-dialog-open-failed = Vira ni bilo mogoče odpreti.
library-dialog-save-failed = Vira ni bilo mogoče shraniti.
# The entry as BibLaTeX, as against the form.
library-source = Izvorna koda
library-source-unread = Izvorne kode ni bilo mogoče prebrati.

## A reference, beside the list.

library-pane-label = Vir
library-pane-more = Več
library-pane-saved = Shranjeno
library-pane-editing = Urejanje…
library-pane-not-saved = Ni shranjeno
library-pane-unread = Vira ni bilo mogoče prebrati.
library-pane-save-failed = Sprememb ni bilo mogoče shraniti.
library-pane-note-placeholder = Kaj si mislite o njem. Zase: ni del tega, kar se navaja.
library-pane-files = Datoteke
library-pane-attach = Priloži
library-pane-attach-title = Priloži datoteke
library-pane-attach-failed = Datoteke ni bilo mogoče priložiti
# Of a file that is attached, and not where it should be.
library-pane-missing = manjka
library-pane-reveal = Pokaži v upravitelju datotek
library-pane-reveal-failed = Mape ni bilo mogoče odpreti
library-pane-no-files = Ni datotek. Priložite PDF ali ga spustite sem.
library-pane-detach = Odstrani datoteko
library-pane-detach-title = Odstraniti »{ $name }«?
library-pane-detach-message = Datoteka se izbriše iz shrambe knjižnice, razen če jo uporablja drug vir.
library-pane-detach-failed = Datoteke ni bilo mogoče odstraniti
library-pane-leave-collection = Odstrani iz { $name }
library-pane-duplicate = Podvoji
    .hint = Nov vir, ki se začne s temi podatki
library-pane-edit-source = Uredi izvorno kodo…
library-pane-source-subtitle = Vnos kot BibLaTeX. Večina stvari je lažja v obrazcu.
library-pane-source-failed = Izvorne kode ni bilo mogoče prikazati
library-pane-added = Dodan { $date }
library-pane-added-changed = Dodan { $added } · spremenjen { $changed }

## Looking up a reference.

library-lookup-placeholder = Poizvedite: DOI, ISBN ali besede iz naslova in avtor
library-lookup-label = Poizvedi o viru
library-lookup-failed = Ni bilo mogoče poizvedeti o ničemer.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Izpolnjeno po: { $source }.
library-lookup-others = { $count ->
    [one] { $count } drug zapis
    [two] { $count } druga zapisa
    [few] { $count } drugi zapisi
   *[other] { $count } drugih zapisov
}
library-lookup-scope = Kaj naj se išče
library-lookup-any = Kar koli
library-lookup-books = Knjige
library-lookup-articles = Članki
library-lookup-none = Nič ni bilo najdeno. Manj besed lahko najde več: priimek avtorja in beseda ali dve iz naslova.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = O tem { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] številki arXiva
       *[pmid] številki PubMeda
    } tam, kjer je bilo vprašano, ni nič znanega. Vir je mogoče vpisati ročno spodaj.

## What the writer writes about a work.

library-notes = Zapiski
library-notes-yours = Vaši zapiski
library-notes-on-work = Vaši zapiski o tem delu
library-notes-read = Preberi svoje zapiske
library-notes-write = Napiši zapisek
library-notes-write-on-work = Napiši zapisek o tem delu
library-notes-not-in-library = Vir, ki ni v vaši knjižnici
library-notes-this-project = V tem projektu
library-notes-all-projects = V vseh projektih
library-notes-project-placeholder = Kaj si mislite o njem, za to delo
library-notes-all-placeholder = Kaj si mislite o njem, kjer koli ga navajate
library-notes-keep-for-all = Hrani za vse projekte
library-notes-write-for-all = Piši za vse projekte
library-notes-carried = Vir je prišel s projektom in ni v vaši knjižnici. Kar je napisano tu, ima vsak, ki ima projekt.
library-notes-kept = Hranjeno z virom v vaši knjižnici. Gre s projektom, ki navaja to delo.
library-notes-unread = Vaših zapiskov ni bilo mogoče prebrati
library-notes-unsaved = Vašega zapiska ni bilo mogoče shraniti
