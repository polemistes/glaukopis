# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Wijzigingen
# The button over the text that opens the panel.
review-open = Wijzigingen nakijken
review-since-last = Sinds je voor het laatst hebt nagekeken
review-since-beginning = Sinds het begin van de geschiedenis
review-since-session = Sinds { $who } begon, { $when }
review-since-named = Sinds ‘{ $name }’
# When the moment compared with was, under what it is.
review-since-when = Vanaf { $when }
review-choose-since = Vanaf een ander moment nakijken
review-own = Ook je eigen wijzigingen
review-unit = Nakijken per
review-by-sentence = Zin
review-by-paragraph = Alinea
review-left = { $count ->
    [one] Nog één wijziging
   *[other] Nog { $count } wijzigingen
}
review-position = { $index } van { $count }
review-working = De wijzigingen worden uitgewerkt…
review-failed = De wijzigingen konden niet worden uitgewerkt.
review-nothing = Niets meer na te kijken
review-nothing-text = Elke wijziging die de anderen sindsdien hebben gemaakt, is aanvaard.
review-list = De wijzigingen van deze mindmap

## What a change is.

review-kind-changed = Gewijzigd
review-kind-added = Nieuwe tekst
review-kind-removed = Gewiste tekst
review-kind-moved = Verplaatst
review-kind-object = { $what ->
    [figure] Figuur
    [table] Tabel
    [equation] Vergelijking
    [citation] Verwijzing
    [math] Formule
    [footnote] Noot
    [crossref] Kruisverwijzing
   *[other] Iets dat geen tekst is
}
review-kind-put-in = { $what } ingevoegd
review-kind-taken-out = { $what } verwijderd
review-kind-altered = { $what } gewijzigd
review-element-added = Element toegevoegd
review-element-removed = Element gewist
review-element-moved = Element verplaatst
review-element-heading = Als kop gedrukt
review-element-no-heading = Niet meer als kop gedrukt
review-element-excluded = Uit het document weggelaten
review-element-included = Weer in het document opgenomen
review-element-other = Element gewijzigd
# Where a change is: the name of the element.
review-in = In ‘{ $element }’
review-moved-from = Uit ‘{ $element }’
review-untitled = Zonder titel
review-gone-element = Een element dat er niet meer is
review-was = Zoals het was
review-is = Zoals het is
review-nothing-there = Niets
review-someone = Iemand
review-now-under = Nu onder ‘{ $element }’
review-was-under = Stond onder ‘{ $element }’

## What is done with a change.

review-accept = Aanvaarden
review-reject = Afwijzen
review-later = Later
review-previous = De vorige
review-reject-cannot = Wat van de mindmap is gewist, of een figuur die is verwijderd, wordt uit de geschiedenis teruggehaald.
review-versions = Zijn geschiedenis
review-versions-count = { $count ->
    [one] Eén versie
   *[other] { $count } versies
}
review-versions-reading = Zijn geschiedenis wordt gelezen…
review-versions-none = Er is niets gebeurd tussen de twee uiteinden.
review-version-by = { $who }, { $when }
review-accept-up-to = Tot hier aanvaarden
review-use-version = Deze versie gebruiken

## Without the history.

review-no-history = De geschiedenis van dit project wordt niet bijgehouden
review-no-history-text = Wijzigingen worden nagekeken vanuit de geschiedenis van het project, die zegt wie wat heeft gewijzigd, en wanneer. Ze wordt bijgehouden vanaf het moment dat ze wordt aangezet.
review-turn-on = De geschiedenis bijhouden
review-turn-on-elsewhere = Dit wordt aangezet met de geschiedenis van het project.
