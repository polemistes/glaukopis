# Biblioteket: referansene, skjemaet de skrives i, og det som henter dem
# inn, på bokmål. Feltene og typene i skjemaet står i fields.ftl.
# Se locales/README.md.

## Skjemaet for en referanse.

library-form-often-used = Mye brukt
library-form-add-field = Legg til felt
library-form-citation-key = Referansenøkkel
library-form-key-made = lages av forfatter og år
library-form-date-problem = Skriv en dato som 1979, 1979-05 eller 1979-05-12, og et tidsrom som 1979/1985.
library-form-remove-field = Fjern { $field }

## Personene i en referanse, med navnet på feltet sitt: «Forfatter: etternavn».

library-names-kept-whole = Institusjon eller annet navn som holdes samlet
library-names-prefix-suffix = Forledd og etterledd
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Flytt opp
library-names-move-down = Flytt ned
library-names-more = Mer for dette navnet
library-names-name = Navn
library-names-name-of = { $role }: navn
library-names-family = Etternavn
library-names-family-of = { $role }: etternavn
library-names-given = Fornavn
library-names-given-of = { $role }: fornavn
library-names-prefix = Forledd: van, de la
library-names-prefix-of = { $role }: forledd
library-names-suffix = Etterledd: Jr., III
library-names-suffix-of = { $role }: etterledd

## Ord om referanser, hvor de enn vises.

library-untitled = Uten tittel
library-no-author = Ingen forfatter
library-no-title = Ingen tittel
library-in-library = I biblioteket ditt

## Hvorfor en referanse tas for en annen: «samme DOI og samme fil».

library-reason-doi = samme DOI
library-reason-isbn = samme ISBN
library-reason-identical = like i alt som skiller ett verk fra et annet
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] samme tittel, forfatter og år
            [like] samme tittel og forfatter, ett år fra hverandre
           *[none] samme tittel og forfatter, år bare på den ene
        }
        [like] { $year ->
            [same] samme tittel og år, og en felles forfatter
            [like] samme tittel, en felles forfatter, ett år fra hverandre
           *[none] samme tittel, en felles forfatter, år bare på den ene
        }
       *[none] { $year ->
            [same] samme tittel og år, forfatter bare på den ene
            [like] samme tittel, ett år fra hverandre, forfatter bare på den ene
           *[none] samme tittel, forfatter og år bare på den ene
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] samme forfatter og år, og en tittel som ligner
            [like] samme forfatter, en tittel som ligner, ett år fra hverandre
           *[none] samme forfatter, en tittel som ligner, år bare på den ene
        }
        [like] { $year ->
            [same] samme år, en tittel som ligner, en felles forfatter
            [like] en tittel som ligner, en felles forfatter, ett år fra hverandre
           *[none] en tittel som ligner, en felles forfatter, år bare på den ene
        }
       *[none] { $year ->
            [same] samme år, en tittel som ligner, forfatter bare på den ene
            [like] en tittel som ligner, ett år fra hverandre, forfatter bare på den ene
           *[none] en tittel som ligner, forfatter og år bare på den ene
        }
    }
}
library-reason-file = samme fil
library-reasons = { $others } og { $last }

## Størrelsen på en fil.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## Det som kanskje alt er i biblioteket, mens en referanse skrives.

library-duplicate-certain = Denne er allerede i biblioteket ditt.
library-duplicate-probable = Denne kan allerede være i biblioteket ditt.
library-duplicate-use = Bruk denne

## Duplikater i biblioteket.

library-duplicates-title = Duplikater
library-duplicates-count = { $count ->
    [one] { $count } referanse ser ut til å være i biblioteket mer enn én gang
   *[other] { $count } referanser ser ut til å være i biblioteket mer enn én gang
}
library-duplicates-none = Ingen duplikater
    .text = Ingen referanse ser ut til å være i biblioteket mer enn én gang.
library-duplicates-no-more = Ingen flere duplikater
    .text = Henvisninger til referansene som ble tatt opp i andre, viser nå til dem som ble beholdt.
