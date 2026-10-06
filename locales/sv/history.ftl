# The full history of a project, in English.
# See locales/README.md.

history-title = Historik
history-between = Mellan kartorna och historiken
history-settings = Historikens inställningar
history-failed = Historiken kunde inte läsas.
history-reading = Läser historiken…

## When it is not kept

history-off = Historiken för det här projektet förs inte.
history-on-word = Varje ändring sparas
history-off-word = Förs inte
history-off-about = Medan den förs sparas varje ändring, med vem som gjorde den och när: projektet kan ses som det var i varje ögonblick, och återställas. Det tar plats, och i ett delat projekt visar det de andra vad var och en skrev, och när.
history-turn-on = För historik

## The moments

# Someone whose name the history does not know.
history-someone = Någon
history-began = Historiken börjar
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = sparad grövre
history-added = { $count ->
    [one] +1 tecken
   *[other] +{ $count } tecken
}
history-removed = { $count ->
    [one] −1 tecken
   *[other] −{ $count } tecken
}

## The map as it was

history-back = Tillbaka till nuet
history-as-it-was = Som det var { $when }
history-marked = Det som ändrats sedan ögonblicket före är märkt i färgen hos den som ändrade det.
history-map-not-there = Den här kartan fanns inte då.
history-added-by = Tillagt av { $name }
history-removed-by = Borttaget av { $name }
history-changed-by = Ändrat av { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = korshänvisning
history-name-moment = Namnge det här ögonblicket
history-name-placeholder = Vad det ska heta
history-named = Ögonblicket heter ”{ $name }”.
history-bring-back-element = Återställ det här elementet som det var
history-bring-back-map = Återställ kartan som den var
history-brought-back = Återställt som det var. Ångra tar det tillbaka.
history-bring-back-failed = Det kunde inte återställas.
history-open-copy = Öppna som ett eget projekt
history-copy-name = { $name }, som det var { $day }
history-copy-failed = Projektet kunde inte göras.

## Archives

history-open-archive = Öppna ett arkiv…
history-archive-kind = Historik från Glaukopis
history-archive-unread = Arkivet kunde inte läsas.
history-archive-of = Arkiv: { $name }
history-archive-close = Stäng

## Settings

history-keep = För historik
history-room = Historiken tar { $size }.
history-turn-off-title = Sluta föra historik?
history-turn-off-message = Det som sparats raderas. Projektet självt förblir som det är.
history-turn-off-shared = Det som sparats raderas, här och på datorerna hos dem som projektet delas med. Projektet självt förblir som det är.
history-turn-off = Radera historiken
history-finely = Äldre historik
history-finely-about = Äldre ändringar slås ihop, så att de tar mindre plats och läses fortare; ögonblick inom dem kan då inte längre skiljas åt. Namngivna ögonblick, och de som granskningar jämför med, behålls.
history-hourly = Slå ihop varje timme till ett efter
history-weeks = { $count ->
    [one] vecka
   *[other] veckor
}
history-daily = Slå ihop varje dag till ett efter
history-months = { $count ->
    [one] månad
   *[other] månader
}
history-before = Det som kom före
history-before-choose = Välj ett ögonblick i historiken för att arkivera eller radera det som kom före det.
history-before-about = Historiken före { $when } kan arkiveras i en fil, för att ses senare, eller raderas.
history-archive = Arkivera…
history-delete = Radera
history-archive-title = Arkivera historiken före { $when }?
history-delete-title = Radera historiken före { $when }?
history-cut-message = Det som blir kvar börjar med projektet som det var då.
history-cut-kept = { $count ->
    [one] Ett namngivet eller granskat ögonblick ligger före det, och kan inte längre ses här.
   *[other] { $count } namngivna eller granskade ögonblick ligger före det, och kan inte längre ses här.
}
history-cut-not-here = Historiken kan inte tas ut före det här ögonblicket.
history-cut-failed = Historiken kunde inte tas ut.
history-archive-until = till { $when }
history-archived = Historiken före { $when } är arkiverad.
history-deleted = Historiken före { $when } är raderad.
