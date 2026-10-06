# The full history of a project, in English.
# See locales/README.md.

history-title = Verlauf
history-between = Zwischen den Karten und dem Verlauf
history-settings = Einstellungen des Verlaufs
history-failed = Der Verlauf konnte nicht gelesen werden.
history-reading = Der Verlauf wird gelesen…

## When it is not kept

history-off = Der Verlauf dieses Projekts wird nicht geführt.
history-on-word = Jede Änderung wird aufbewahrt
history-off-word = Nicht geführt
history-off-about = Solange er geführt wird, wird jede Änderung aufbewahrt, mit wer sie gemacht hat und wann: das Projekt kann angesehen werden, wie es in jedem Augenblick war, und zurückgeholt werden. Das braucht Platz, und in einem geteilten Projekt zeigt es den anderen, was jeder geschrieben hat und wann.
history-turn-on = Verlauf führen

## The moments

# Someone whose name the history does not know.
history-someone = Jemand
history-began = Der Verlauf beginnt
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = gröber aufbewahrt
history-added = { $count ->
    [one] +1 Zeichen
   *[other] +{ $count } Zeichen
}
history-removed = { $count ->
    [one] −1 Zeichen
   *[other] −{ $count } Zeichen
}

## The map as it was

history-back = Zurück zur Gegenwart
history-as-it-was = Stand { $when }
history-marked = Was sich seit dem Zeitpunkt davor geändert hat, ist in der Farbe dessen markiert, der es geändert hat.
history-map-not-there = Diese Karte gab es damals noch nicht.
history-added-by = Hinzugefügt von { $name }
history-removed-by = Entfernt von { $name }
history-changed-by = Geändert von { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = Verweis
history-name-moment = Diesen Zeitpunkt benennen
history-name-placeholder = Wie er heißen soll
history-named = Der Zeitpunkt heißt „{ $name }“.
history-bring-back-element = Dieses Element zurückholen, wie es war
history-bring-back-map = Die Karte zurückholen, wie sie war
history-brought-back = Zurückgeholt, wie es war. Rückgängig nimmt es zurück.
history-bring-back-failed = Es konnte nicht zurückgeholt werden.
history-open-copy = Als eigenes Projekt öffnen
history-copy-name = { $name }, Stand { $day }
history-copy-failed = Das Projekt konnte nicht angelegt werden.

## Archives

history-open-archive = Archiv öffnen…
history-archive-kind = Verlauf von Glaukopis
history-archive-unread = Das Archiv konnte nicht gelesen werden.
history-archive-of = Archiv: { $name }
history-archive-close = Schließen

## Settings

history-keep = Verlauf führen
history-room = Der Verlauf braucht { $size }.
history-turn-off-title = Den Verlauf nicht mehr führen?
history-turn-off-message = Was aufbewahrt wurde, wird gelöscht. Das Projekt selbst bleibt, wie es ist.
history-turn-off-shared = Was aufbewahrt wurde, wird gelöscht, hier und auf den Computern derer, mit denen das Projekt geteilt ist. Das Projekt selbst bleibt, wie es ist.
history-turn-off = Verlauf löschen
history-finely = Älterer Verlauf
history-finely-about = Ältere Änderungen werden zusammengefasst, damit sie weniger Platz brauchen und schneller gelesen sind; Zeitpunkte darin lassen sich dann nicht mehr unterscheiden. Benannte Zeitpunkte und solche, mit denen Durchsichten vergleichen, bleiben erhalten.
history-hourly = Jede Stunde zu einer zusammenfassen nach
history-weeks = { $count ->
    [one] Woche
   *[other] Wochen
}
history-daily = Jeden Tag zu einem zusammenfassen nach
history-months = { $count ->
    [one] Monat
   *[other] Monaten
}
history-before = Was davor war
history-before-choose = Wählen Sie einen Zeitpunkt im Verlauf, um zu archivieren oder zu löschen, was davor war.
history-before-about = Der Verlauf vor { $when } kann in einer Datei archiviert werden, um ihn später anzusehen, oder gelöscht werden.
history-archive = Archivieren…
history-delete = Löschen
history-archive-title = Den Verlauf vor { $when } archivieren?
history-delete-title = Den Verlauf vor { $when } löschen?
history-cut-message = Was bleibt, beginnt mit dem Projekt, wie es damals war.
history-cut-kept = { $count ->
    [one] Ein benannter oder durchgesehener Zeitpunkt liegt davor und kann hier nicht mehr angesehen werden.
   *[other] { $count } benannte oder durchgesehene Zeitpunkte liegen davor und können hier nicht mehr angesehen werden.
}
history-cut-not-here = Der Verlauf kann vor diesem Zeitpunkt nicht herausgenommen werden.
history-cut-failed = Der Verlauf konnte nicht herausgenommen werden.
history-archive-until = bis { $when }
history-archived = Der Verlauf vor { $when } ist archiviert.
history-deleted = Der Verlauf vor { $when } ist gelöscht.
