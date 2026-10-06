# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Fundne kildehenvisninger
# On the tab of the panel, beside the other tabs: short.
found-tab = Fundne henvisninger
found-between = Mellem kortet og de fundne kildehenvisninger
found-taken = Det, der tages for kildehenvisninger
found-taken-always = Det, et program har lavet, og tags
found-taken-years = Parenteser med et årstal i
found-taken-named = Noter, der nævner et værk i biblioteket
found-taken-notes = Alle noter
found-asking = Spørger biblioteket…
found-make-certain = { $count ->
    [one] Lav en kildehenvisning af den, der er sikker
   *[other] Lav kildehenvisninger af de { $count }, der er sikre
}
found-made = { $count ->
    [one] Én kildehenvisning blev lavet
   *[other] { $count } kildehenvisninger blev lavet
}
found-made-undo = Ctrl+Z fortryder dem, i ét trin.
found-library-failed = Biblioteket kunne ikke spørges.
found-nothing = Intet at gennemgå
found-nothing-looked = Der er ingen fundne kildehenvisninger tilbage i dette kort, og intet i det ligner en.
found-nothing-looked-more = Der er ingen fundne kildehenvisninger tilbage i dette kort, og intet i det ligner en. Mere kan tages for kildehenvisninger, ovenfor.
found-nothing-not-looked = Der er ingen fundne kildehenvisninger tilbage i dette kort. Tekst, der kun ligner en kildehenvisning, ledes der efter, når du ovenfor siger, hvad der skal tages for en: parenteser med et årstal i, eller noter.
found-list-label = Det, der er at gennemgå
found-untitled = Uden titel
found-in-a-note = I en note
# The element of the map a citation stands in.
found-in = I »{ $element }«
found-in-note-of = I en note i »{ $element }«
# Set small and high after the words a note stands after.
found-note-mark = note
found-position = { $index } af { $count }
found-previous = Den forrige
found-next = Den næste
found-list-show = Vis listen
found-list-hide = Skjul listen
found-later = Senere
found-leave = Lad den stå som tekst
found-make = Gør den til en kildehenvisning

## How sure the library is of what it proposes.

found-sure-certain = Biblioteket har den med sikkerhed
found-sure-likely = Biblioteket har det, der sandsynligvis er den
found-sure-possible = Biblioteket har det, der kan være den
found-sure-none = Et af dens værker har ingen reference endnu

## By what a citation was found.

found-by-zotero = Lavet af Zotero
found-by-mendeley = Lavet af Mendeley eller et program, der skriver som det
found-by-key = Et tag, der nævner en reference
found-by-form = Taget for en kildehenvisning efter sit udseende

## The citation that is to be made.

found-the-citation = Kildehenvisningen
found-no-works = Den nævner intet værk. Tilføj et, eller lad den stå som den tekst, den er.
found-add-work = Tilføj et værk
found-author-in-text = Forfatteren i teksten: Nagy (1979)
found-pick-work = Det værk, der henvises til: forfatter, titel, år
found-pick-add = Tilføj et værk til kildehenvisningen
found-too-little = Filen siger for lidt om dette værk til, at der kan laves en reference af det
found-reference-failed = Referencen kunne ikke laves

## A citation that stands in a note.

found-in-note = Den står i en note
found-note-becomes = Noten bliver en kildehenvisning
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Det, noten ellers siger, kommer før og efter dens værker{ $has ->
        [before] : »{ $before }« før
        [after] : »{ $after }« efter
       *[both] : »{ $before }« før, »{ $after }« efter
    }. Referencestilen sætter den i linjen eller i en note.
found-note-style = Referencestilen sætter den i linjen eller i en note.
found-citation-in-note = Kildehenvisningen står i noten
    .hint = Noten forbliver en note, med det, den ellers siger.
found-for-all = Sådan for alle, der følger
found-note-not = Den står ikke i en note.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Noten indeholder { $what ->
        [math] en formel
        [crossref] en krydshenvisning
        [citation] en kildehenvisning
        [hard_break] endnu en linje
       *[other] noget, der ikke er tekst
    }, som ordene før og efter et værk ikke kan rumme.
found-note-another = Noten indeholder en anden fundet kildehenvisning, som ville gå tabt i ordene efter denne.

## Why what was asked could not be done.

found-trouble-gone = Den er ikke længere i teksten.
found-trouble-changed = Teksten her er ændret, siden den blev foreslået, og er set på igen.
found-trouble-cannot = Der kan ikke laves en kildehenvisning af den her.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } og { $second }
found-people-more = { $first } m.fl.
found-work-a-work = Et værk
found-work-looking = Der ledes efter { $work } i dit bibliotek…
found-work-no-tag = { $work } er et tag, som ingen reference i dit bibliotek har.
found-work-not-found = { $work } blev ikke fundet i dit bibliotek.
found-work-chosen = Valgt af dig
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Som du valgte for samme værk
found-work-certain = Sikker
found-work-likely = Sandsynlig
found-work-possible = Mulig
# What the text says the work is.
found-work-for = for »{ $work }«
found-work-others = Andre referencer, det kan være
found-work-or = Eller
found-work-may-be = Det kan være
found-work-another = En anden…
found-work-find = Find den…
found-work-add = Føj den til biblioteket
