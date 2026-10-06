# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Funne kjeldetilvisingar
# On the tab of the panel, beside the other tabs: short.
found-tab = Funne tilvisingar
found-between = Mellom kartet og dei funne kjeldetilvisingane
found-taken = Det som blir teke for kjeldetilvisingar
found-taken-always = Det eit program har laga, og taggar
found-taken-years = Parentesar med eit årstal i
found-taken-named = Notar som nemner eit verk i biblioteket
found-taken-notes = Alle notar
found-asking = Spør biblioteket …
found-make-certain = { $count ->
    [one] Lag ei kjeldetilvising av den som er sikker
   *[other] Lag kjeldetilvisingar av dei { $count } som er sikre
}
found-made = { $count ->
    [one] Éi kjeldetilvising vart laga
   *[other] { $count } kjeldetilvisingar vart laga
}
found-made-undo = Ctrl+Z angrar dei, i eitt steg.
found-library-failed = Det gjekk ikkje å spørje biblioteket.
found-nothing = Ingenting å gå gjennom
found-nothing-looked = Inga funnen kjeldetilvising er att i dette kartet, og ingenting i det ser ut som ei.
found-nothing-looked-more = Inga funnen kjeldetilvising er att i dette kartet, og ingenting i det ser ut som ei. Meir kan takast for kjeldetilvisingar ovanfor.
found-nothing-not-looked = Inga funnen kjeldetilvising er att i dette kartet. Tekst som berre ser ut som ei kjeldetilvising, blir leita etter når du seier ovanfor kva som skal takast for ei: parentesar med eit årstal i, eller notar.
found-list-label = Det som skal gåast gjennom
found-untitled = Utan namn
found-in-a-note = I ein note
# The element of the map a citation stands in.
found-in = I «{ $element }»
found-in-note-of = I ein note i «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = note
found-position = { $index } av { $count }
found-previous = Den før
found-next = Den neste
found-list-show = Vis lista
found-list-hide = Gøym lista
found-later = Seinare
found-leave = La det stå som tekst
found-make = Gjer det til ei kjeldetilvising

## How sure the library is of what it proposes.

found-sure-certain = Biblioteket har det heilt sikkert
found-sure-likely = Biblioteket har det som truleg er det
found-sure-possible = Biblioteket har det som kan vere det
found-sure-none = Eit av verka i den har ingen referanse enno

## By what a citation was found.

found-by-zotero = Laga av Zotero
found-by-mendeley = Laga av Mendeley eller eit program som skriv på same måte
found-by-key = Ein tagg som nemner ein referanse
found-by-form = Teken for ei kjeldetilvising ut frå korleis den ser ut

## The citation that is to be made.

found-the-citation = Kjeldetilvisinga
found-no-works = Den nemner ikkje noko verk. Legg til eitt, eller la den stå som teksten den er.
found-add-work = Legg til eit verk
found-author-in-text = Forfattar i teksten: Nagy (1979)
found-pick-work = Verket det blir vist til: forfattar, tittel, år
found-pick-add = Legg til eit verk i kjeldetilvisinga
found-too-little = Fila seier for lite om dette verket til at det kan lagast ein referanse av det
found-reference-failed = Referansen kunne ikkje lagast

## A citation that stands in a note.

found-in-note = Den står i ein note
found-note-becomes = Noten blir ei kjeldetilvising
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Det noten elles seier, blir tekst framfor og etter verka{ $has ->
        [before] : «{ $before }» framfor
        [after] : «{ $after }» etter
       *[both] : «{ $before }» framfor, «{ $after }» etter
    }. Referansestilen set den i løpande tekst eller i ein note.
found-note-style = Referansestilen set den i løpande tekst eller i ein note.
found-citation-in-note = Kjeldetilvisinga står i noten
    .hint = Noten blir verande ein note, med det den elles seier.
found-for-all = Slik for alle som følgjer
found-note-not = Den står ikkje i ein note.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Noten inneheld { $what ->
        [math] ein formel
        [crossref] ein kryssreferanse
        [citation] ei kjeldetilvising
        [hard_break] eit linjeskift
       *[other] noko som ikkje er tekst
    }, som teksten framfor og etter eit verk ikkje kan innehalde.
found-note-another = Noten inneheld ei anna funnen kjeldetilvising, som ville gått tapt i teksten etter denne.

## Why what was asked could not be done.

found-trouble-gone = Den står ikkje lenger i teksten.
found-trouble-changed = Teksten her er endra sidan den vart føreslått, og er sett på igjen.
found-trouble-cannot = Det kan ikkje lagast ei kjeldetilvising av den her.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } og { $second }
found-people-more = { $first } mfl.
found-work-a-work = Eit verk
found-work-looking = { $work } blir leita etter i biblioteket ditt …
found-work-no-tag = { $work } er ein tagg som ingen referanse i biblioteket ditt har.
found-work-not-found = { $work } vart ikkje funne i biblioteket ditt.
found-work-chosen = Valt av deg
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Som du valde for same verk
found-work-certain = Sikker
found-work-likely = Truleg
found-work-possible = Mogleg
# What the text says the work is.
found-work-for = for «{ $work }»
found-work-others = Andre referansar det kan vere
found-work-or = Eller
found-work-may-be = Det kan vere
found-work-another = Ein annan …
found-work-find = Finn det …
found-work-add = Legg det til i biblioteket
