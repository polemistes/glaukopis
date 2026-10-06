# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Izmjene
# The button over the text that opens the panel.
review-open = Revidiraj izmjene
review-since-last = Od vaše posljednje revizije
review-since-beginning = Od početka historije
review-since-session = Otkako je { $who } počeo, { $when }
review-since-named = Od „{ $name }“
# When the moment compared with was, under what it is.
review-since-when = Od { $when }
review-choose-since = Revidiraj od drugog trenutka
review-own = I vaše vlastite izmjene
review-unit = Revidiraj po
review-by-sentence = Rečenicama
review-by-paragraph = Pasusima
review-left = { $count ->
    [one] Preostala je jedna izmjena
    [few] Preostale su { $count } izmjene
   *[other] Preostalo je { $count } izmjena
}
review-position = { $index } od { $count }
review-working = Utvrđivanje izmjena…
review-failed = Izmjene nije bilo moguće utvrditi.
review-nothing = Nema više šta revidirati
review-nothing-text = Svaka izmjena koju su drugi otada napravili prihvaćena je.
review-list = Izmjene ove mape

## What a change is.

review-kind-changed = Izmijenjeno
review-kind-added = Novi tekst
review-kind-removed = Izbrisani tekst
review-kind-moved = Premješteno
review-kind-object = { $what ->
    [figure] Ilustracija
    [table] Tabela
    [equation] Jednačina
    [citation] Citat
    [math] Formula
    [footnote] Napomena
    [crossref] Uputnica
   *[other] Nešto što nije tekst
}
review-kind-put-in = { $what } – umetnuto
review-kind-taken-out = { $what } – uklonjeno
review-kind-altered = { $what } – izmijenjeno
review-element-added = Element dodan
review-element-removed = Element izbrisan
review-element-moved = Element premješten
review-element-heading = Štampa se kao naslov
review-element-no-heading = Više se ne štampa kao naslov
review-element-excluded = Izostavljen iz dokumenta
review-element-included = Vraćen u dokument
review-element-other = Element izmijenjen
# Where a change is: the name of the element.
review-in = U „{ $element }“
review-moved-from = Iz „{ $element }“
review-untitled = Bez naslova
review-gone-element = Element kojeg više nema
review-was = Kako je bilo
review-is = Kako jeste
review-nothing-there = Ništa
review-someone = Neko
review-now-under = Sada pod „{ $element }“
review-was-under = Bio pod „{ $element }“

## What is done with a change.

review-accept = Prihvati
review-reject = Odbaci
review-later = Kasnije
review-previous = Prethodna
review-reject-cannot = Ono što je izbrisano iz mape, ili uklonjena ilustracija, vraća se iz historije.
review-versions = Njena historija
review-versions-count = { $count ->
    [one] Jedna verzija
    [few] { $count } verzije
   *[other] { $count } verzija
}
review-versions-reading = Čitanje njene historije…
review-versions-none = Između dvaju krajeva ništa se nije dogodilo.
review-version-by = { $who }, { $when }
review-accept-up-to = Prihvati dovde
review-use-version = Koristi ovu verziju

## Without the history.

review-no-history = Historija ovog projekta se ne čuva
review-no-history-text = Izmjene se revidiraju iz historije projekta, koja kaže ko je šta promijenio i kada. Čuva se od trenutka kad se uključi.
review-turn-on = Čuvaj historiju
review-turn-on-elsewhere = Uključuje se s historijom projekta.