library-duplicates-how = Når referanser slås sammen, får den du beholder, det den mangler fra de andre, og holder på sitt eget der de er ulike. Filene og samlingene deres føres sammen, og det som viser til dem, viser til den som beholdes.
library-duplicates-same = Samme verk
library-duplicates-probably-same = Trolig samme verk
library-duplicates-keep-which = Den som skal beholdes
library-duplicates-kept = Beholdes
library-duplicates-different = De er ulike
library-duplicates-merge = Slå dem sammen
library-duplicates-merging = Slår dem sammen …
library-duplicates-failed = Det gikk ikke å lete etter duplikater i biblioteket
library-duplicates-merge-failed = De kunne ikke slås sammen

## Import av referanser: det en fil har, mot det biblioteket har.

library-import = Importer
library-import-title = Importer referanser
library-import-subtitle = { $count ->
    [one] { $count } referanse i { $source }
   *[other] { $count } referanser i { $source }
}
library-import-review = { $count ->
    [one] { $count } referanse kan allerede være i biblioteket ditt
   *[other] { $count } referanser kan allerede være i biblioteket ditt
}
library-import-new = { $count ->
    [one] { $count } ny referanse
   *[other] { $count } nye referanser
}
library-import-complete = { $count ->
    [one] { $count } referanse som allerede er i biblioteket ditt, får flere opplysninger
   *[other] { $count } referanser som allerede er i biblioteket ditt, får flere opplysninger
}
library-import-known = { $count ->
    [one] { $count } referanse som allerede er i biblioteket ditt
   *[other] { $count } referanser som allerede er i biblioteket ditt
}
library-import-repeated = { $count ->
    [one] { $count } referanse som gjentas i importen
   *[other] { $count } referanser som gjentas i importen
}
library-import-would-gain = Vil få: { $fields }
library-import-gains-file = Fil
library-import-gains-zotero = Nøkkelen i Zotero
library-import-what-to-do = Hva som skal gjøres
library-import-merge = Samme verk: fullfør det jeg har
library-import-skip = Samme verk: la mitt være som det er
library-import-add = Et annet verk: legg det til
library-import-all-certain = For alle { $count } som er de samme:
library-import-all-probable = For alle { $count } som trolig er de samme:
library-import-all-merge = Fullfør dem jeg har
library-import-all-skip = La mine være som de er
library-import-all-add = Legg dem til likevel
library-import-more = … og { $count } til.
library-import-unread = { $count ->
    [one] { $count } del av filen kunne ikke leses
   *[other] { $count } deler av filen kunne ikke leses
}
library-import-importing = Importerer …
library-import-counts = { $add } legges til{ $merge ->
        [0] {""}
       *[other] , { $merge } fullføres
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } utelates
    }
library-import-failed = Importen mislyktes.

## Biblioteket: listen over referanser, og det som kan gjøres med dem.

library-references = Referanser
library-unread = Biblioteket kunne ikke leses
library-all-references = Alle referanser
library-count = { $count ->
    [one] { $count } referanse
   *[other] { $count } referanser
}
library-selected = { $count ->
    [one] { $count } referanse valgt
   *[other] { $count } referanser valgt
}
library-selected-of = { $count ->
    [one] { $selected } av { $count } referanse valgt
   *[other] { $selected } av { $count } referanser valgt
}
library-new-reference = Ny referanse
library-search = Søk i biblioteket
library-search-in = Søk i { $name }
library-search-clear = Tøm søket
library-sort = Sorter
library-sort-author = Forfatter
library-sort-year = År
library-sort-title = Tittel
library-sort-added = Dato lagt til
library-sort-modified = Dato endret
library-sort-descending = Synkende

## Filtrene, ved siden av søket: hva slags publikasjon, hvem som ga den ut, og når.

library-filters = Filtrer
library-filters-on = { $count ->
    [one] Filter: { $count } på
   *[other] Filter: { $count } på
}
library-filter-kind = Slag
library-filter-publisher = Utgiver
library-filter-publisher-hint = En del av navnet
library-filter-any-publisher = Alle utgivere
library-filter-year = År
library-filter-from = Fra
library-filter-to = Til
library-filter-clear = Fjern filtrene
library-filter-nothing-here = Ingenting å filtrere her.
library-nothing-passes = Ingen referanse i oversikten slipper gjennom filtrene.
library-import-export = Importer og eksporter
library-import-file = Importer en fil …
    .hint = BibLaTeX eller BibTeX
