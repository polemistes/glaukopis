# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Često korišteno
library-form-add-field = Dodaj polje
library-form-citation-key = Ključ citata
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = pravi se od autora i godine
library-form-date-problem = Datum pišite kao 1979, 1979-05 ili 1979-05-12; raspon kao 1979/1985.
library-form-remove-field = Ukloni { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institucija ili drugo ime koje se ne dijeli
library-names-prefix-suffix = Prefiks i sufiks
    .hint = „van“, „de la“ · „Jr.“, „III“
library-names-move-up = Pomjeri gore
library-names-move-down = Pomjeri dolje
library-names-more = Više za ovo ime
library-names-name = Ime
library-names-name-of = { $role }: ime
library-names-family = Prezime
library-names-family-of = { $role }: prezime
library-names-given = Imena
library-names-given-of = { $role }: imena
library-names-prefix = Prefiks: van, de la
library-names-prefix-of = { $role }: prefiks
library-names-suffix = Sufiks: Jr., III
library-names-suffix-of = { $role }: sufiks

## Words for references, wherever they are shown.

library-untitled = Bez naslova
library-no-author = Bez autora
library-no-title = Nema naslova
library-in-library = U vašoj biblioteci

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = isti DOI
library-reason-isbn = isti ISBN
library-reason-identical = jednako u svemu što razlikuje jedno djelo od drugog
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] isti naslov, autor i godina
            [like] isti naslov i autor, godina se razlikuje za jednu
           *[none] isti naslov i autor, godina samo na jednom
        }
        [like] { $year ->
            [same] isti naslov i godina, i zajednički autor
            [like] isti naslov, zajednički autor, godina se razlikuje za jednu
           *[none] isti naslov, zajednički autor, godina samo na jednom
        }
       *[none] { $year ->
            [same] isti naslov i godina, autor samo na jednom
            [like] isti naslov, godina se razlikuje za jednu, autor samo na jednom
           *[none] isti naslov, autor i godina samo na jednom
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] isti autor i godina, i sličan naslov
            [like] isti autor, sličan naslov, godina se razlikuje za jednu
           *[none] isti autor, sličan naslov, godina samo na jednom
        }
        [like] { $year ->
            [same] ista godina, sličan naslov, zajednički autor
            [like] sličan naslov, zajednički autor, godina se razlikuje za jednu
           *[none] sličan naslov, zajednički autor, godina samo na jednom
        }
       *[none] { $year ->
            [same] ista godina, sličan naslov, autor samo na jednom
            [like] sličan naslov, godina se razlikuje za jednu, autor samo na jednom
           *[none] sličan naslov, autor i godina samo na jednom
        }
    }
}
library-reason-file = ista datoteka
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } i { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Ovo je već u vašoj biblioteci.
library-duplicate-probable = Ovo je možda već u vašoj biblioteci.
library-duplicate-use = Koristi ovu

## Duplicates in the library.

library-duplicates-title = Duplikati
library-duplicates-count = { $count ->
    [one] Čini se da je { $count } referenca u biblioteci više puta
    [few] Čini se da su { $count } reference u biblioteci više puta
   *[other] Čini se da je { $count } referenci u biblioteci više puta
}
library-duplicates-none = Nema duplikata
    .text = Čini se da nijedna referenca nije u biblioteci više puta.
library-duplicates-no-more = Nema više duplikata
    .text = Citati spojenih referenci sada citiraju one koje su zadržane.
library-duplicates-how = Kad se reference spoje u jednu, ona koju zadržite dobija od ostalih ono što joj nedostaje, a zadržava svoje gdje se razlikuju. Njihove datoteke i zbirke se skupljaju zajedno, a ono što ih citira citira zadržanu.
library-duplicates-same = Iste
library-duplicates-probably-same = Vjerovatno iste
library-duplicates-keep-which = Koja se zadržava
library-duplicates-kept = Zadržana
library-duplicates-different = Različite su
library-duplicates-merge = Spoji ih u jednu
library-duplicates-merging = Spajanje u jednu…
library-duplicates-failed = Biblioteku nije bilo moguće pretražiti za duplikate
library-duplicates-merge-failed = Nije ih bilo moguće spojiti u jednu

## Importing references: what a file holds, against what the library has.

library-import = Uvezi
library-import-title = Uvoz referenci
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referenca ({ $source })
    [few] { $count } reference ({ $source })
   *[other] { $count } referenci ({ $source })
}
library-import-review = { $count ->
    [one] { $count } referenca je možda već u vašoj biblioteci
    [few] { $count } reference su možda već u vašoj biblioteci
   *[other] { $count } referenci je možda već u vašoj biblioteci
}
library-import-new = { $count ->
    [one] { $count } nova referenca
    [few] { $count } nove reference
   *[other] { $count } novih referenci
}
library-import-complete = { $count ->
    [one] { $count } referenca koja je već u vašoj biblioteci dobija podatke
    [few] { $count } reference koje su već u vašoj biblioteci dobijaju podatke
   *[other] { $count } referenci koje su već u vašoj biblioteci dobija podatke
}
library-import-known = { $count ->
    [one] { $count } referenca već u vašoj biblioteci
    [few] { $count } reference već u vašoj biblioteci
   *[other] { $count } referenci već u vašoj biblioteci
}
library-import-repeated = { $count ->
    [one] { $count } referenca ponovljena unutar uvoza
    [few] { $count } reference ponovljene unutar uvoza
   *[other] { $count } referenci ponovljenih unutar uvoza
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Dobila bi: { $fields }
library-import-gains-file = Datoteku
library-import-gains-zotero = Svoj ključ u Zoteru
library-import-what-to-do = Šta učiniti
library-import-merge = Isto djelo: dopuni moju
library-import-skip = Isto djelo: ostavi moju kakva jeste
library-import-add = Drugo djelo: dodaj ga
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Za { $count } referencu koja je ista:
    [few] Za sve { $count } reference koje su iste:
   *[other] Za svih { $count } referenci koje su iste:
}
library-import-all-probable = { $count ->
    [one] Za { $count } referencu koja je vjerovatno ista:
    [few] Za sve { $count } reference koje su vjerovatno iste:
   *[other] Za svih { $count } referenci koje su vjerovatno iste:
}
library-import-all-merge = Dopuni moje
library-import-all-skip = Ostavi moje kakve jesu
library-import-all-add = Svejedno ih sve dodaj
library-import-more = …i još { $count }.
library-import-unread = { $count ->
    [one] { $count } dio datoteke nije bilo moguće pročitati
    [few] { $count } dijela datoteke nije bilo moguće pročitati
   *[other] { $count } dijelova datoteke nije bilo moguće pročitati
}
library-import-importing = Uvoz…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } za dodavanje{ $merge ->
        [0] {""}
       *[other] , { $merge } za dopunu
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } izostavljeno
    }
