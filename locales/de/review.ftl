# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Änderungen
# The button over the text that opens the panel.
review-open = Änderungen durchsehen
review-since-last = Seit Ihrer letzten Durchsicht
review-since-beginning = Seit der Verlauf begann
review-since-session = Seit { $who } begann, { $when }
review-since-named = Seit „{ $name }“
# When the moment compared with was, under what it is.
review-since-when = Ab { $when }
review-choose-since = Ab einem anderen Zeitpunkt durchsehen
review-own = Auch Ihre eigenen Änderungen
review-unit = Durchsehen nach
review-by-sentence = Satz
review-by-paragraph = Absatz
review-left = { $count ->
    [one] Eine Änderung übrig
   *[other] { $count } Änderungen übrig
}
review-position = { $index } von { $count }
review-working = Die Änderungen werden ermittelt…
review-failed = Die Änderungen konnten nicht ermittelt werden.
review-nothing = Nichts mehr durchzusehen
review-nothing-text = Jede Änderung, die die anderen seither gemacht haben, ist angenommen.
review-list = Die Änderungen dieser Karte

## What a change is.

review-kind-changed = Geändert
review-kind-added = Neuer Text
review-kind-removed = Gelöschter Text
review-kind-moved = Verschoben
review-kind-object = { $what ->
    [figure] Abbildung
    [table] Tabelle
    [equation] Gleichung
    [citation] Zitation
    [math] Formel
    [footnote] Anmerkung
    [crossref] Verweis
   *[other] Etwas, das kein Text ist
}
review-kind-put-in = { $what } eingefügt
review-kind-taken-out = { $what } herausgenommen
review-kind-altered = { $what } geändert
review-element-added = Element hinzugefügt
review-element-removed = Element gelöscht
review-element-moved = Element verschoben
review-element-heading = Als Überschrift gedruckt
review-element-no-heading = Nicht mehr als Überschrift gedruckt
review-element-excluded = Aus dem Dokument weggelassen
review-element-included = Wieder ins Dokument aufgenommen
review-element-other = Element geändert
# Where a change is: the name of the element.
review-in = In „{ $element }“
review-moved-from = Aus „{ $element }“
review-untitled = Ohne Titel
review-gone-element = Ein Element, das nicht mehr da ist
review-was = Wie es war
review-is = Wie es ist
review-nothing-there = Nichts
review-someone = Jemand
review-now-under = Jetzt unter „{ $element }“
review-was-under = War unter „{ $element }“

## What is done with a change.

review-accept = Annehmen
review-reject = Verwerfen
review-later = Später
review-previous = Die vorige
review-reject-cannot = Was von der Karte gelöscht oder als Abbildung herausgenommen wurde, wird aus dem Verlauf zurückgeholt.
review-versions = Verlauf dieser Änderung
review-versions-count = { $count ->
    [one] Eine Fassung
   *[other] { $count } Fassungen
}
review-versions-reading = Der Verlauf dieser Änderung wird gelesen…
review-versions-none = Zwischen den beiden Enden ist nichts geschehen.
review-version-by = { $who }, { $when }
review-accept-up-to = Bis hierher annehmen
review-use-version = Diese Fassung nehmen

## Without the history.

review-no-history = Der Verlauf dieses Projekts wird nicht geführt
review-no-history-text = Änderungen werden aus dem Verlauf des Projekts durchgesehen, der sagt, wer was geändert hat und wann. Er wird geführt von dem Augenblick an, in dem er eingeschaltet wird.
review-turn-on = Verlauf führen
review-turn-on-elsewhere = Er wird mit dem Verlauf des Projekts eingeschaltet.