library-paste = Lim inn referanser …
library-add-pdfs = Legg til PDF-filer …
    .hint = Hver av dem slås opp og tas vare på
library-import-zotero = Importer fra Zotero …
library-find-duplicates = Finn duplikater …
library-map-library = Et kart over biblioteket …
library-map-collection = Et kart over «{ $name }» …
library-export-library = Eksporter biblioteket …
library-export-collection = Eksporter «{ $name }» …
library-export-one = Eksporter …
library-export-many = { $count ->
    [one] Eksporter { $count } referanse …
   *[other] Eksporter { $count } referanser …
}
library-export-title = Eksporter referanser
library-export-file-references = referanser
library-export-file-library = bibliotek
library-exported = { $count ->
    [one] { $count } referanse eksportert
   *[other] { $count } referanser eksportert
}
library-export-failed = Eksporten mislyktes
library-empty = Biblioteket ditt er tomt
    .text = Referanser du legger til her, kan brukes i alle prosjektene dine. Begynn med én, eller hent inn dem du allerede har.
library-collection-empty = Ingenting i denne samlingen ennå
    .text = Dra referanser hit fra biblioteket, eller legg til en ny.
library-nothing-found = Ingenting funnet
    .text = Ingen referanse har alle disse ordene.
library-open-file = Åpne filen
library-file-open-failed = Filen kunne ikke åpnes
library-add-to-collection = Legg til i samling
library-remove-from = Fjern fra «{ $name }»
library-copy-key = Kopier referansenøkkelen
library-copied-key = Kopierte «{ $key }»
library-copy-biblatex = Kopier som BibLaTeX
library-copied = Kopiert
library-delete-one-title = Slette «{ $name }»?
library-delete-many-title = { $count ->
    [one] Slette { $count } referanse?
   *[other] Slette { $count } referanser?
}
library-delete-one = Referansen fjernes fra biblioteket ditt og fra alle samlinger{ $files ->
        [0] {""}
        [one] , sammen med { $files } vedlegg
       *[other] , sammen med { $files } vedlegg
    }.{ $projects ->
        [0] {""}
        [one] {" "}Den er sitert i et prosjekt, som har en kopi av den.
       *[other] {" "}Den er sitert i { $projects } prosjekter, som har en kopi av den.
    }
library-delete-many = Referansene fjernes fra biblioteket ditt og fra alle samlinger{ $files ->
        [0] {""}
        [one] , sammen med { $files } vedlegg
       *[other] , sammen med { $files } vedlegg
    }.{ $projects ->
        [0] {""}
        [one] {" "}Et prosjekt som siterer noen av dem, har en kopi av disse.
       *[other] {" "}{ $projects } prosjekter som siterer noen av dem, har en kopi av disse.
    }
library-delete-failed = Referansene kunne ikke slettes
library-not-done = Det lot seg ikke gjøre

## Samlinger.

library-collections = Samlinger
library-cited-in = Sitert i
library-not-cited = Ikke sitert i noe prosjekt.
library-cited-reading = Leser prosjektene …
library-collections-hint = En samling holder referanser til et emne eller et arbeid. En referanse kan være med i så mange samlinger du vil.
library-collection-new = Ny samling
library-collection-new-inside = Ny samling inni
library-collection-new-under = Ny samling i «{ $name }»
library-collection-move-to = Flytt til
library-collection-name = Navn på samlingen
library-collection-name-failed = Samlingen kunne ikke få navn
library-collection-expand = Brett ut
library-collection-collapse = Brett sammen
library-collection-to-top = Flytt til øverste nivå
library-collection-move-failed = Samlingen kunne ikke flyttes
library-collection-added = { $count ->
    [one] { $count } referanse lagt til i «{ $name }»
   *[other] { $count } referanser lagt til i «{ $name }»
}
library-collection-already = Allerede i «{ $name }»
library-collection-delete = Slett samlingen
library-collection-delete-title = Slette samlingen «{ $name }»?
library-collection-delete-message = { $inside ->
    [0] Referansene blir værende i biblioteket ditt.
   *[other] Samlingene inni den slettes også. Referansene blir værende i biblioteket ditt.
}
library-collection-delete-failed = Samlingen kunne ikke slettes
library-collection-count = { $count ->
    [one] { $count } samling
   *[other] { $count } samlinger
}

