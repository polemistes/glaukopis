# The full history of a project, in English.
# See locales/README.md.

history-title = Geschiedenis
history-between = Tussen de mindmaps en de geschiedenis
history-settings = Instellingen van de geschiedenis
history-failed = De geschiedenis kon niet worden gelezen.
history-reading = De geschiedenis wordt gelezen…

## When it is not kept

history-off = De geschiedenis van dit project wordt niet bijgehouden.
history-on-word = Elke wijziging wordt bewaard
history-off-word = Niet bijgehouden
history-off-about = Zolang ze wordt bijgehouden, wordt elke wijziging bewaard, met wie ze maakte en wanneer: het project kan worden bekeken zoals het op elk moment was, en worden teruggehaald. Het neemt ruimte in, en in een gedeeld project laat het de anderen zien wat ieder schreef, en wanneer.
history-turn-on = De geschiedenis bijhouden

## The moments

# Someone whose name the history does not know.
history-someone = Iemand
history-began = De geschiedenis begint
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = minder fijn bewaard
history-added = { $count ->
    [one] +1 teken
   *[other] +{ $count } tekens
}
history-removed = { $count ->
    [one] −1 teken
   *[other] −{ $count } tekens
}

## The map as it was

history-back = Terug naar nu
history-as-it-was = Zoals het was, { $when }
history-marked = Wat sinds het moment ervoor is veranderd, is gemarkeerd in de kleur van wie het veranderde.
history-map-not-there = Deze mindmap was er toen nog niet.
history-added-by = Toegevoegd door { $name }
history-removed-by = Verwijderd door { $name }
history-changed-by = Gewijzigd door { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = kruisverwijzing
history-name-moment = Dit moment een naam geven
history-name-placeholder = Hoe het moet heten
history-named = Het moment heet ‘{ $name }’.
history-bring-back-element = Dit element terughalen zoals het was
history-bring-back-map = De mindmap terughalen zoals ze was
history-brought-back = Teruggehaald zoals het was. Ongedaan maken neemt het terug.
history-bring-back-failed = Het kon niet worden teruggehaald.
history-open-copy = Openen als een eigen project
history-copy-name = { $name }, zoals het was op { $day }
history-copy-failed = Het project kon niet worden gemaakt.

## Archives

history-open-archive = Een archief openen…
history-archive-kind = Geschiedenis van Glaukopis
history-archive-unread = Het archief kon niet worden gelezen.
history-archive-of = Archief: { $name }
history-archive-close = Sluiten

## Settings

history-keep = De geschiedenis bijhouden
history-room = De geschiedenis neemt { $size } in.
history-turn-off-title = Stoppen met de geschiedenis bijhouden?
history-turn-off-message = Wat is bewaard, wordt gewist. Het project zelf blijft zoals het is.
history-turn-off-shared = Wat is bewaard, wordt gewist, hier en op de computers van degenen met wie het project is gedeeld. Het project zelf blijft zoals het is.
history-turn-off = De geschiedenis wissen
history-finely = Oudere geschiedenis
history-finely-about = Oudere wijzigingen worden samengevoegd, zodat ze minder ruimte innemen en sneller worden gelezen; momenten daarbinnen zijn dan niet meer te onderscheiden. Benoemde momenten, en die waarmee het nakijken vergelijkt, blijven bewaard.
history-hourly = Elk uur tot één samenvoegen na
history-weeks = { $count ->
    [one] week
   *[other] weken
}
history-daily = Elke dag tot één samenvoegen na
history-months = { $count ->
    [one] maand
   *[other] maanden
}
history-before = Wat eraan voorafging
history-before-choose = Kies een moment in de geschiedenis om wat eraan voorafging te archiveren of te wissen.
history-before-about = De geschiedenis vóór { $when } kan in een bestand worden gearchiveerd, om later te bekijken, of worden gewist.
history-archive = Archiveren…
history-delete = Wissen
history-archive-title = De geschiedenis vóór { $when } archiveren?
history-delete-title = De geschiedenis vóór { $when } wissen?
history-cut-message = Wat overblijft, begint met het project zoals het toen was.
history-cut-kept = { $count ->
    [one] Er ligt een benoemd of nagekeken moment vóór dit moment, dat hier niet meer kan worden bekeken.
   *[other] Er liggen { $count } benoemde of nagekeken momenten vóór dit moment, die hier niet meer kunnen worden bekeken.
}
history-cut-not-here = De geschiedenis kan niet vóór dit moment worden afgesneden.
history-cut-failed = De geschiedenis kon niet worden afgesneden.
history-archive-until = tot { $when }
history-archived = De geschiedenis vóór { $when } is gearchiveerd.
history-deleted = De geschiedenis vóór { $when } is gewist.
