# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Mykje brukte
library-form-add-field = Legg til felt
library-form-citation-key = Referansenøkkel
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = blir laga av forfattar og år
library-form-date-problem = Skriv ein dato som 1979, 1979-05 eller 1979-05-12, og eit tidsrom som 1979/1985.
library-form-remove-field = Fjern { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institusjon eller anna namn som blir halde samla
library-names-prefix-suffix = Forledd og etterledd
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Flytt opp
library-names-move-down = Flytt ned
library-names-more = Meir for dette namnet
library-names-name = Namn
library-names-name-of = { $role }: namn
library-names-family = Etternamn
library-names-family-of = { $role }: etternamn
library-names-given = Førenamn
library-names-given-of = { $role }: førenamn
library-names-prefix = Forledd: van, de la
library-names-prefix-of = { $role }: forledd
library-names-suffix = Etterledd: Jr., III
library-names-suffix-of = { $role }: etterledd

## Words for references, wherever they are shown.

library-untitled = Utan tittel
library-no-author = Ingen forfattar
library-no-title = Ingen tittel
library-in-library = I biblioteket ditt

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = same DOI
library-reason-isbn = same ISBN
library-reason-identical = like i alt som skil eitt verk frå eit anna
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] same tittel, forfattar og år
            [like] same tittel og forfattar, eitt år frå kvarandre
           *[none] same tittel og forfattar, år berre på den eine
        }
        [like] { $year ->
            [same] same tittel og år, og ein felles forfattar
            [like] same tittel, ein felles forfattar, eitt år frå kvarandre
           *[none] same tittel, ein felles forfattar, år berre på den eine
        }
       *[none] { $year ->
            [same] same tittel og år, forfattar berre på den eine
            [like] same tittel, eitt år frå kvarandre, forfattar berre på den eine
           *[none] same tittel, forfattar og år berre på den eine
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] same forfattar og år, og ein liknande tittel
            [like] same forfattar, ein liknande tittel, eitt år frå kvarandre
           *[none] same forfattar, ein liknande tittel, år berre på den eine
        }
        [like] { $year ->
            [same] same år, ein liknande tittel, ein felles forfattar
            [like] ein liknande tittel, ein felles forfattar, eitt år frå kvarandre
           *[none] ein liknande tittel, ein felles forfattar, år berre på den eine
        }
       *[none] { $year ->
            [same] same år, ein liknande tittel, forfattar berre på den eine
            [like] ein liknande tittel, eitt år frå kvarandre, forfattar berre på den eine
           *[none] ein liknande tittel, forfattar og år berre på den eine
        }
    }
}
library-reason-file = same fil
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } og { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Denne er allereie i biblioteket ditt.
library-duplicate-probable = Denne kan allereie vere i biblioteket ditt.
library-duplicate-use = Bruk denne

## Duplicates in the library.

library-duplicates-title = Duplikat
library-duplicates-count = { $count ->
    [one] { $count } referanse ser ut til å vere i biblioteket meir enn éin gong
   *[other] { $count } referansar ser ut til å vere i biblioteket meir enn éin gong
}
library-duplicates-none = Ingen duplikat
    .text = Ingen referanse ser ut til å vere i biblioteket meir enn éin gong.
library-duplicates-no-more = Ingen fleire duplikat
    .text = Tilvisingar til referansane som vart slegne saman med andre, viser no til dei som vart verande.
library-duplicates-how = Når referansar blir slegne saman, får den du vel å ha, det den manglar frå dei andre, og held på sitt eige der dei er ulike. Filene og samlingane deira blir førte saman, og det som viser til dei, viser til den som blir verande.
library-duplicates-same = Same verk
library-duplicates-probably-same = Truleg same verk
library-duplicates-keep-which = Den som skal bli verande
library-duplicates-kept = Blir verande
library-duplicates-different = Dei er ulike
library-duplicates-merge = Slå dei saman
library-duplicates-merging = Slår dei saman …
library-duplicates-failed = Det gjekk ikkje å leite etter duplikat i biblioteket
library-duplicates-merge-failed = Dei kunne ikkje slåast saman

## Importing references: what a file holds, against what the library has.

library-import = Importer
library-import-title = Importer referansar
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referanse i { $source }
   *[other] { $count } referansar i { $source }
}
library-import-review = { $count ->
    [one] { $count } referanse kan allereie vere i biblioteket ditt
   *[other] { $count } referansar kan allereie vere i biblioteket ditt
}
library-import-new = { $count ->
    [one] { $count } ny referanse
   *[other] { $count } nye referansar
}
library-import-complete = { $count ->
    [one] { $count } referanse som allereie er i biblioteket ditt, får fleire opplysningar
   *[other] { $count } referansar som allereie er i biblioteket ditt, får fleire opplysningar
}
library-import-known = { $count ->
    [one] { $count } referanse som allereie er i biblioteket ditt
   *[other] { $count } referansar som allereie er i biblioteket ditt
}
library-import-repeated = { $count ->
    [one] { $count } referanse som blir gjenteken i importen
   *[other] { $count } referansar som blir gjentekne i importen
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Vil få: { $fields }
library-import-gains-file = Fil
library-import-gains-zotero = Nøkkelen i Zotero
library-import-what-to-do = Kva som skal gjerast
library-import-merge = Same verk: fullfør det eg har
library-import-skip = Same verk: la mitt vere som det er
library-import-add = Eit anna verk: legg det til
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = For alle { $count } som er dei same:
library-import-all-probable = For alle { $count } som truleg er dei same:
library-import-all-merge = Fullfør dei eg har
library-import-all-skip = La mine vere som dei er
library-import-all-add = Legg dei til likevel
library-import-more = … og { $count } til.
library-import-unread = { $count ->
    [one] { $count } del av fila kunne ikkje lesast
   *[other] { $count } delar av fila kunne ikkje lesast
}
library-import-importing = Importerer …
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } å leggje til{ $merge ->
        [0] {""}
       *[other] , { $merge } å fullføre
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } hoppa over
    }
