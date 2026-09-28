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
