# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Često korištena
library-form-add-field = Dodaj polje
library-form-citation-key = Citatni ključ
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = iz autora i godine
library-form-date-problem = Datum napišite kao 1979, 1979-05 ili 1979-05-12; raspon kao 1979/1985.
library-form-remove-field = Ukloni { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Ustanova ili drugo ime koje ostaje cijelo
library-names-prefix-suffix = Prefiks i sufiks
    .hint = „van”, „de la” · „ml.”, „III”
library-names-move-up = Pomakni gore
library-names-move-down = Pomakni dolje
library-names-more = Više za ovo ime
library-names-name = Ime
library-names-name-of = { $role }: ime
library-names-family = Prezime
library-names-family-of = { $role }: prezime
library-names-given = Imena
library-names-given-of = { $role }: imena
library-names-prefix = Prefiks: van, de la
library-names-prefix-of = { $role }: prefiks
library-names-suffix = Sufiks: ml., III
library-names-suffix-of = { $role }: sufiks

## Words for references, wherever they are shown.

library-untitled = Bez naslova
library-no-author = Bez autora
library-no-title = Bez naslova
library-in-library = U vašoj knjižnici

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = isti DOI
library-reason-isbn = isti ISBN
library-reason-identical = jednake u svemu po čemu se jedno djelo razlikuje od drugoga
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] isti naslov, autor i godina
            [like] isti naslov i autor, godina se razlikuje za jednu
           *[none] isti naslov i autor, godina samo na jednoj
        }
        [like] { $year ->
            [same] isti naslov i godina, i zajednički autor
            [like] isti naslov, zajednički autor, godina se razlikuje za jednu
           *[none] isti naslov, zajednički autor, godina samo na jednoj
        }
       *[none] { $year ->
            [same] isti naslov i godina, autor samo na jednoj
            [like] isti naslov, godina se razlikuje za jednu, autor samo na jednoj
           *[none] isti naslov, autor i godina samo na jednoj
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] isti autor i godina, i sličan naslov
            [like] isti autor, sličan naslov, godina se razlikuje za jednu
           *[none] isti autor, sličan naslov, godina samo na jednoj
        }
        [like] { $year ->
            [same] ista godina, sličan naslov, zajednički autor
            [like] sličan naslov, zajednički autor, godina se razlikuje za jednu
           *[none] sličan naslov, zajednički autor, godina samo na jednoj
        }
       *[none] { $year ->
            [same] ista godina, sličan naslov, autor samo na jednoj
            [like] sličan naslov, godina se razlikuje za jednu, autor samo na jednoj
           *[none] sličan naslov, autor i godina samo na jednoj
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

library-duplicate-certain = Ovo je već u vašoj knjižnici.
library-duplicate-probable = Ovo je možda već u vašoj knjižnici.
library-duplicate-use = Upotrijebi ovu

## Duplicates in the library.

library-duplicates-title = Duplikati
library-duplicates-count = { $count ->
    [one] Čini se da je { $count } referenca u knjižnici više puta
    [few] Čini se da su { $count } reference u knjižnici više puta
   *[other] Čini se da je { $count } referenci u knjižnici više puta
}
library-duplicates-none = Nema duplikata
    .text = Čini se da nijedna referenca nije u knjižnici više puta.
library-duplicates-no-more = Nema više duplikata
    .text = Citati spojenih referenci sad citiraju one koje su zadržane.
library-duplicates-how = Kad se reference spoje u jednu, ona koju zadržite dobiva od ostalih što joj nedostaje, a gdje se razlikuju zadržava svoje. Njihove datoteke i zbirke skupljaju se zajedno, a što ih citira, citira zadržanu.
library-duplicates-same = Iste
library-duplicates-probably-same = Vjerojatno iste
library-duplicates-keep-which = Koju zadržati
library-duplicates-kept = Zadržana
library-duplicates-different = Različite su
library-duplicates-merge = Spoji ih u jednu
library-duplicates-merging = Spajanje…
library-duplicates-failed = Knjižnicu nije bilo moguće pretražiti za duplikate
library-duplicates-merge-failed = Nije ih bilo moguće spojiti

## Importing references: what a file holds, against what the library has.

library-import = Uvezi
library-import-title = Uvezi reference
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referenca u { $source }
    [few] { $count } reference u { $source }
   *[other] { $count } referenci u { $source }
}
library-import-review = { $count ->
    [one] { $count } referenca možda je već u vašoj knjižnici
    [few] { $count } reference možda su već u vašoj knjižnici
   *[other] { $count } referenci možda je već u vašoj knjižnici
}
library-import-new = { $count ->
    [one] { $count } nova referenca
    [few] { $count } nove reference
   *[other] { $count } novih referenci
}
library-import-complete = { $count ->
    [one] { $count } referenca koja je već u vašoj knjižnici dobiva podatke
    [few] { $count } reference koje su već u vašoj knjižnici dobivaju podatke
   *[other] { $count } referenci koje su već u vašoj knjižnici dobiva podatke
}
library-import-known = { $count ->
    [one] { $count } referenca već u vašoj knjižnici
    [few] { $count } reference već u vašoj knjižnici
   *[other] { $count } referenci već u vašoj knjižnici
}
library-import-repeated = { $count ->
    [one] { $count } referenca ponovljena unutar uvoza
    [few] { $count } reference ponovljene unutar uvoza
   *[other] { $count } referenci ponovljeno unutar uvoza
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Dobila bi: { $fields }
library-import-gains-file = Datoteka
library-import-gains-zotero = Njezin ključ u Zoteru
library-import-what-to-do = Što učiniti
library-import-merge = Isto djelo: dopuni moju
library-import-skip = Isto djelo: ostavi moju kakva jest
library-import-add = Drugo djelo: dodaj ga
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Za svu { $count } koja je ista:
    [few] Za sve { $count } koje su iste:
   *[other] Za svih { $count } koje su iste:
}
library-import-all-probable = { $count ->
    [one] Za svu { $count } koja je vjerojatno ista:
    [few] Za sve { $count } koje su vjerojatno iste:
   *[other] Za svih { $count } koje su vjerojatno iste:
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
library-import-counts = novo: { $add }{ $merge ->
        [0] {""}
       *[other] , dopuna: { $merge }
    }{ $skip ->
        [0] {""}
       *[other] , izostavljeno: { $skip }
    }
library-import-failed = Uvoz nije uspio.

## The library: the list of references, and what can be done with them.

library-references = Reference
library-unread = Knjižnicu nije bilo moguće pročitati
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
library-search = Pretraži knjižnicu
library-search-in = Pretraži u { $name }
library-search-clear = Očisti pretragu
library-sort = Razvrstaj
library-sort-author = Autor
library-sort-year = Godina
library-sort-title = Naslov
library-sort-added = Datum dodavanja
library-sort-modified = Datum izmjene
library-sort-descending = Silazno

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtar
library-filters-on = { $count ->
    [one] Filtar: { $count } uključen
    [few] Filtar: { $count } uključena
   *[other] Filtar: { $count } uključeno
}
library-filter-kind = Vrsta
library-filter-publisher = Nakladnik
library-filter-publisher-hint = Dio naziva
library-filter-any-publisher = Bilo koji nakladnik
library-filter-year = Godina
library-filter-from = Od
library-filter-to = Do
library-filter-clear = Očisti filtre
library-filter-nothing-here = Ovdje se nema što filtrirati.
# When the filters let nothing through.
library-nothing-passes = Nijedna referenca u prikazu ne prolazi filtre.
library-import-export = Uvoz i izvoz
library-import-file = Uvezi datoteku…
    .hint = BibLaTeX ili BibTeX
library-paste = Zalijepi reference…
library-add-pdfs = Dodaj PDF datoteke…
    .hint = Svaka se dohvaća i čuva
library-import-zotero = Uvezi iz Zotera…
library-find-duplicates = Pronađi duplikate…
library-map-library = Mapa knjižnice…
library-map-collection = Mapa zbirke „{ $name }”…
library-export-library = Izvezi knjižnicu…
library-export-collection = Izvezi „{ $name }”…
library-export-one = Izvezi…
library-export-many = { $count ->
    [one] Izvezi { $count } referencu…
    [few] Izvezi { $count } reference…
   *[other] Izvezi { $count } referenci…
}
library-export-title = Izvezi reference
# What a file of exported references is called, before it is given a name.
library-export-file-references = reference
library-export-file-library = knjiznica
library-exported = { $count ->
    [one] { $count } referenca izvezena
    [few] { $count } reference izvezene
   *[other] { $count } referenci izvezeno
}
library-export-failed = Izvoz nije uspio
library-empty = Vaša je knjižnica prazna
    .text = Reference koje ovdje dodate dostupne su u svim vašim projektima. Počnite s jednom, ili učitajte one koje već imate.
library-collection-empty = U ovoj zbirci još nema ničega
    .text = Povucite reference ovamo iz knjižnice, ili dodajte novu.
library-nothing-found = Ništa nije pronađeno
    .text = Nijedna referenca ne sadrži sve te riječi.
library-open-file = Otvori datoteku
library-file-open-failed = Datoteku nije bilo moguće otvoriti
library-add-to-collection = Dodaj u zbirku
library-remove-from = Ukloni iz „{ $name }”
library-copy-key = Kopiraj citatni ključ
library-copied-key = Kopirano „{ $key }”
library-copy-biblatex = Kopiraj kao BibLaTeX
library-copied = Kopirano
library-delete-one-title = Izbrisati „{ $name }”?
library-delete-many-title = { $count ->
    [one] Izbrisati { $count } referencu?
    [few] Izbrisati { $count } reference?
   *[other] Izbrisati { $count } referenci?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Ovo uklanja referencu iz vaše knjižnice, iz svake zbirke{ $files ->
        [0] {""}
        [one] , zajedno s { $files } priloženom datotekom
        [few] , zajedno s { $files } priložene datoteke
       *[other] , zajedno s { $files } priloženih datoteka
    }.{ $projects ->
        [0] {""}
        [1] {" "}Citirana je u jednom projektu, koji zadržava njezinu kopiju.
        [one] {" "}Citirana je u { $projects } projektu, koji zadržava njezinu kopiju.
        [few] {" "}Citirana je u { $projects } projekta, koji zadržavaju njezinu kopiju.
       *[other] {" "}Citirana je u { $projects } projekata, koji zadržavaju njezinu kopiju.
    }
library-delete-many = Ovo ih uklanja iz vaše knjižnice, iz svake zbirke{ $files ->
        [0] {""}
        [one] , zajedno s { $files } priloženom datotekom
        [few] , zajedno s { $files } priložene datoteke
       *[other] , zajedno s { $files } priloženih datoteka
    }.{ $projects ->
        [0] {""}
        [1] {" "}Projekt koji citira neke od njih zadržava njihove kopije.
        [one] {" "}{ $projects } projekt koji citira neke od njih zadržava njihove kopije.
        [few] {" "}{ $projects } projekta koji citiraju neke od njih zadržavaju njihove kopije.
       *[other] {" "}{ $projects } projekata koji citiraju neke od njih zadržava njihove kopije.
    }
library-delete-failed = Reference nije bilo moguće izbrisati
library-not-done = To nije bilo moguće učiniti

## Collections.

library-collections = Zbirke
# The projects that cite a work, in its pane.
library-cited-in = Citirano u
library-not-cited = Nije citirana ni u jednom projektu.
library-cited-reading = Čitanje projekata…
library-collections-hint = Zbirke skupljaju reference za neku temu ili neki rad. Referenca može biti u koliko god zbirki.
library-collection-new = Nova zbirka
library-collection-new-inside = Nova zbirka unutra
library-collection-new-under = Nova zbirka u „{ $name }”
library-collection-move-to = Premjesti u
library-collection-name = Naziv zbirke
library-collection-name-failed = Zbirku nije bilo moguće imenovati
library-collection-expand = Rasklopi
library-collection-collapse = Sklopi
library-collection-to-top = Premjesti na najvišu razinu
library-collection-move-failed = Zbirku nije bilo moguće premjestiti
library-collection-added = { $count ->
    [one] { $count } referenca dodana u „{ $name }”
    [few] { $count } reference dodane u „{ $name }”
   *[other] { $count } referenci dodano u „{ $name }”
}
library-collection-already = Već u „{ $name }”
library-collection-delete = Izbriši zbirku
library-collection-delete-title = Izbrisati zbirku „{ $name }”?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Reference ostaju u vašoj knjižnici.
   *[other] Brišu se i zbirke unutar nje. Reference ostaju u vašoj knjižnici.
}
library-collection-delete-failed = Zbirku nije bilo moguće izbrisati
library-collection-count = { $count ->
    [one] { $count } zbirka
    [few] { $count } zbirke
   *[other] { $count } zbirki
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Mapa knjižnice
library-map-title-collection = Mapa zbirke
# The name a project made of the whole library is given.
library-map-library-name = Knjižnica
library-map-name = Naziv
library-map-name-hint = Naziv projekta, njegove mape i elementa u središtu mape.
library-map-what-library = Zbirke postaju elementi, ugniježđeni kako jesu, a svaka referenca element ispod svoje zbirke, s citatom kao tekstom. Reference koje nisu ni u jednoj zbirci stoje u središtu.
library-map-what-collection = Zbirke unutar nje postaju elementi, ugniježđeni kako jesu, a svaka referenca element ispod svoje zbirke, s citatom kao tekstom.
library-map-nothing = Nema referenci koje bi se stavile na mapu.
library-map-make = Načini projekt
library-map-making = Izrada projekta…
library-map-failed = Projekt nije bilo moguće načiniti.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } datoteka
    [few] { $count } datoteke
   *[other] { $count } datoteka
}
library-open-failed = Referencu nije bilo moguće otvoriti
library-known = { $count ->
    [one] Već je u vašoj knjižnici
    [few] Već su u vašoj knjižnici
   *[other] Već su u vašoj knjižnici
}
library-nothing-to-import = Nema se što uvesti
library-none-found = Nijedna referenca nije pronađena.
library-import-kinds = Reference se čitaju iz .bib datoteka i izrađuju iz PDF datoteka.
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
    [1] Utvrđivanje što je datoteka…
    [one] Utvrđivanje što je { $count } datoteka…
    [few] Utvrđivanje što su { $count } datoteke…
   *[other] Utvrđivanje što je { $count } datoteka…
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
library-imported-skipped = { $count } već u knjižnici
library-imported-files = { $count ->
    [one] { $count } datoteka pohranjena
    [few] { $count } datoteke pohranjene
   *[other] { $count } datoteka pohranjeno
}
library-imported-nothing = Ništa nije promijenjeno
library-paste-title = Zalijepi reference
library-paste-subtitle = BibLaTeX ili BibTeX, koliko god unosa želite
library-paste-continue = Nastavi
library-source-label = BibLaTeX izvor

