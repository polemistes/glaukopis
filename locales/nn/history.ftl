# The full history of a project, in English.
# See locales/README.md.

history-title = Historikk
history-between = Mellom karta og historikken
history-settings = Innstillingar for historikken
history-failed = Historikken kunne ikkje lesast.
history-reading = Les historikken …

## When it is not kept

history-off = Historikken til dette prosjektet blir ikkje teken vare på.
history-on-word = Kvar endring blir teken vare på
history-off-word = Blir ikkje teken vare på
history-off-about = Medan den blir teken vare på, blir kvar endring teken vare på, med kven som gjorde den og når: prosjektet kan sjåast slik det var i kvar augneblink, og hentast tilbake. Den tek plass, og i eit delt prosjekt viser den dei andre kva kvar einskild skreiv, og når.
history-turn-on = Ta vare på historikken

## The moments

# Someone whose name the history does not know.
history-someone = Nokon
history-began = Historikken byrjar
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = teke vare på grovare
history-added = { $count ->
    [one] +1 teikn
   *[other] +{ $count } teikn
}
history-removed = { $count ->
    [one] −1 teikn
   *[other] −{ $count } teikn
}

## The map as it was

history-back = Tilbake til no
history-as-it-was = Slik det var { $when }
history-marked = Det som er endra sidan augneblinken før, er merkt i fargen til den som endra det.
history-map-not-there = Dette kartet fanst ikkje då.
history-added-by = Lagt til av { $name }
history-removed-by = Fjerna av { $name }
history-changed-by = Endra av { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = kryssreferanse
history-name-moment = Gi augneblinken eit namn
history-name-placeholder = Kva den skal heite
history-named = Augneblinken heiter «{ $name }».
history-bring-back-element = Hent tilbake elementet slik det var
history-bring-back-map = Hent tilbake kartet slik det var
history-brought-back = Henta tilbake slik det var. Angre tek det tilbake.
history-bring-back-failed = Det kunne ikkje hentast tilbake.
history-open-copy = Opne som eit eige prosjekt
history-copy-name = { $name }, slik det var { $day }
history-copy-failed = Prosjektet kunne ikkje lagast.

## Archives

history-open-archive = Opne eit arkiv …
history-archive-kind = Historikk frå Glaukopis
history-archive-unread = Arkivet kunne ikkje lesast.
history-archive-of = Arkiv: { $name }
history-archive-close = Lukk

## Settings

history-keep = Ta vare på historikken
history-room = Historikken tek { $size }.
history-turn-off-title = Slutte å ta vare på historikken?
history-turn-off-message = Det som er teke vare på, blir sletta. Sjølve prosjektet blir som det er.
history-turn-off-shared = Det som er teke vare på, blir sletta, her og på datamaskinene til dei prosjektet er delt med. Sjølve prosjektet blir som det er.
history-turn-off = Slett historikken
history-finely = Eldre historikk
history-finely-about = Eldre endringar blir slegne saman, så dei tek mindre plass og blir lesne raskare; augneblinkar innanfor dei kan då ikkje lenger skiljast frå kvarandre. Augneblinkar med namn, og dei som gjennomgangar samanliknar med, blir tekne vare på.
history-hourly = Slå saman kvar time til éin etter
history-weeks = { $count ->
    [one] veke
   *[other] veker
}
history-daily = Slå saman kvar dag til éin etter
history-months = { $count ->
    [one] månad
   *[other] månader
}
history-before = Det som kom før
history-before-choose = Vel ein augneblink i historikken for å arkivere eller slette det som kom før den.
history-before-about = Historikken før { $when } kan arkiverast i ei fil, for å sjåast på seinare, eller slettast.
history-archive = Arkiver …
history-delete = Slett
history-archive-title = Arkivere historikken før { $when }?
history-delete-title = Slette historikken før { $when }?
history-cut-message = Det som blir att, byrjar med prosjektet slik det var då.
history-cut-kept = { $count ->
    [one] Ein augneblink med namn eller frå ein gjennomgang ligg før, og kan ikkje lenger sjåast her.
   *[other] { $count } augneblinkar med namn eller frå gjennomgangar ligg før, og kan ikkje lenger sjåast her.
}
history-cut-not-here = Historikken kan ikkje takast ut før denne augneblinken.
history-cut-failed = Historikken kunne ikkje takast ut.
history-archive-until = til { $when }
history-archived = Historikken før { $when } er arkivert.
history-deleted = Historikken før { $when } er sletta.