## Et kart over biblioteket, eller over en samling: et nytt prosjekt.

library-map-title-library = Et kart over biblioteket
library-map-title-collection = Et kart over en samling
library-map-library-name = Biblioteket
library-map-name = Navn
library-map-name-hint = Navnet på prosjektet, på kartet i det, og på elementet i midten av kartet.
library-map-what-library = Samlingene blir elementer, ordnet slik de er, og hver referanse et element under samlingen sin, med en henvisning til den som tekst. Referanser som ikke er i noen samling, står i midten.
library-map-what-collection = Samlingene i den blir elementer, ordnet slik de er, og hver referanse et element under samlingen sin, med en henvisning til den som tekst.
library-map-nothing = Det er ingen referanser å sette på kartet.
library-map-make = Lag prosjektet
library-map-making = Lager prosjektet …
library-map-failed = Prosjektet kunne ikke lages.

## Å hente inn referanser, fra hvor som helst i programmet.

library-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
library-open-failed = Referansen kunne ikke åpnes
library-known = { $count ->
    [one] Den er allerede i biblioteket ditt
   *[other] De er allerede i biblioteket ditt
}
library-nothing-to-import = Ingenting å importere
library-none-found = Ingen referanser ble funnet.
library-import-kinds = Referanser leses fra .bib-filer og lages av PDF-filer.
library-filter-bib = BibLaTeX og BibTeX
library-filter-all = Alle filer
library-files-read-failed = { $count ->
    [one] Filen kunne ikke leses
   *[other] Filene kunne ikke leses
}
library-text-read-failed = Teksten kunne ikke leses
library-add-pdfs-title = Legg til PDF-filer
library-pdfs-working = { $count ->
    [one] Finner ut hva filen er …
   *[other] Finner ut hva { $count } filer er …
}
library-pdfs-progress = { $done } av { $count }: { $name }
library-stop = Stopp
library-imported-added = { $count ->
    [one] { $count } referanse lagt til
   *[other] { $count } referanser lagt til
}
library-imported-completed = { $count } fikk flere opplysninger
library-imported-skipped = { $count } allerede i biblioteket
library-imported-files = { $count ->
    [one] { $count } fil lagret
   *[other] { $count } filer lagret
}
library-imported-nothing = Ingenting ble endret
library-paste-title = Lim inn referanser
library-paste-subtitle = BibLaTeX eller BibTeX, så mange oppføringer du vil
library-paste-continue = Fortsett
library-source-label = BibLaTeX-kode

## Import fra Zotero.

library-zotero-title = Importer fra Zotero
library-zotero-not-found = Fant ingen Zotero på denne datamaskinen der den vanligvis har dataene sine. Har den dem et annet sted, så vis hvor: mappen med { $file }.
library-zotero-lead = Det som importeres, kopieres inn i biblioteket ditt, med filene sine. Zotero blir bare lest, og ingenting der endres; programmet kan gjerne være i gang imens.
library-zotero-choose = Datamappen til Zotero
library-zotero-none-there = Det er ingen Zotero der.
library-zotero-unread = Zotero kunne ikke leses.
library-zotero-library = Bibliotek
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Mitt bibliotek
library-zotero-what = Hva som skal importeres
library-zotero-everything = Alt
library-zotero-with-files = Med filene som er vedlagt
library-zotero-with-notes = Med notatene, som annotasjoner
library-zotero-elsewhere = Et annet sted …
library-zotero-show-where = Vis hvor …
library-zotero-reading = Leser …
library-zotero-read = { $count ->
    [0] Les
    [one] Les { $count } referanse
   *[other] Les { $count } referanser
}

## Å skrive en referanse.