## Importing from Zotero.

library-zotero-title = Uvezi iz Zotera
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Na ovom računalu nije pronađen Zotero na mjestima gdje obično drži svoje podatke. Ako ih drži drugdje, pokažite gdje: direktorij koji sadrži { $file }.
library-zotero-lead = Što se uveze kopira se u vašu knjižnicu, s datotekama. Zotero se samo čita i ništa se u njemu ne mijenja; može u međuvremenu biti pokrenut.
library-zotero-choose = Zoterov direktorij s podacima
library-zotero-none-there = Ondje nema Zotera.
library-zotero-unread = Zotero nije bilo moguće pročitati.
library-zotero-library = Knjižnica
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Moja knjižnica
library-zotero-what = Što uvesti
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
library-dialog-back = Natrag na obrazac
library-dialog-open-failed = Referencu nije bilo moguće otvoriti.
library-dialog-save-failed = Referencu nije bilo moguće spremiti.
# The entry as BibLaTeX, as against the form.
library-source = Izvor
library-source-unread = Izvor nije bilo moguće pročitati.

## A reference, beside the list.

library-pane-label = Referenca
library-pane-more = Više
library-pane-saved = Spremljeno
library-pane-editing = Uređivanje…
library-pane-not-saved = Nije spremljeno
library-pane-unread = Referencu nije bilo moguće pročitati.
library-pane-save-failed = Izmjene nije bilo moguće spremiti.
library-pane-note-placeholder = Što o njemu mislite. Za vas: nije dio onoga što se citira.
library-pane-files = Datoteke
library-pane-attach = Priloži
library-pane-attach-title = Priloži datoteke
library-pane-attach-failed = Datoteku nije bilo moguće priložiti
# Of a file that is attached, and not where it should be.
library-pane-missing = nedostaje
library-pane-reveal = Prikaži u upravitelju datoteka
library-pane-reveal-failed = Direktorij nije bilo moguće otvoriti
library-pane-no-files = Nema datoteka. Priložite PDF, ili ga ispustite ovdje.
library-pane-detach = Ukloni datoteku
library-pane-detach-title = Ukloniti „{ $name }”?
library-pane-detach-message = Datoteka se briše iz spremišta knjižnice, osim ako je koristi druga referenca.
library-pane-detach-failed = Datoteku nije bilo moguće ukloniti
library-pane-leave-collection = Ukloni iz { $name }
library-pane-duplicate = Udvostruči
    .hint = Nova referenca koja počinje ovim podacima