library-import-failed = Uvoz nije uspio.

## The library: the list of references, and what can be done with them.

library-references = Reference
library-unread = Biblioteku nije bilo moguće pročitati
library-all-references = Sve reference
library-count = { $count ->
    [one] { $count } referenca
    [few] { $count } reference
   *[other] { $count } referenci
}
library-selected = { $count ->
    [one] { $count } referenca odabrana
    [few] { $count } reference odabrane
   *[other] { $count } referenci odabrano
}
library-selected-of = { $count ->
    [one] { $selected } od { $count } reference odabrano
    [few] { $selected } od { $count } reference odabrano
   *[other] { $selected } od { $count } referenci odabrano
}
library-new-reference = Nova referenca
library-search = Pretraži biblioteku
library-search-in = Pretraži u { $name }
library-search-clear = Očisti pretragu
library-sort = Sortiraj
library-sort-author = Autor
library-sort-year = Godina
library-sort-title = Naslov
library-sort-added = Datum dodavanja
library-sort-modified = Datum izmjene
library-sort-descending = Opadajuće

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtriraj
library-filters-on = { $count ->
    [one] Filter: { $count } uključen
    [few] Filter: { $count } uključena
   *[other] Filter: { $count } uključeno
}
library-filter-kind = Vrsta
library-filter-publisher = Izdavač
library-filter-publisher-hint = Dio naziva
library-filter-any-publisher = Bilo koji izdavač
library-filter-year = Godina
library-filter-from = Od
library-filter-to = Do
library-filter-clear = Očisti filtere
library-filter-nothing-here = Ovdje nema šta filtrirati.
# When the filters let nothing through.
library-nothing-passes = Nijedna referenca u prikazu ne prolazi filtere.
library-import-export = Uvoz i izvoz
library-import-file = Uvezi datoteku…
    .hint = BibLaTeX ili BibTeX
library-paste = Zalijepi reference…
library-add-pdfs = Dodaj PDF datoteke…
    .hint = Za svaku se dohvaćaju podaci, i čuva se
