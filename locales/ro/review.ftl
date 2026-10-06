# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Modificări
# The button over the text that opens the panel.
review-open = Revizuiește modificările
review-since-last = De la ultima revizuire
review-since-beginning = De când a început istoricul
review-since-session = De când a început { $who }, { $when }
review-since-named = De la „{ $name }”
# When the moment compared with was, under what it is.
review-since-when = De la { $when }
review-choose-since = Revizuiește de la alt moment
review-own = Și modificările dumneavoastră
review-unit = Revizuiește pe
review-by-sentence = Propoziții
review-by-paragraph = Paragrafe
review-left = { $count ->
    [one] O modificare rămasă
    [few] { $count } modificări rămase
   *[other] { $count } de modificări rămase
}
review-position = { $index } din { $count }
review-working = Se socotesc modificările…
review-failed = Modificările nu s-au putut socoti.
review-nothing = Nu a mai rămas nimic de revizuit
review-nothing-text = Fiecare modificare făcută de ceilalți de atunci a fost primită.
review-list = Modificările acestei hărți

## What a change is.

review-kind-changed = Modificat
review-kind-added = Text nou
review-kind-removed = Text șters
review-kind-moved = Mutat
review-kind-object = { $what ->
    [figure] Figură
    [table] Tabel
    [equation] Ecuație
    [citation] Citare
    [math] Formulă
    [footnote] Notă
    [crossref] Trimitere
   *[other] Ceva ce nu este text
}
review-kind-put-in = { $what } pusă
review-kind-taken-out = { $what } scoasă
review-kind-altered = { $what } modificată
review-element-added = Element adăugat
review-element-removed = Element șters
review-element-moved = Element mutat
review-element-heading = Tipărit ca titlu
review-element-no-heading = Nu se mai tipărește ca titlu
review-element-excluded = Lăsat afară din document
review-element-included = Pus la loc în document
review-element-other = Element modificat
# Where a change is: the name of the element.
review-in = În „{ $element }”
review-moved-from = Din „{ $element }”
review-untitled = Fără titlu
review-gone-element = Un element care nu mai există
review-was = Cum era
review-is = Cum este
review-nothing-there = Nimic
review-someone = Cineva
review-now-under = Acum sub „{ $element }”
review-was-under = Era sub „{ $element }”

## What is done with a change.

review-accept = Primește
review-reject = Respinge
review-later = Mai târziu
review-previous = Cea dinainte
review-reject-cannot = Ce s-a șters din hartă, sau o figură scoasă, se readuce din istoric.
review-versions = Istoricul ei
review-versions-count = { $count ->
    [one] O versiune
    [few] { $count } versiuni
   *[other] { $count } de versiuni
}
review-versions-reading = Se citește istoricul ei…
review-versions-none = Nu s-a întâmplat nimic între cele două capete.
review-version-by = { $who }, { $when }
review-accept-up-to = Primește până aici
review-use-version = Folosește această versiune

## Without the history.

review-no-history = Istoricul acestui proiect nu se păstrează
review-no-history-text = Modificările se revizuiesc din istoricul proiectului, care spune cine a schimbat ce, și când. Se păstrează din clipa în care este pornit.
review-turn-on = Păstrează istoricul
review-turn-on-elsewhere = Se pornește odată cu istoricul proiectului.