library-import-failed = Importen mislukkast.

## The library: the list of references, and what can be done with them.

library-references = Referansar
library-unread = Biblioteket kunne ikkje lesast
library-all-references = Alle referansar
library-count = { $count ->
    [one] { $count } referanse
   *[other] { $count } referansar
}
library-selected = { $count ->
    [one] { $count } referanse valt
   *[other] { $count } referansar valt
}
library-selected-of = { $count ->
    [one] { $selected } av { $count } referanse valt
   *[other] { $selected } av { $count } referansar valt
}
library-new-reference = Ny referanse
library-search = Søk i biblioteket
library-search-in = Søk i { $name }
library-search-clear = Tøm søket
library-sort = Sorter
library-sort-author = Forfattar
library-sort-year = År
library-sort-title = Tittel
library-sort-added = Dato lagd til
library-sort-modified = Dato endra
library-sort-descending = Fallande

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtrer
library-filters-on = { $count ->
    [one] Filter: { $count } på
   *[other] Filter: { $count } på
}
library-filter-kind = Type
library-filter-publisher = Utgjevar
library-filter-publisher-hint = Ein del av namnet
library-filter-any-publisher = Alle utgjevarar
library-filter-year = År
library-filter-from = Frå
library-filter-to = Til
library-filter-clear = Fjern filtera
library-filter-nothing-here = Ingenting å filtrere her.
# When the filters let nothing through.
library-nothing-passes = Ingen referanse i oversikta slepp gjennom filtera.
library-import-export = Importer og eksporter
library-import-file = Importer ei fil …
    .hint = BibLaTeX eller BibTeX
library-paste = Lim inn referansar …
library-add-pdfs = Legg til PDF-filer …
    .hint = Kvar av dei blir slått opp og teken vare på