library-pane-edit-source = Uredi izvor…
library-pane-source-subtitle = Unos kao BibLaTeX. Većina je stvari lakša u obrascu.
library-pane-source-failed = Izvor nije bilo moguće prikazati
library-pane-added = Dodano { $date }
library-pane-added-changed = Dodano { $added } · izmijenjeno { $changed }

## Looking up a reference.

library-lookup-placeholder = Dohvatite je: DOI, ISBN ili riječi iz naslova i autor
library-lookup-label = Dohvati referencu
library-lookup-failed = Ništa nije bilo moguće dohvatiti.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Ispunjeno iz izvora { $source }.
library-lookup-others = { $count ->
    [one] { $count } drugi zapis
    [few] { $count } druga zapisa
   *[other] { $count } drugih zapisa
}
library-lookup-scope = Što tražiti
library-lookup-any = Bilo što
library-lookup-books = Knjige
library-lookup-articles = Članci
library-lookup-none = Ništa nije pronađeno. Manje riječi može naći više: prezime autora i riječ-dvije iz naslova.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = O ovom { $kind ->
        [doi] DOI-ju
        [isbn] ISBN-u
        [arxiv] broju arXiva
       *[pmid] broju PubMeda
    } ništa se ne zna ondje gdje je pitano. Referenca se može unijeti ručno dolje.

## What the writer writes about a work.

library-notes = Bilješke
library-notes-yours = Vaše bilješke
library-notes-on-work = Vaše bilješke o ovom djelu
library-notes-read = Pročitajte svoje bilješke
library-notes-write = Napiši bilješku
library-notes-write-on-work = Napiši bilješku o ovom djelu
library-notes-not-in-library = Referenca koje nema u vašoj knjižnici
library-notes-this-project = U ovom projektu
library-notes-all-projects = U svim projektima
library-notes-project-placeholder = Što o njemu mislite, za ovaj rad
library-notes-all-placeholder = Što o njemu mislite, gdje god ga citirali
library-notes-keep-for-all = Čuvaj za sve projekte
library-notes-write-for-all = Piši za sve projekte
library-notes-carried = Referenca je došla s projektom i nije u vašoj knjižnici. Što je ovdje napisano imaju svi koji imaju projekt.
library-notes-kept = Čuva se uz referencu u vašoj knjižnici. Ide uz projekt koji citira djelo.
library-notes-unread = Vaše bilješke nije bilo moguće pročitati
library-notes-unsaved = Vašu bilješku nije bilo moguće sačuvati
