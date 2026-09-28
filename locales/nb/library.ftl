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

## Hvorfor en referanse tas for en annen: «samme DOI og samme fil».

library-reason-doi = samme DOI
library-reason-isbn = samme ISBN
library-reason-identical = like i alt som skiller ett verk fra et annet
library-reason-title-author-year = samme tittel, forfatter og år
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
library-duplicates-how = Når referanser slås sammen, får den du beholder, det den mangler fra de andre, og beholder sitt eget der de er ulike. Filene og samlingene deres føres sammen, og det som viser til dem, viser til den som beholdes.
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
library-import-in-library = I biblioteket ditt
library-import-would-gain = Vil få: { $fields }
library-import-gains-file = Fil
library-import-gains-zotero = Nøkkelen i Zotero
library-import-what-to-do = Hva som skal gjøres
library-import-merge = Samme verk: fullfør det jeg har
library-import-skip = Samme verk: la mitt være som det er
library-import-add = Et annet verk: legg det til
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
library-import-export = Importer og eksporter
library-import-file = Importer en fil …
    .hint = BibLaTeX eller BibTeX
library-paste = Lim inn referanser …
library-add-pdfs = Legg til PDF-filer …
    .hint = Hver av dem slås opp og tas vare på
library-import-zotero = Importer fra Zotero …
library-find-duplicates = Finn duplikater …
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
    }. Kildehenvisninger til den i prosjektene dine vil ikke lenger finne referansen sin.
library-delete-many = Referansene fjernes fra biblioteket ditt og fra alle samlinger{ $files ->
        [0] {""}
        [one] , sammen med { $files } vedlegg
       *[other] , sammen med { $files } vedlegg
    }. Kildehenvisninger til dem i prosjektene dine vil ikke lenger finne referansene sine.
library-delete-failed = Referansene kunne ikke slettes
library-not-done = Det lot seg ikke gjøre

## Samlinger.

library-collections = Samlinger
library-collections-hint = Samlinger samler referanser til et emne eller et arbeid. En referanse kan være med i så mange av dem du vil.
library-collection-new = Ny samling
library-collection-new-inside = Ny samling inni
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