library-import-zotero = Importer frå Zotero …
library-find-duplicates = Finn duplikat …
library-map-library = Eit kart over biblioteket …
library-map-collection = Eit kart over «{ $name }» …
library-export-library = Eksporter biblioteket …
library-export-collection = Eksporter «{ $name }» …
library-export-one = Eksporter …
library-export-many = { $count ->
    [one] Eksporter { $count } referanse …
   *[other] Eksporter { $count } referansar …
}
library-export-title = Eksporter referansar
# What a file of exported references is called, before it is given a name.
library-export-file-references = referansar
library-export-file-library = bibliotek
library-exported = { $count ->
    [one] { $count } referanse eksportert
   *[other] { $count } referansar eksporterte
}
library-export-failed = Eksporten mislukkast
library-empty = Biblioteket ditt er tomt
    .text = Referansar du legg til her, kan brukast i alle prosjekta dine. Byrj med éin, eller hent inn dei du alt har.
library-collection-empty = Ingenting i denne samlinga enno
    .text = Dra referansar hit frå biblioteket, eller legg til ein ny.
library-nothing-found = Ingenting funne
    .text = Ingen referanse har alle desse orda.
library-open-file = Opne fila
library-file-open-failed = Fila kunne ikkje opnast
library-add-to-collection = Legg til i samling
library-remove-from = Fjern frå «{ $name }»
library-copy-key = Kopier referansenøkkelen
library-copied-key = Kopierte «{ $key }»
library-copy-biblatex = Kopier som BibLaTeX
library-copied = Kopiert
library-delete-one-title = Slette «{ $name }»?
library-delete-many-title = { $count ->
    [one] Slette { $count } referanse?
   *[other] Slette { $count } referansar?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Referansen blir fjerna frå biblioteket ditt og frå alle samlingar{ $files ->
        [0] {""}
        [one] , saman med { $files } vedlegg
       *[other] , saman med { $files } vedlegg
    }.{ $projects ->
        [0] {""}
        [one] {" "}Den er sitert i eit prosjekt, som har ein kopi av den.
       *[other] {" "}Den er sitert i { $projects } prosjekt, som har ein kopi av den.
    }
library-delete-many = Referansane blir fjerna frå biblioteket ditt og frå alle samlingar{ $files ->
        [0] {""}
        [one] , saman med { $files } vedlegg
       *[other] , saman med { $files } vedlegg
    }.{ $projects ->
        [0] {""}
        [one] {" "}Eit prosjekt som siterer nokre av dei, har ein kopi av desse.
       *[other] {" "}{ $projects } prosjekt som siterer nokre av dei, har ein kopi av desse.
    }
library-delete-failed = Referansane kunne ikkje slettast
library-not-done = Det lét seg ikkje gjere

## Collections.

library-collections = Samlingar
# The projects that cite a work, in its pane.
library-cited-in = Sitert i
library-not-cited = Ikkje sitert i noko prosjekt.
library-cited-reading = Les prosjekta …
library-collections-hint = Ei samling held referansar til eit emne eller eit arbeid. Ein referanse kan vere med i så mange samlingar du vil.
library-collection-new = Ny samling
library-collection-new-inside = Ny samling inni
library-collection-new-under = Ny samling i «{ $name }»
library-collection-move-to = Flytt til
library-collection-name = Namn på samlinga
library-collection-name-failed = Samlinga kunne ikkje få namn
library-collection-expand = Brett ut
library-collection-collapse = Brett saman
library-collection-to-top = Flytt til øvste nivå
library-collection-move-failed = Samlinga kunne ikkje flyttast
library-collection-added = { $count ->
    [one] { $count } referanse lagd til i «{ $name }»
   *[other] { $count } referansar lagde til i «{ $name }»
}
library-collection-already = Allereie i «{ $name }»
library-collection-delete = Slett samlinga
library-collection-delete-title = Slette samlinga «{ $name }»?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Referansane blir verande i biblioteket ditt.
   *[other] Samlingane inni den blir òg sletta. Referansane blir verande i biblioteket ditt.
}
library-collection-delete-failed = Samlinga kunne ikkje slettast
library-collection-count = { $count ->
    [one] { $count } samling
   *[other] { $count } samlingar
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Eit kart over biblioteket
library-map-title-collection = Eit kart over ei samling
# The name a project made of the whole library is given.
library-map-library-name = Biblioteket
library-map-name = Namn
library-map-name-hint = Namnet på prosjektet, på kartet i det, og på elementet i midten av kartet.
library-map-what-library = Samlingane blir element, ordna slik dei er, og kvar referanse eit element under samlinga si, med ei tilvising til den som tekst. Referansar som ikkje er i noka samling, står i midten.
library-map-what-collection = Samlingane i den blir element, ordna slik dei er, og kvar referanse eit element under samlinga si, med ei tilvising til den som tekst.
library-map-nothing = Det er ingen referansar å setje på kartet.
library-map-make = Lag prosjektet
library-map-making = Lagar prosjektet …
library-map-failed = Prosjektet kunne ikkje lagast.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
library-open-failed = Referansen kunne ikkje opnast
library-known = { $count ->
    [one] Den er allereie i biblioteket ditt
   *[other] Dei er allereie i biblioteket ditt
}
library-nothing-to-import = Ingenting å importere
library-none-found = Ingen referansar vart funne.
library-import-kinds = Referansar blir lesne frå .bib-filer og laga av PDF-filer.
library-filter-bib = BibLaTeX og BibTeX
library-filter-all = Alle filer
library-files-read-failed = { $count ->
    [one] Fila kunne ikkje lesast
   *[other] Filene kunne ikkje lesast
}
library-text-read-failed = Teksten kunne ikkje lesast
library-add-pdfs-title = Legg til PDF-filer
library-pdfs-working = { $count ->
    [one] Finn ut kva fila er …
   *[other] Finn ut kva { $count } filer er …
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } av { $count }: { $name }
library-stop = Stopp
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referanse lagd til
   *[other] { $count } referansar lagde til
}
library-imported-completed = { $count } fekk fleire opplysningar
library-imported-skipped = { $count } allereie i biblioteket
library-imported-files = { $count ->
    [one] { $count } fil lagra
   *[other] { $count } filer lagra
}
library-imported-nothing = Ingenting vart endra
library-paste-title = Lim inn referansar
library-paste-subtitle = BibLaTeX eller BibTeX, så mange oppføringar du vil
library-paste-continue = Hald fram
library-source-label = BibLaTeX-kode