library-import-zotero = Uvezi iz Zotera…
library-find-duplicates = Pronađi duplikate…
library-map-library = Mapa biblioteke…
library-map-collection = Mapa zbirke „{ $name }“…
library-export-library = Izvezi biblioteku…
library-export-collection = Izvezi „{ $name }“…
library-export-one = Izvezi…
library-export-many = { $count ->
    [one] Izvezi { $count } referencu…
    [few] Izvezi { $count } reference…
   *[other] Izvezi { $count } referenci…
}
library-export-title = Izvoz referenci
# What a file of exported references is called, before it is given a name.
library-export-file-references = reference
library-export-file-library = biblioteka
library-exported = { $count ->
    [one] { $count } referenca izvezena
    [few] { $count } reference izvezene
   *[other] { $count } referenci izvezeno
}
library-export-failed = Izvoz nije uspio
library-empty = Vaša je biblioteka prazna
    .text = Reference koje ovdje dodate dostupne su u svim vašim projektima. Počnite s jednom, ili učitajte one koje već imate.
library-collection-empty = U ovoj zbirci još nema ničega
    .text = Prevucite reference ovamo iz biblioteke, ili dodajte novu.
library-nothing-found = Ništa nije pronađeno
    .text = Nijedna referenca ne sadrži sve ove riječi.
library-open-file = Otvori datoteku
library-file-open-failed = Datoteku nije bilo moguće otvoriti
library-add-to-collection = Dodaj u zbirku
library-remove-from = Ukloni iz „{ $name }“
library-copy-key = Kopiraj ključ citata
library-copied-key = Kopirano „{ $key }“
library-copy-biblatex = Kopiraj kao BibLaTeX
library-copied = Kopirano
library-delete-one-title = Izbrisati „{ $name }“?
library-delete-many-title = { $count ->
    [one] Izbrisati { $count } referencu?
    [few] Izbrisati { $count } reference?
   *[other] Izbrisati { $count } referenci?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Ovim se referenca uklanja iz vaše biblioteke, iz svake zbirke{ $files ->
        [0] {""}
        [one] , zajedno s { $files } priloženom datotekom
        [few] , zajedno s { $files } priložene datoteke
       *[other] , zajedno s { $files } priloženih datoteka
    }.{ $projects ->
        [0] {""}
        [one] {" "}Citirana je u jednom projektu, koji čuva njenu kopiju.
        [few] {" "}Citirana je u { $projects } projekta, koji čuvaju njenu kopiju.
       *[other] {" "}Citirana je u { $projects } projekata, koji čuvaju njenu kopiju.
    }
library-delete-many = Ovim se uklanjaju iz vaše biblioteke, iz svake zbirke{ $files ->
        [0] {""}
        [one] , zajedno s { $files } priloženom datotekom
        [few] , zajedno s { $files } priložene datoteke
       *[other] , zajedno s { $files } priloženih datoteka
    }.{ $projects ->
        [0] {""}
        [one] {" "}Projekat koji citira neke od njih čuva njihovu kopiju.
        [few] {" "}{ $projects } projekta koja citiraju neke od njih čuvaju njihovu kopiju.
       *[other] {" "}{ $projects } projekata koji citiraju neke od njih čuvaju njihovu kopiju.
    }
library-delete-failed = Reference nije bilo moguće izbrisati
library-not-done = To nije bilo moguće učiniti

## Collections.

library-collections = Zbirke
# The projects that cite a work, in its pane.
library-cited-in = Citirana u
library-not-cited = Nije citirana ni u jednom projektu.
library-cited-reading = Čitanje projekata…
library-collections-hint = Zbirke skupljaju reference za neku temu ili rad. Referenca može biti u koliko god zbirki.
library-collection-new = Nova zbirka
library-collection-new-inside = Nova zbirka unutra
library-collection-new-under = Nova zbirka u „{ $name }“
library-collection-move-to = Premjesti u
library-collection-name = Naziv zbirke
library-collection-name-failed = Zbirku nije bilo moguće imenovati
library-collection-expand = Rasklopi
library-collection-collapse = Sklopi
library-collection-to-top = Premjesti na najviši nivo
library-collection-move-failed = Zbirku nije bilo moguće premjestiti
library-collection-added = { $count ->
    [one] { $count } referenca dodana u „{ $name }“
    [few] { $count } reference dodane u „{ $name }“
   *[other] { $count } referenci dodano u „{ $name }“
}
library-collection-already = Već u „{ $name }“
library-collection-delete = Izbriši zbirku
library-collection-delete-title = Izbrisati zbirku „{ $name }“?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Reference ostaju u vašoj biblioteci.
   *[other] Brišu se i zbirke unutar nje. Reference ostaju u vašoj biblioteci.
}
library-collection-delete-failed = Zbirku nije bilo moguće izbrisati
library-collection-count = { $count ->
    [one] { $count } zbirka
    [few] { $count } zbirke
   *[other] { $count } zbirki
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Mapa biblioteke
library-map-title-collection = Mapa zbirke
# The name a project made of the whole library is given.
library-map-library-name = Biblioteka
library-map-name = Naziv
library-map-name-hint = Naziv projekta, njegove mape i elementa u središtu mape.
library-map-what-library = Zbirke postaju elementi, ugniježđeni kako jesu, a svaka referenca element pod svojom zbirkom, čiji je tekst njen citat. Reference koje nisu ni u jednoj zbirci stoje u središtu.
library-map-what-collection = Zbirke unutar nje postaju elementi, ugniježđeni kako jesu, a svaka referenca element pod svojom zbirkom, čiji je tekst njen citat.
library-map-nothing = Nema referenci koje bi se stavile na mapu.
library-map-make = Napravi projekat
library-map-making = Pravljenje projekta…
library-map-failed = Projekat nije bilo moguće napraviti.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } datoteka
    [few] { $count } datoteke
   *[other] { $count } datoteka
}
library-open-failed = Referencu nije bilo moguće otvoriti
library-known = { $count ->
    [one] Već je u vašoj biblioteci
    [few] Već su u vašoj biblioteci
   *[other] Već su u vašoj biblioteci
}
library-nothing-to-import = Nema šta uvesti
library-none-found = Nije pronađena nijedna referenca.
library-import-kinds = Reference se čitaju iz .bib datoteka, a prave od PDF datoteka.
library-filter-bib = BibLaTeX i BibTeX
library-filter-all = Sve datoteke
library-files-read-failed = { $count ->
    [one] Datoteku nije bilo moguće pročitati
    [few] Datoteke nije bilo moguće pročitati
   *[other] Datoteke nije bilo moguće pročitati
}
library-text-read-failed = Tekst nije bilo moguće pročitati
library-add-pdfs-title = Dodaj PDF datoteke
library-pdfs-working = { $count ->
    [one] Utvrđivanje šta je datoteka…
    [few] Utvrđivanje šta su { $count } datoteke…
   *[other] Utvrđivanje šta je { $count } datoteka…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } od { $count }: { $name }
