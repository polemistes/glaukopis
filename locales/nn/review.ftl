# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Endringar
# The button over the text that opens the panel.
review-open = Gå gjennom endringar
review-since-last = Sidan du sist gjekk gjennom
review-since-beginning = Sidan historikken byrja
review-since-session = Sidan { $who } byrja, { $when }
review-since-named = Sidan «{ $name }»
# When the moment compared with was, under what it is.
review-since-when = Frå { $when }
review-choose-since = Gå gjennom frå ein annan augneblink
review-own = Dine eigne endringar òg
review-unit = Gå gjennom etter
review-by-sentence = Setning
review-by-paragraph = Avsnitt
review-left = { $count ->
    [one] Éi endring att
   *[other] { $count } endringar att
}
review-position = { $index } av { $count }
review-working = Finn endringane …
review-failed = Endringane kunne ikkje finnast.
review-nothing = Ingenting att å gå gjennom
review-nothing-text = Alle endringane dei andre har gjort sidan då, er godtekne.
review-list = Endringane i dette kartet

## What a change is.

review-kind-changed = Endra
review-kind-added = Ny tekst
review-kind-removed = Sletta tekst
review-kind-moved = Flytta
review-kind-object = { $what ->
    [figure] Figur
    [table] Tabell
    [equation] Likning
    [citation] Kjeldetilvising
    [math] Formel
    [footnote] Note
    [crossref] Kryssreferanse
   *[other] Noko som ikkje er tekst
}
review-kind-put-in = { $what } sett inn
review-kind-taken-out = { $what } teken ut
review-kind-altered = { $what } endra
review-element-added = Element lagt til
review-element-removed = Element sletta
review-element-moved = Element flytta
review-element-heading = Blir skrive ut som overskrift
review-element-no-heading = Blir ikkje lenger skrive ut som overskrift
review-element-excluded = Utelate frå dokumentet
review-element-included = Teke med i dokumentet igjen
review-element-other = Element endra
# Where a change is: the name of the element.
review-in = I «{ $element }»
review-moved-from = Frå «{ $element }»
review-untitled = Utan namn
review-gone-element = Eit element som ikkje finst lenger
review-was = Slik det var
review-is = Slik det er
review-nothing-there = Ingenting
review-someone = Nokon
review-now-under = No under «{ $element }»
review-was-under = Var under «{ $element }»

## What is done with a change.

review-accept = Godta
review-reject = Avvis
review-later = Seinare
review-previous = Den førre
review-reject-cannot = Det som er sletta frå kartet, eller ein figur som er teken ut, blir henta tilbake frå historikken.
review-versions = Historikken
review-versions-count = { $count ->
    [one] Éin versjon
   *[other] { $count } versjonar
}
review-versions-reading = Les historikken …
review-versions-none = Ingenting hende mellom dei to endane.
review-version-by = { $who }, { $when }
review-accept-up-to = Godta hit
review-use-version = Bruk denne versjonen

## Without the history.

review-no-history = Historikken for dette prosjektet blir ikkje teken vare på
review-no-history-text = Ein går gjennom endringar ut frå historikken til prosjektet, som fortel kven som endra kva, og når. Den blir teken vare på frå den blir slått på.
review-turn-on = Ta vare på historikken
review-turn-on-elsewhere = Den blir slått på saman med historikken til prosjektet.