## Importing from Zotero.

library-zotero-title = Importer frå Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Fann ingen Zotero på denne datamaskina der programmet vanlegvis har dataa sine. Har det dei ein annan stad, så vis kvar: mappa med { $file }.
library-zotero-lead = Det som blir importert, blir kopiert inn i biblioteket ditt, med filene sine. Zotero blir berre lese, og ingenting der blir endra; programmet kan gjerne vere i gang imens.
library-zotero-choose = Datamappa til Zotero
library-zotero-none-there = Det er ingen Zotero der.
library-zotero-unread = Zotero kunne ikkje lesast.
library-zotero-library = Bibliotek
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Mitt bibliotek
library-zotero-what = Kva som skal importerast
library-zotero-everything = Alt
library-zotero-with-files = Med filene som er vedlagde
library-zotero-with-notes = Med notata, som annotasjonar
library-zotero-elsewhere = Ein annan stad …
library-zotero-show-where = Vis kvar …
library-zotero-reading = Les …
library-zotero-read = { $count ->
    [0] Les
    [one] Les { $count } referanse
   *[other] Les { $count } referansar
}

## Writing a reference.

library-dialog-edit = Rediger referanse
library-dialog-add = Legg til referanse
library-dialog-back = Tilbake til skjemaet
library-dialog-open-failed = Referansen kunne ikkje opnast.
library-dialog-save-failed = Referansen kunne ikkje lagrast.
# The entry as BibLaTeX, as against the form.
library-source = Kjeldekode
library-source-unread = Kjeldekoden kunne ikkje lesast.