library-stop = Zaustavi
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referenca dodana
    [few] { $count } reference dodane
   *[other] { $count } referenci dodano
}
library-imported-completed = { $count ->
    [one] { $count } dopunjena
    [few] { $count } dopunjene
   *[other] { $count } dopunjeno
}
library-imported-skipped = { $count } već u biblioteci
library-imported-files = { $count ->
    [one] { $count } datoteka spremljena
    [few] { $count } datoteke spremljene
   *[other] { $count } datoteka spremljeno
}
library-imported-nothing = Ništa nije promijenjeno
library-paste-title = Zalijepi reference
library-paste-subtitle = BibLaTeX ili BibTeX, koliko god unosa želite
library-paste-continue = Nastavi
library-source-label = BibLaTeX zapis

## Importing from Zotero.

library-zotero-title = Uvoz iz Zotera
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Na ovom računaru nije pronađen Zotero na mjestima gdje obično čuva svoje podatke. Ako ih čuva drugdje, pokažite gdje: folder koji sadrži { $file }.
library-zotero-lead = Ono što se uvozi kopira se u vašu biblioteku, s datotekama. Zotero se samo čita i ništa se u njemu ne mijenja; može u međuvremenu biti pokrenut.
library-zotero-choose = Folder s podacima Zotera
library-zotero-none-there = Ondje nema Zotera.
library-zotero-unread = Zotero nije bilo moguće pročitati.
library-zotero-library = Biblioteka
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Moja biblioteka
library-zotero-what = Šta uvesti
library-zotero-everything = Sve
library-zotero-with-files = S priloženim datotekama
library-zotero-with-notes = S bilješkama, kao anotacijama
library-zotero-elsewhere = Drugo mjesto…
library-zotero-show-where = Pokaži gdje…
library-zotero-reading = Čitanje…
library-zotero-read = { $count ->
    [0] Pročitano
    [one] Pročitana { $count } referenca
    [few] Pročitane { $count } reference
   *[other] Pročitano { $count } referenci
}

