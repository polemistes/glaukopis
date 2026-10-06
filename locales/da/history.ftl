# The full history of a project, in English.
# See locales/README.md.

history-title = Historik
history-between = Mellem kortene og historikken
history-settings = Historikkens indstillinger
history-failed = Historikken kunne ikke læses.
history-reading = Læser historikken…

## When it is not kept

history-off = Historikken for dette projekt gemmes ikke.
history-on-word = Hver ændring gemmes
history-off-word = Gemmes ikke
history-off-about = Mens den gemmes, gemmes hver ændring, med hvem der gjorde den, og hvornår: projektet kan ses, som det var på ethvert tidspunkt, og hentes tilbage. Det tager plads, og i et delt projekt viser det de andre, hvad hver især skrev, og hvornår.
history-turn-on = Gem historikken

## The moments

# Someone whose name the history does not know.
history-someone = Nogen
history-began = Historikken begynder
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = gemt mere groft
history-added = { $count ->
    [one] +1 tegn
   *[other] +{ $count } tegn
}
history-removed = { $count ->
    [one] −1 tegn
   *[other] −{ $count } tegn
}

## The map as it was

history-back = Tilbage til nu
history-as-it-was = Som det var { $when }
history-marked = Det, der er ændret siden øjeblikket før, er markeret i farven på den, der ændrede det.
history-map-not-there = Dette kort fandtes ikke dengang.
history-added-by = Tilføjet af { $name }
history-removed-by = Fjernet af { $name }
history-changed-by = Ændret af { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = krydshenvisning
history-name-moment = Giv øjeblikket et navn
history-name-placeholder = Hvad det skal hedde
history-named = Øjeblikket hedder »{ $name }«.
history-bring-back-element = Hent elementet tilbage, som det var
history-bring-back-map = Hent kortet tilbage, som det var
history-brought-back = Hentet tilbage, som det var. Fortryd tager det tilbage.
history-bring-back-failed = Det kunne ikke hentes tilbage.
history-open-copy = Åbn som et projekt for sig
history-copy-name = { $name }, som det var { $day }
history-copy-failed = Projektet kunne ikke laves.

## Archives

history-open-archive = Åbn et arkiv…
history-archive-kind = Historik fra Glaukopis
history-archive-unread = Arkivet kunne ikke læses.
history-archive-of = Arkiv: { $name }
history-archive-close = Luk

## Settings

history-keep = Gem historikken
history-room = Historikken fylder { $size }.
history-turn-off-title = Hold op med at gemme historikken?
history-turn-off-message = Det, der er gemt, slettes. Selve projektet bliver, som det er.
history-turn-off-shared = Det, der er gemt, slettes, her og på computerne hos dem, projektet er delt med. Selve projektet bliver, som det er.
history-turn-off = Slet historikken
history-finely = Ældre historik
history-finely-about = Ældre ændringer slås sammen, så de fylder mindre og læses hurtigere; øjeblikke inden for dem kan så ikke længere skelnes fra hinanden. Navngivne øjeblikke, og dem gennemgange sammenligner med, gemmes.
history-hourly = Slå hver time sammen til ét efter
history-weeks = { $count ->
    [one] uge
   *[other] uger
}
history-daily = Slå hver dag sammen til ét efter
history-months = { $count ->
    [one] måned
   *[other] måneder
}
history-before = Det, der kom før
history-before-choose = Vælg et øjeblik i historikken for at arkivere eller slette det, der kom før det.
history-before-about = Historikken før { $when } kan arkiveres i en fil, så den kan ses senere, eller slettes.
history-archive = Arkiver…
history-delete = Slet
history-archive-title = Arkiver historikken før { $when }?
history-delete-title = Slet historikken før { $when }?
history-cut-message = Det, der bliver tilbage, begynder med projektet, som det var da.
history-cut-kept = { $count ->
    [one] Et navngivet eller gennemgået øjeblik ligger før det og kan ikke længere ses her.
   *[other] { $count } navngivne eller gennemgåede øjeblikke ligger før det og kan ikke længere ses her.
}
history-cut-not-here = Historikken kan ikke tages ud før dette øjeblik.
history-cut-failed = Historikken kunne ikke tages ud.
history-archive-until = indtil { $when }
history-archived = Historikken før { $when } er arkiveret.
history-deleted = Historikken før { $when } er slettet.