## A reference, beside the list.

library-pane-label = Referanse
library-pane-more = Meir
library-pane-saved = Lagra
library-pane-editing = Redigerer …
library-pane-not-saved = Ikkje lagra
library-pane-unread = Referansen kunne ikkje lesast.
library-pane-save-failed = Endringane kunne ikkje lagrast.
library-pane-note-placeholder = Det du tenkjer om verket. For deg sjølv: det høyrer ikkje med når det blir vist til.
library-pane-files = Filer
library-pane-attach = Legg ved
library-pane-attach-title = Legg ved filer
library-pane-attach-failed = Fila kunne ikkje leggjast ved
# Of a file that is attached, and not where it should be.
library-pane-missing = manglar
library-pane-reveal = Vis i filhandsamaren
library-pane-reveal-failed = Mappa kunne ikkje opnast
library-pane-no-files = Ingen filer. Legg ved ein PDF, eller slepp ein her.
library-pane-detach = Fjern fila
library-pane-detach-title = Fjerne «{ $name }»?
library-pane-detach-message = Fila blir sletta frå lageret til biblioteket, med mindre ein annan referanse bruker den.
library-pane-detach-failed = Fila kunne ikkje fjernast
library-pane-leave-collection = Fjern frå { $name }
library-pane-duplicate = Dupliser
    .hint = Ein ny referanse som byrjar med desse opplysningane
library-pane-edit-source = Rediger kjeldekoden …
library-pane-source-subtitle = Referansen som BibLaTeX. Det meste er lettare i skjemaet.
library-pane-source-failed = Kjeldekoden kunne ikkje visast
library-pane-added = Lagd til { $date }
library-pane-added-changed = Lagd til { $added } · endra { $changed }

## Looking up a reference.

library-lookup-placeholder = Slå den opp: ein DOI, eit ISBN eller ord frå tittelen og forfattaren
library-lookup-label = Slå opp ein referanse
library-lookup-failed = Ingenting kunne slåast opp.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Fylt ut frå { $source }.
library-lookup-others = { $count ->
    [one] { $count } annan post
   *[other] { $count } andre postar
}
library-lookup-scope = Kva du leitar etter
library-lookup-any = Alt
library-lookup-books = Bøker
library-lookup-articles = Artiklar
library-lookup-none = Ingenting vart funne. Færre ord kan finne meir: etternamnet til forfattaren og eit ord eller to frå tittelen.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Ingenting er kjent om { $kind ->
        [doi] denne DOI-en
        [isbn] dette ISBN-et
        [arxiv] dette arXiv-nummeret
       *[pmid] dette PubMed-nummeret
    } der det vart spurt. Referansen kan skrivast inn for hand nedanfor.

## What the writer writes about a work.

library-notes = Notat
library-notes-yours = Notata dine
library-notes-on-work = Notata dine om dette verket
library-notes-read = Les notata dine
library-notes-write = Skriv eit notat
library-notes-write-on-work = Skriv eit notat om dette verket
library-notes-not-in-library = Ein referanse som ikkje er i biblioteket ditt
library-notes-this-project = I dette prosjektet
library-notes-all-projects = I alle prosjekt
library-notes-project-placeholder = Det du tenkjer om verket, i dette arbeidet
library-notes-all-placeholder = Det du tenkjer om verket, kvar du enn viser til det
library-notes-keep-for-all = Bruk det i alle prosjekt
library-notes-write-for-all = Skriv for alle prosjekt
library-notes-carried = Referansen følgde med prosjektet og er ikkje i biblioteket ditt. Det som blir skrive her, følgjer med til alle som har prosjektet.
library-notes-kept = Blir lagra med referansen i biblioteket ditt. Det følgjer med eit prosjekt som viser til verket.
library-notes-unread = Notata dine kunne ikkje lesast
library-notes-unsaved = Notatet ditt kunne ikkje lagrast
