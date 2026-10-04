# Funne kildehenvisninger i en tekst som er skrevet et annet sted, og
# sidepanelet der de gås gjennom (ADR 0015), på bokmål. Se locales/README.md.

## Panelet.

found-title = Funne kildehenvisninger
found-tab = Funne henvisninger
found-between = Mellom kartet og de funne kildehenvisningene
found-taken = Det som tas for kildehenvisninger
found-taken-always = Det et program har laget, og tagger
found-taken-years = Parenteser med et årstall i
found-taken-named = Noter som nevner et verk i biblioteket
found-taken-notes = Alle noter
found-asking = Spør biblioteket …
found-make-certain = { $count ->
    [one] Lag en kildehenvisning av den som er sikker
   *[other] Lag kildehenvisninger av de { $count } som er sikre
}
found-made = { $count ->
    [one] Én kildehenvisning ble laget
   *[other] { $count } kildehenvisninger ble laget
}
found-made-undo = Ctrl+Z angrer dem, i ett steg.
found-library-failed = Det gikk ikke å spørre biblioteket.
found-nothing = Ingenting å gå gjennom
found-nothing-looked = Ingen funnet kildehenvisning er igjen i dette kartet, og ingenting i det ser ut som en.
found-nothing-looked-more = Ingen funnet kildehenvisning er igjen i dette kartet, og ingenting i det ser ut som en. Mer kan tas for kildehenvisninger ovenfor.
found-nothing-not-looked = Ingen funnet kildehenvisning er igjen i dette kartet. Tekst som bare ser ut som en kildehenvisning, letes det etter når du sier ovenfor hva som skal tas for en: parenteser med et årstall i, eller noter.
found-list-label = Det som skal gås gjennom
found-untitled = Uten navn
found-in-a-note = I en note
found-in = I «{ $element }»
found-in-note-of = I en note i «{ $element }»
found-note-mark = note
found-position = { $index } av { $count }
found-previous = Den før
found-next = Den neste
found-list-show = Vis listen
found-list-hide = Skjul listen
found-later = Senere
found-leave = La det stå som tekst
found-make = Gjør det til en kildehenvisning

## Hvor sikkert biblioteket er på det det foreslår.

found-sure-certain = Biblioteket har den helt sikkert
found-sure-likely = Biblioteket har det som trolig er den
found-sure-possible = Biblioteket har det som kan være den
found-sure-none = Et av verkene i den har ingen referanse ennå

## Hvordan en kildehenvisning ble funnet.

found-by-zotero = Laget av Zotero
found-by-mendeley = Laget av Mendeley eller et program som skriver på samme måte
found-by-key = En tagg som angir en referanse
found-by-form = Tatt for en kildehenvisning ut fra hvordan den ser ut

## Kildehenvisningen som skal lages.

found-the-citation = Kildehenvisningen
found-no-works = Den nevner ikke noe verk. Legg til ett, eller la den stå som teksten den er.
found-add-work = Legg til et verk
found-author-in-text = Forfatter i teksten: Nagy (1979)
found-pick-work = Verket det vises til: forfatter, tittel, år
found-pick-add = Legg til et verk i kildehenvisningen
found-too-little = Filen sier for lite om dette verket til at det kan lages en referanse av det
found-reference-failed = Referansen kunne ikke lages

## En kildehenvisning som står i en note.

found-in-note = Den står i en note
found-note-becomes = Noten blir en kildehenvisning
found-note-around = Det noten ellers sier, blir tekst foran og etter verkene{ $has ->
        [before] : «{ $before }» foran
        [after] : «{ $after }» etter
       *[both] : «{ $before }» foran, «{ $after }» etter
    }. Referansestilen setter den i løpende tekst eller i en note.
found-note-style = Referansestilen setter den i løpende tekst eller i en note.
found-citation-in-note = Kildehenvisningen står i noten
    .hint = Noten forblir en note, med det den ellers sier.
found-for-all = Slik for alle som følger
found-note-not = Den står ikke i en note.
found-note-holds = Noten inneholder { $what ->
        [math] en formel
        [crossref] en kryssreferanse
        [citation] en kildehenvisning
        [hard_break] et linjeskift
       *[other] noe som ikke er tekst
    }, som teksten foran og etter et verk ikke kan inneholde.
found-note-another = Noten inneholder en annen funnet kildehenvisning, som ville gått tapt i teksten etter denne.

## Hvorfor det som ble bedt om, ikke lot seg gjøre.

found-trouble-gone = Den står ikke lenger i teksten.
found-trouble-changed = Teksten her er endret siden den ble foreslått, og er sett på igjen.
found-trouble-cannot = Det kan ikke lages en kildehenvisning av den her.

## Ett verk i en kildehenvisning, slik teksten sier det er.

found-people-two = { $first } og { $second }
found-people-more = { $first } et al.
found-work-a-work = Et verk
found-work-looking = { $work } letes etter i biblioteket ditt …
found-work-no-tag = { $work } er en tagg som ingen referanse i biblioteket ditt har.
found-work-not-found = { $work } ble ikke funnet i biblioteket ditt.
found-work-chosen = Valgt av deg
found-work-followed = Som du valgte for samme verk
found-work-certain = Sikker
found-work-likely = Trolig
found-work-possible = Mulig
found-work-for = for «{ $work }»
found-work-others = Andre referanser det kan være
found-work-or = Eller
found-work-may-be = Det kan være
found-work-another = En annen …
found-work-find = Finn det …
found-work-add = Legg det til i biblioteket
