# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Izmjene
# The button over the text that opens the panel.
review-open = Pregledaj izmjene
review-since-last = Od vašeg zadnjeg pregleda
review-since-beginning = Otkako je povijest počela
review-since-session = Otkako je { $who } počeo, { $when }
review-since-named = Od „{ $name }”
# When the moment compared with was, under what it is.
review-since-when = Od { $when }
review-choose-since = Pregledaj od drugog trenutka
review-own = I vlastite izmjene
review-unit = Pregledaj po
review-by-sentence = Rečenici
review-by-paragraph = Odlomku
review-left = { $count ->
    [1] Ostala je jedna izmjena
    [one] Ostala je { $count } izmjena
    [few] Ostale su { $count } izmjene
   *[other] Ostalo je { $count } izmjena
}
review-position = { $index } od { $count }
review-working = Utvrđivanje izmjena…
review-failed = Izmjene nije bilo moguće utvrditi.
review-nothing = Nema se više što pregledati
review-nothing-text = Svaka izmjena koju su drugi otada načinili prihvaćena je.
review-list = Izmjene ove mape

## What a change is.

review-kind-changed = Izmijenjeno
review-kind-added = Novi tekst
review-kind-removed = Izbrisani tekst
review-kind-moved = Premješteno
review-kind-object = { $what ->
    [figure] Ilustracija
    [table] Tablica
    [equation] Jednadžba
    [citation] Citat
    [math] Formula
    [footnote] Bilješka
    [crossref] Uputnica
   *[other] Nešto što nije tekst
}
review-kind-put-in = Umetnuto: { $what }
review-kind-taken-out = Izvađeno: { $what }
review-kind-altered = Izmijenjeno: { $what }
review-element-added = Element dodan
review-element-removed = Element izbrisan
review-element-moved = Element premješten
review-element-heading = Tiska se kao naslov
review-element-no-heading = Više se ne tiska kao naslov
review-element-excluded = Izostavljen iz dokumenta
review-element-included = Vraćen u dokument
review-element-other = Element izmijenjen
# Where a change is: the name of the element.
review-in = U „{ $element }”
review-moved-from = Iz „{ $element }”
review-untitled = Bez naslova
review-gone-element = Element kojega više nema
review-was = Kako je bilo
review-is = Kako jest
review-nothing-there = Ništa
review-someone = Netko
review-now-under = Sad ispod „{ $element }”
review-was-under = Bio ispod „{ $element }”

## What is done with a change.

review-accept = Prihvati
review-reject = Odbaci
review-later = Poslije
review-previous = Prethodna
review-reject-cannot = Što je izbrisano iz mape, ili izvađena ilustracija, vraća se iz povijesti.
review-versions = Njezina povijest
review-versions-count = { $count ->
    [1] Jedna inačica
    [one] { $count } inačica
    [few] { $count } inačice
   *[other] { $count } inačica
}
review-versions-reading = Čitanje njezine povijesti…
review-versions-none = Između dvaju krajeva ništa se nije dogodilo.
review-version-by = { $who }, { $when }
review-accept-up-to = Prihvati do ovdje
review-use-version = Upotrijebi ovu inačicu

## Without the history.

review-no-history = Povijest ovog projekta ne čuva se
review-no-history-text = Izmjene se pregledavaju iz povijesti projekta, koja kaže tko je što promijenio i kada. Čuva se od trenutka kad se uključi.
review-turn-on = Čuvaj povijest
review-turn-on-elsewhere = Uključuje se s poviješću projekta.
