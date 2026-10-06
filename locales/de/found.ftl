# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Gefundene Zitationen
# On the tab of the panel, beside the other tabs: short.
found-tab = Gefunden
found-between = Zwischen der Karte und den gefundenen Zitationen
found-taken = Was für Zitationen genommen wird
found-taken-always = Was ein Programm erzeugt hat, und Kürzel
found-taken-years = Klammern mit einer Jahreszahl darin
found-taken-named = Anmerkungen, die ein Werk der Bibliothek nennen
found-taken-notes = Jede Anmerkung
found-asking = Die Bibliothek wird gefragt…
found-make-certain = { $count ->
    [one] Aus der sicheren eine Zitation machen
   *[other] Aus den { $count } sicheren Zitationen machen
}
found-made = { $count ->
    [one] Eine Zitation wurde gemacht
   *[other] { $count } Zitationen wurden gemacht
}
found-made-undo = Strg+Z nimmt sie zurück, als einen Schritt.
found-library-failed = Die Bibliothek konnte nicht gefragt werden.
found-nothing = Nichts durchzugehen
found-nothing-looked = In dieser Karte ist keine gefundene Zitation mehr, und nichts darin sieht nach einer aus.
found-nothing-looked-more = In dieser Karte ist keine gefundene Zitation mehr, und nichts darin sieht nach einer aus. Oben kann mehr für Zitationen genommen werden.
found-nothing-not-looked = In dieser Karte ist keine gefundene Zitation mehr. Nach Text, der nur wie eine Zitation aussieht, wird gesucht, wenn Sie oben sagen, was dafür genommen werden soll: Klammern mit einer Jahreszahl darin, oder Anmerkungen.
found-list-label = Was durchzugehen ist
found-untitled = Ohne Titel
found-in-a-note = In einer Anmerkung
# The element of the map a citation stands in.
found-in = In „{ $element }“
found-in-note-of = In einer Anmerkung von „{ $element }“
# Set small and high after the words a note stands after.
found-note-mark = Anm.
found-position = { $index } von { $count }
found-previous = Die vorige
found-next = Die nächste
found-list-show = Liste zeigen
found-list-hide = Liste verbergen
found-later = Später
found-leave = Als Text lassen
found-make = Zur Zitation machen

## How sure the library is of what it proposes.

found-sure-certain = Die Bibliothek hat es sicher
found-sure-likely = Die Bibliothek hat, was es wahrscheinlich ist
found-sure-possible = Die Bibliothek hat, was es sein könnte
found-sure-none = Ein Werk davon hat noch keine Quelle

## By what a citation was found.

found-by-zotero = Von Zotero erzeugt
found-by-mendeley = Von Mendeley erzeugt, oder einem Programm, das schreibt wie es
found-by-key = Ein Kürzel, das eine Quelle nennt
found-by-form = Für eine Zitation genommen, weil es so aussieht

## The citation that is to be made.

found-the-citation = Die Zitation
found-no-works = Sie nennt kein Werk. Fügen Sie eines hinzu, oder lassen Sie sie als den Text, der sie ist.
found-add-work = Werk hinzufügen
found-author-in-text = Autor im Text: Nagy (1979)
found-pick-work = Das zitierte Werk: Autor, Titel, Jahr
found-pick-add = Der Zitation ein Werk hinzufügen
found-too-little = Die Datei sagt zu wenig über dieses Werk, um eine Quelle daraus zu machen
found-reference-failed = Die Quelle konnte nicht angelegt werden

## A citation that stands in a note.

found-in-note = Sie steht in einer Anmerkung
found-note-becomes = Die Anmerkung wird zur Zitation
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Was die Anmerkung sonst sagt, kommt vor und hinter ihre Werke{ $has ->
        [before] : „{ $before }“ davor
        [after] : „{ $after }“ danach
       *[both] : „{ $before }“ davor, „{ $after }“ danach
    }. Der Zitierstil setzt sie in die Zeile oder in eine Anmerkung.
found-note-style = Der Zitierstil setzt sie in die Zeile oder in eine Anmerkung.
found-citation-in-note = Die Zitation steht in der Anmerkung
    .hint = Die Anmerkung bleibt eine Anmerkung, mit allem, was sie sonst sagt.
found-for-all = So für alle folgenden
found-note-not = Sie steht nicht in einer Anmerkung.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Die Anmerkung enthält { $what ->
        [math] eine Formel
        [crossref] einen Verweis
        [citation] eine Zitation
        [hard_break] eine zweite Zeile
       *[other] etwas, das kein Text ist
    }, was die Wörter vor und nach einem Werk nicht aufnehmen können.
found-note-another = Die Anmerkung enthält eine weitere gefundene Zitation, die in den Wörtern nach dieser verloren ginge.

## Why what was asked could not be done.

found-trouble-gone = Sie ist nicht mehr im Text.
found-trouble-changed = Der Text hat sich hier geändert, seit sie vorgeschlagen wurde, und wurde noch einmal angesehen.
found-trouble-cannot = Hier kann keine Zitation daraus gemacht werden.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } und { $second }
found-people-more = { $first } et al.
found-work-a-work = Ein Werk
found-work-looking = { $work } wird in Ihrer Bibliothek gesucht…
found-work-no-tag = { $work } ist ein Kürzel, das keine Quelle Ihrer Bibliothek hat.
found-work-not-found = { $work } wurde in Ihrer Bibliothek nicht gefunden.
found-work-chosen = Von Ihnen gewählt
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Wie Sie für dasselbe Werk gewählt haben
found-work-certain = Sicher
found-work-likely = Wahrscheinlich
found-work-possible = Möglich
# What the text says the work is.
found-work-for = für „{ $work }“
found-work-others = Andere Quellen, die es sein könnten
found-work-or = Oder
found-work-may-be = Es könnte sein
found-work-another = Eine andere…
found-work-find = Suchen…
found-work-add = In die Bibliothek aufnehmen