library-dialog-edit = Rediger referanse
library-dialog-add = Legg til referanse
library-dialog-back = Tilbake til skjemaet
library-dialog-open-failed = Referansen kunne ikke åpnes.
library-dialog-save-failed = Referansen kunne ikke lagres.
library-source = Kildekode
library-source-unread = Kildekoden kunne ikke leses.

## En referanse, ved siden av listen.

library-pane-label = Referanse
library-pane-more = Mer
library-pane-saved = Lagret
library-pane-editing = Redigerer …
library-pane-not-saved = Ikke lagret
library-pane-unread = Referansen kunne ikke leses.
library-pane-save-failed = Endringene kunne ikke lagres.
library-pane-note-placeholder = Det du tenker om verket. For deg selv: det hører ikke med når det vises til.
library-pane-files = Filer
library-pane-attach = Legg ved
library-pane-attach-title = Legg ved filer
library-pane-attach-failed = Filen kunne ikke legges ved
library-pane-missing = mangler
library-pane-reveal = Vis i filbehandleren
library-pane-reveal-failed = Mappen kunne ikke åpnes
library-pane-no-files = Ingen filer. Legg ved en PDF, eller slipp en her.
library-pane-detach = Fjern filen
library-pane-detach-title = Fjerne «{ $name }»?
library-pane-detach-message = Filen slettes fra lageret til biblioteket, med mindre en annen referanse bruker den.
library-pane-detach-failed = Filen kunne ikke fjernes
library-pane-leave-collection = Fjern fra { $name }
library-pane-duplicate = Dupliser
    .hint = En ny referanse som begynner med disse opplysningene
library-pane-edit-source = Rediger kildekoden …
library-pane-source-subtitle = Referansen som BibLaTeX. Det meste er lettere i skjemaet.
library-pane-source-failed = Kildekoden kunne ikke vises
library-pane-added = Lagt til { $date }
library-pane-added-changed = Lagt til { $added } · endret { $changed }

## Å slå opp en referanse.

library-lookup-placeholder = Slå den opp: en DOI, et ISBN eller ord fra tittelen og forfatteren
library-lookup-label = Slå opp en referanse
library-lookup-failed = Ingenting kunne slås opp.
library-lookup-filled = Fylt ut fra { $source }.
library-lookup-others = { $count ->
    [one] { $count } annen post
   *[other] { $count } andre poster
}
library-lookup-scope = Hva du leter etter
library-lookup-any = Alt
library-lookup-books = Bøker
library-lookup-articles = Artikler
library-lookup-none = Ingenting ble funnet. Færre ord kan finne mer: forfatterens etternavn og et ord eller to fra tittelen.
library-lookup-unknown = Ingenting er kjent om { $kind ->
        [doi] denne DOI-en
        [isbn] dette ISBN-nummeret
        [arxiv] dette arXiv-nummeret
       *[pmid] dette PubMed-nummeret
    } der det ble spurt. Referansen kan skrives inn for hånd nedenfor.

## Det du skriver om et verk.

library-notes = Notater
library-notes-yours = Notatene dine
library-notes-on-work = Notatene dine om dette verket
library-notes-read = Les notatene dine
library-notes-write = Skriv et notat
library-notes-write-on-work = Skriv et notat om dette verket
library-notes-not-in-library = En referanse som ikke er i biblioteket ditt
library-notes-this-project = I dette prosjektet
library-notes-all-projects = I alle prosjekter
library-notes-project-placeholder = Det du tenker om verket, i dette arbeidet
library-notes-all-placeholder = Det du tenker om verket, hvor du enn viser til det
library-notes-keep-for-all = Bruk det i alle prosjekter
library-notes-write-for-all = Skriv for alle prosjekter
library-notes-carried = Referansen fulgte med prosjektet og er ikke i biblioteket ditt. Det som skrives her, følger med til alle som har prosjektet.
library-notes-kept = Lagres med referansen i biblioteket ditt. Det følger med et prosjekt som viser til verket.
library-notes-unread = Notatene dine kunne ikke leses
library-notes-unsaved = Notatet ditt kunne ikke lagres
