# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Ändringar
# The button over the text that opens the panel.
review-open = Granska ändringar
review-since-last = Sedan du senast granskade
review-since-beginning = Sedan historiken började
review-since-session = Sedan { $who } började, { $when }
review-since-named = Sedan ”{ $name }”
# When the moment compared with was, under what it is.
review-since-when = Från { $when }
review-choose-since = Granska från ett annat ögonblick
review-own = Dina egna ändringar också
review-unit = Granska per
review-by-sentence = Mening
review-by-paragraph = Stycke
review-left = { $count ->
    [one] En ändring kvar
   *[other] { $count } ändringar kvar
}
review-position = { $index } av { $count }
review-working = Räknar ut ändringarna…
review-failed = Ändringarna kunde inte räknas ut.
review-nothing = Inget kvar att granska
review-nothing-text = Varje ändring de andra har gjort sedan dess har godtagits.
review-list = Den här kartans ändringar

## What a change is.

review-kind-changed = Ändrat
review-kind-added = Ny text
review-kind-removed = Raderad text
review-kind-moved = Flyttat
review-kind-object = { $what ->
    [figure] Figur
    [table] Tabell
    [equation] Ekvation
    [citation] Källhänvisning
    [math] Formel
    [footnote] Not
    [crossref] Korshänvisning
   *[other] Något som inte är text
}
review-kind-put-in = { $what } insatt
review-kind-taken-out = { $what } borttagen
review-kind-altered = { $what } ändrad
review-element-added = Element tillagt
review-element-removed = Element raderat
review-element-moved = Element flyttat
review-element-heading = Skrivs ut som rubrik
review-element-no-heading = Skrivs inte längre ut som rubrik
review-element-excluded = Utelämnat ur dokumentet
review-element-included = Återinsatt i dokumentet
review-element-other = Element ändrat
# Where a change is: the name of the element.
review-in = I ”{ $element }”
review-moved-from = Från ”{ $element }”
review-untitled = Utan titel
review-gone-element = Ett element som inte längre finns
review-was = Som det var
review-is = Som det är
review-nothing-there = Inget
review-someone = Någon
review-now-under = Nu under ”{ $element }”
review-was-under = Var under ”{ $element }”

## What is done with a change.

review-accept = Godta
review-reject = Avvisa
review-later = Senare
review-previous = Den förra
review-reject-cannot = Det som raderats ur kartan, eller en figur som tagits bort, återställs från historiken.
review-versions = Dess historik
review-versions-count = { $count ->
    [one] En version
   *[other] { $count } versioner
}
review-versions-reading = Läser dess historik…
review-versions-none = Inget hände mellan de två ändarna.
review-version-by = { $who }, { $when }
review-accept-up-to = Godta fram till hit
review-use-version = Använd den här versionen

## Without the history.

review-no-history = Historiken för det här projektet förs inte
review-no-history-text = Ändringar granskas utifrån projektets historik, som säger vem som ändrade vad, och när. Den förs från det ögonblick den slås på.
review-turn-on = För historik
review-turn-on-elsewhere = Den slås på med projektets historik.
