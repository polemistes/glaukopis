# Den fulle historikken til et prosjekt, på bokmål.
# Se locales/README.md.

history-title = Historikk
history-between = Mellom kartene og historikken
history-settings = Innstillinger for historikken
history-failed = Historikken kunne ikke leses.
history-reading = Leser historikken …

## Når den ikke tas vare på

history-off = Historikken til dette prosjektet tas ikke vare på.
history-on-word = Hver endring tas vare på
history-off-word = Tas ikke vare på
history-off-about = Mens den tas vare på, blir hver endring tatt vare på, med hvem som gjorde den og når: prosjektet kan ses slik det var i ethvert øyeblikk, og hentes tilbake. Den tar plass, og i et delt prosjekt viser den de andre hva hver enkelt skrev, og når.
history-turn-on = Ta vare på historikken

## Øyeblikkene

history-someone = Noen
history-began = Historikken begynner
history-span = { $from } – { $to }
history-merged = tatt vare på grovere
history-added = { $count ->
    [one] +1 tegn
   *[other] +{ $count } tegn
}
history-removed = { $count ->
    [one] −1 tegn
   *[other] −{ $count } tegn
}

## Kartet slik det var

history-back = Tilbake til nå
history-as-it-was = Slik det var { $when }
history-marked = Det som er endret siden øyeblikket før, er merket i fargen til den som endret det.
history-map-not-there = Dette kartet fantes ikke da.
history-added-by = Lagt til av { $name }
history-removed-by = Fjernet av { $name }
history-changed-by = Endret av { $name }
history-pointer = kryssreferanse
history-name-moment = Gi øyeblikket et navn
history-name-placeholder = Hva det skal hete
history-named = Øyeblikket heter «{ $name }».
history-bring-back-element = Hent tilbake elementet slik det var
history-bring-back-map = Hent tilbake kartet slik det var
history-brought-back = Hentet tilbake slik det var. Angre tar det tilbake.
history-bring-back-failed = Det kunne ikke hentes tilbake.
history-open-copy = Åpne som et eget prosjekt
history-copy-name = { $name }, slik det var { $day }
history-copy-failed = Prosjektet kunne ikke lages.

## Arkiver

history-open-archive = Åpne et arkiv …
history-archive-kind = Historikk fra Glaukopis
history-archive-unread = Arkivet kunne ikke leses.
history-archive-of = Arkiv: { $name }
history-archive-close = Lukk

## Innstillinger

history-keep = Ta vare på historikken
history-room = Historikken tar { $size }.
history-turn-off-title = Slutte å ta vare på historikken?
history-turn-off-message = Det som er tatt vare på, slettes. Selve prosjektet blir som det er.
history-turn-off-shared = Det som er tatt vare på, slettes, her og på datamaskinene til dem prosjektet er delt med. Selve prosjektet blir som det er.
history-turn-off = Slett historikken
history-finely = Eldre historikk
history-finely-about = Eldre endringer slås sammen, så de tar mindre plass og leses raskere; øyeblikk innenfor dem kan da ikke lenger skilles fra hverandre. Øyeblikk med navn, og de som gjennomganger sammenligner med, blir tatt vare på.
history-hourly = Slå sammen hver time til én etter
history-weeks = { $count ->
    [one] uke
   *[other] uker
}
history-daily = Slå sammen hver dag til én etter
history-months = { $count ->
    [one] måned
   *[other] måneder
}
history-before = Det som kom før
history-before-choose = Velg et øyeblikk i historikken for å arkivere eller slette det som kom før det.
history-before-about = Historikken før { $when } kan arkiveres i en fil, for å ses på senere, eller slettes.
history-archive = Arkiver …
history-delete = Slett
history-archive-title = Arkivere historikken før { $when }?
history-delete-title = Slette historikken før { $when }?
history-cut-message = Det som blir igjen, begynner med prosjektet slik det var da.
history-cut-kept = { $count ->
    [one] Et øyeblikk med navn eller fra en gjennomgang ligger før, og kan ikke lenger ses her.
   *[other] { $count } øyeblikk med navn eller fra gjennomganger ligger før, og kan ikke lenger ses her.
}
history-cut-not-here = Historikken kan ikke tas ut før dette øyeblikket.
history-cut-failed = Historikken kunne ikke tas ut.
history-archive-until = til { $when }
history-archived = Historikken før { $when } er arkivert.
history-deleted = Historikken før { $when } er slettet.