## Writing a reference.

library-dialog-edit = Uredi referencu
library-dialog-add = Dodaj referencu
library-dialog-back = Nazad na obrazac
library-dialog-open-failed = Referencu nije bilo moguće otvoriti.
library-dialog-save-failed = Referencu nije bilo moguće sačuvati.
# The entry as BibLaTeX, as against the form.
library-source = BibLaTeX zapis
library-source-unread = Zapis nije bilo moguće pročitati.

## A reference, beside the list.

library-pane-label = Referenca
library-pane-more = Više
library-pane-saved = Sačuvano
library-pane-editing = Uređivanje…
library-pane-not-saved = Nije sačuvano
library-pane-unread = Referencu nije bilo moguće pročitati.
library-pane-save-failed = Izmjene nije bilo moguće sačuvati.
library-pane-note-placeholder = Šta o njoj mislite. Za vas: nije dio onoga što se citira.
library-pane-files = Datoteke
library-pane-attach = Priloži
library-pane-attach-title = Priloži datoteke
library-pane-attach-failed = Datoteku nije bilo moguće priložiti
# Of a file that is attached, and not where it should be.
library-pane-missing = nedostaje
library-pane-reveal = Prikaži u upravitelju datoteka
library-pane-reveal-failed = Folder nije bilo moguće otvoriti
library-pane-no-files = Nema datoteka. Priložite PDF, ili ga ispustite ovdje.
library-pane-detach = Ukloni datoteku
library-pane-detach-title = Ukloniti „{ $name }“?
library-pane-detach-message = Datoteka se briše iz spremišta biblioteke, osim ako je koristi druga referenca.
library-pane-detach-failed = Datoteku nije bilo moguće ukloniti
library-pane-leave-collection = Ukloni iz { $name }
library-pane-duplicate = Dupliciraj
    .hint = Nova referenca koja počinje ovim podacima
library-pane-edit-source = Uredi BibLaTeX zapis…
library-pane-source-subtitle = Jedinica kao BibLaTeX. Većina je stvari lakša u obrascu.
library-pane-source-failed = Zapis nije bilo moguće prikazati
library-pane-added = Dodano { $date }
library-pane-added-changed = Dodano { $added } · izmijenjeno { $changed }

## Looking up a reference.

library-lookup-placeholder = Dohvatite je: DOI, ISBN, ili riječi iz naslova i autor
library-lookup-label = Dohvati referencu
library-lookup-failed = Ništa nije bilo moguće dohvatiti.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Popunjeno iz baze { $source }.
library-lookup-others = { $count ->
    [one] { $count } drugi zapis
    [few] { $count } druga zapisa
   *[other] { $count } drugih zapisa
}
library-lookup-scope = Šta tražiti
library-lookup-any = Bilo šta
library-lookup-books = Knjige
library-lookup-articles = Članke
library-lookup-none = Ništa nije pronađeno. Manje riječi može pronaći više: prezime autora i riječ-dvije iz naslova.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Ništa nije poznato o ovom { $kind ->
        [doi] DOI-ju
        [isbn] ISBN-u
        [arxiv] broju arXiva
       *[pmid] broju PubMeda
    } ondje gdje je zatraženo. Referenca se može unijeti ručno dolje.

## What the writer writes about a work.

library-notes = Bilješke
library-notes-yours = Vaše bilješke
library-notes-on-work = Vaše bilješke o ovom djelu
library-notes-read = Pročitajte svoje bilješke
library-notes-write = Napiši bilješku
library-notes-write-on-work = Napiši bilješku o ovom djelu
library-notes-not-in-library = Referenca koje nema u vašoj biblioteci
library-notes-this-project = U ovom projektu
library-notes-all-projects = U svim projektima
library-notes-project-placeholder = Šta o njemu mislite, za ovaj rad
library-notes-all-placeholder = Šta o njemu mislite, gdje god ga citirate
library-notes-keep-for-all = Čuvaj za sve projekte
library-notes-write-for-all = Piši za sve projekte
library-notes-carried = Referenca je došla s projektom i nije u vašoj biblioteci. Ono što je ovdje napisano imaju svi koji imaju projekat.
library-notes-kept = Čuva se uz referencu u vašoj biblioteci. Ide s projektom koji citira djelo.
library-notes-unread = Vaše bilješke nije bilo moguće pročitati
library-notes-unsaved = Vašu bilješku nije bilo moguće sačuvati
