# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Hittade källhänvisningar
# On the tab of the panel, beside the other tabs: short.
found-tab = Hittade hänvisningar
found-between = Mellan kartan och de hittade källhänvisningarna
found-taken = Vad som tas för källhänvisningar
found-taken-always = Det ett program gjort, och taggar
found-taken-years = Parenteser med ett årtal i
found-taken-named = Noter som nämner ett verk i biblioteket
found-taken-notes = Varje not
found-asking = Frågar biblioteket…
found-make-certain = { $count ->
    [one] Gör en källhänvisning av den som är säker
   *[other] Gör källhänvisningar av de { $count } som är säkra
}
found-made = { $count ->
    [one] En källhänvisning gjordes
   *[other] { $count } källhänvisningar gjordes
}
found-made-undo = Ctrl+Z tar tillbaka dem, som ett steg.
found-library-failed = Biblioteket kunde inte tillfrågas.
found-nothing = Inget att gå igenom
found-nothing-looked = Ingen hittad källhänvisning finns kvar i den här kartan, och inget i den ser ut som en.
found-nothing-looked-more = Ingen hittad källhänvisning finns kvar i den här kartan, och inget i den ser ut som en. Mer kan tas för källhänvisningar, ovan.
found-nothing-not-looked = Ingen hittad källhänvisning finns kvar i den här kartan. Text som bara ser ut som en källhänvisning söks när du ovan säger vad som ska tas för en: parenteser med ett årtal i, eller noter.
found-list-label = Det som finns att gå igenom
found-untitled = Utan titel
found-in-a-note = I en not
# The element of the map a citation stands in.
found-in = I ”{ $element }”
found-in-note-of = I en not i ”{ $element }”
# Set small and high after the words a note stands after.
found-note-mark = not
found-position = { $index } av { $count }
found-previous = Den förra
found-next = Nästa
found-list-show = Visa listan
found-list-hide = Dölj listan
found-later = Senare
found-leave = Låt den stå som text
found-make = Gör den till källhänvisning

## How sure the library is of what it proposes.

found-sure-certain = Biblioteket har det med säkerhet
found-sure-likely = Biblioteket har det som troligen är det
found-sure-possible = Biblioteket har det som kan vara det
found-sure-none = Ett verk i den har ingen referens än

## By what a citation was found.

found-by-zotero = Gjord av Zotero
found-by-mendeley = Gjord av Mendeley, eller ett program som skriver som det
found-by-key = En tagg som nämner en referens
found-by-form = Tagen för en källhänvisning efter hur den ser ut

## The citation that is to be made.

found-the-citation = Källhänvisningen
found-no-works = Den nämner inget verk. Lägg till ett, eller låt den stå som den text den är.
found-add-work = Lägg till ett verk
found-author-in-text = Författaren i texten: Nagy (1979)
found-pick-work = Verket som hänvisas till: författare, titel, år
found-pick-add = Lägg till ett verk i källhänvisningen
found-too-little = Filen säger för lite om det här verket för att en referens ska kunna göras av det
found-reference-failed = Referensen kunde inte göras

## A citation that stands in a note.

found-in-note = Den står i en not
found-note-becomes = Noten blir en källhänvisning
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Det noten säger utöver sina verk hamnar före och efter dem{ $has ->
        [before] : ”{ $before }” före
        [after] : ”{ $after }” efter
       *[both] : ”{ $before }” före, ”{ $after }” efter
    }. Referensstilen sätter den i raden eller i en not.
found-note-style = Referensstilen sätter den i raden eller i en not.
found-citation-in-note = Källhänvisningen står i noten
    .hint = Noten förblir en not, med det den säger i övrigt.
found-for-all = Så för alla som följer
found-note-not = Den står inte i en not.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Noten innehåller { $what ->
        [math] en formel
        [crossref] en korshänvisning
        [citation] en källhänvisning
        [hard_break] en andra rad
       *[other] något som inte är text
    }, vilket orden före och efter ett verk inte kan innehålla.
found-note-another = Noten innehåller en annan hittad källhänvisning, som skulle gå förlorad i orden efter den här.

## Why what was asked could not be done.

found-trouble-gone = Den finns inte längre i texten.
found-trouble-changed = Texten har ändrats här sedan förslaget gavs, och har setts över igen.
found-trouble-cannot = En källhänvisning kan inte göras av den här.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } och { $second }
found-people-more = { $first } m.fl.
found-work-a-work = Ett verk
found-work-looking = { $work } söks i ditt bibliotek…
found-work-no-tag = { $work } är en tagg som ingen referens i ditt bibliotek har.
found-work-not-found = { $work } hittades inte i ditt bibliotek.
found-work-chosen = Vald av dig
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Som du valde för samma verk
found-work-certain = Säker
found-work-likely = Trolig
found-work-possible = Möjlig
# What the text says the work is.
found-work-for = för ”{ $work }”
found-work-others = Andra referenser det kan vara
found-work-or = Eller
found-work-may-be = Det kan vara
found-work-another = En annan…
found-work-find = Hitta det…
found-work-add = Lägg till det i biblioteket
