# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Ændringer
# The button over the text that opens the panel.
review-open = Gennemgå ændringer
review-since-last = Siden du sidst gennemgik
review-since-beginning = Siden historikken begyndte
review-since-session = Siden { $who } begyndte, { $when }
review-since-named = Siden »{ $name }«
# When the moment compared with was, under what it is.
review-since-when = Fra { $when }
review-choose-since = Gennemgå fra et andet tidspunkt
review-own = Også dine egne ændringer
review-unit = Gennemgå efter
review-by-sentence = Sætning
review-by-paragraph = Afsnit
review-left = { $count ->
    [one] Én ændring tilbage
   *[other] { $count } ændringer tilbage
}
review-position = { $index } af { $count }
review-working = Finder ændringerne…
review-failed = Ændringerne kunne ikke findes.
review-nothing = Intet tilbage at gennemgå
review-nothing-text = Alle de ændringer, de andre har lavet siden da, er godtaget.
review-list = Dette korts ændringer

## What a change is.

review-kind-changed = Ændret
review-kind-added = Ny tekst
review-kind-removed = Slettet tekst
review-kind-moved = Flyttet
review-kind-object = { $what ->
    [figure] Figur
    [table] Tabel
    [equation] Ligning
    [citation] Kildehenvisning
    [math] Formel
    [footnote] Note
    [crossref] Krydshenvisning
   *[other] Noget, der ikke er tekst
}
review-kind-put-in = { $what } sat ind
review-kind-taken-out = { $what } taget ud
review-kind-altered = { $what } ændret
review-element-added = Element tilføjet
review-element-removed = Element slettet
review-element-moved = Element flyttet
review-element-heading = Udskrives som overskrift
review-element-no-heading = Udskrives ikke længere som overskrift
review-element-excluded = Udeladt af dokumentet
review-element-included = Taget med i dokumentet igen
review-element-other = Element ændret
# Where a change is: the name of the element.
review-in = I »{ $element }«
review-moved-from = Fra »{ $element }«
review-untitled = Uden titel
review-gone-element = Et element, der ikke længere er der
review-was = Som det var
review-is = Som det er
review-nothing-there = Intet
review-someone = Nogen
review-now-under = Nu under »{ $element }«
review-was-under = Var under »{ $element }«

## What is done with a change.

review-accept = Godtag
review-reject = Afvis
review-later = Senere
review-previous = Den forrige
review-reject-cannot = Det, der blev slettet af kortet, eller en figur, der blev taget ud, hentes tilbage fra historikken.
review-versions = Dens historik
review-versions-count = { $count ->
    [one] Én version
   *[other] { $count } versioner
}
review-versions-reading = Læser dens historik…
review-versions-none = Intet skete mellem de to ender.
review-version-by = { $who }, { $when }
review-accept-up-to = Godtag hertil
review-use-version = Brug denne version

## Without the history.

review-no-history = Historikken for dette projekt gemmes ikke
review-no-history-text = Ændringer gennemgås ud fra projektets historik, som fortæller, hvem der ændrede hvad, og hvornår. Den gemmes fra det øjeblik, den slås til.
review-turn-on = Gem historikken
review-turn-on-elsewhere = Den slås til sammen med projektets historik.
