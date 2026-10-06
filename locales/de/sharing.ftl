# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Dieses Projekt teilen
sharing-lead = Andere können dann über einen Server mit Ihnen zugleich am Projekt arbeiten. Es bleibt auch auf Ihrem Computer und kann ohne den Server bearbeitet werden.
sharing-server = Server
sharing-unreachable = Der Server war nicht zu erreichen.
sharing-unencrypted = Was an diesen Server gesendet wird, ist unterwegs nicht verschlüsselt. Nutzen Sie ihn in einem Netzwerk, dem Sie vertrauen.
sharing-password = Passwort des Servers
sharing-password-hint = Verlangt von denen, die Projekte über ihn teilen. Wer eingeladen wird, braucht keines.
sharing-your-name = Ihr Name
sharing-your-name-hint = Denen gezeigt, mit denen Sie das Projekt teilen.
sharing-your-name-placeholder = Wie die anderen Sie kennen
sharing-share = Teilen
sharing-sharing = Wird geteilt…
sharing-share-failed = Das Projekt konnte nicht geteilt werden.

## While it is shared

sharing-shared-title = Geteiltes Projekt
# Under the title: the server the project is shared through.
sharing-through = Über { $server }
sharing-connected = Verbunden. Was geschrieben wird, ist sofort bei den anderen.
sharing-connecting = Verbindung wird aufgebaut…
sharing-offline = Der Server ist nicht zu erreichen. Was Sie schreiben, wird hier aufbewahrt und nachgetragen, sobald es geht.
sharing-too-large = Der Server nimmt die letzten Änderungen nicht an: mit ihnen wäre das Projekt größer, als er aufnimmt. Sie werden hier aufbewahrt. Wer den Server betreibt, kann größere Projekte zulassen.
sharing-your-name-seen = Wie die anderen Sie sehen.

## Invitations

sharing-invite = Einladen
sharing-code-label = Einladungscode
sharing-copy = Einladung kopieren
sharing-copied-button = Kopiert
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Senden Sie ihn dem, den Sie einladen; der wählt { $join } und gibt Server und Code ein. Er gilt { $expires }.
sharing-make-code = Einladungscode erzeugen
sharing-make-another = Noch einen Code erzeugen
sharing-options = Optionen
sharing-fewer-options = Weniger Optionen
sharing-for = Für
sharing-one-person = Eine Person
sharing-several-people = Mehrere Personen
sharing-good-for = Gültig
sharing-a-day = Einen Tag
sharing-a-week = Eine Woche
sharing-a-month = Einen Monat
sharing-until-withdrawn = Bis er zurückgezogen wird
sharing-withdraw = Zurückziehen
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = erzeugt { $when }
sharing-codes-once = Ein Code wird einmal gezeigt, wenn er erzeugt wird: der Server behält von ihm nicht mehr, als er braucht, um ihn wiederzuerkennen. Um einen noch einmal zu senden, erzeugen Sie einen neuen.
sharing-for-several = für mehrere
sharing-for-one = für eine Person
sharing-for-more = für { $count } weitere
sharing-hours-left = noch { $count } Std.
sharing-days-left = { $count ->
    [one] noch { $count } Tag
   *[other] noch { $count } Tage
}
sharing-used = { $count ->
    [one] einmal verwendet
   *[other] { $count }-mal verwendet
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Treten Sie „{ $project }“ in Glaukopis bei: wählen Sie „{ $join }“ und geben Sie ein
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Code: { $code }
sharing-copied = Die Einladung wurde kopiert
sharing-copied-detail = Fügen Sie sie in eine Nachricht an den ein, den Sie einladen.
sharing-invite-failed = Die Einladung konnte nicht erzeugt werden
sharing-copy-failed = Die Einladung konnte nicht kopiert werden
sharing-withdraw-failed = Die Einladung konnte nicht zurückgezogen werden

## Who has the project

sharing-who = Wer das Projekt hat
sharing-list-unreachable = Die Liste ist beim Server, der nicht zu erreichen ist.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Eigentümer
sharing-the-owner = Wer es teilt
sharing-you = { $name } (Sie)
sharing-here = Jetzt hier
sharing-not-here = Jetzt nicht hier
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Zuletzt hier { $ago }
sharing-remove-member = { $name } entfernen
sharing-none-joined = Noch niemand ist beigetreten.
sharing-remove-title = { $name } entfernen?
sharing-remove-message = { $name } behält das Projekt, wie es jetzt ist, und bekommt nicht mehr, was von nun an geschrieben wird.
sharing-remove-failed = { $name } konnte nicht entfernt werden
# What the others see you called, when you have not given a name.
sharing-name-owner = Der Eigentümer
sharing-name-member = Ein Mitglied
# The others who have the project open, shown by their initials.
sharing-present = Jetzt hier: { $names }
sharing-is-here = { $name } ist hier

## Ending the sharing

sharing-stop = Teilen beenden
sharing-stop-title = Dieses Projekt nicht mehr teilen?
sharing-stop-message = Das Projekt wird vom Server genommen. Sie und alle, mit denen Sie es geteilt haben, behalten es, wie es jetzt ist, jeder für sich.
sharing-stopped = Das Projekt wird nicht mehr geteilt
sharing-leave = Verlassen
sharing-leave-project = Projekt verlassen
sharing-leave-title = Dieses Projekt verlassen?
sharing-leave-message = Sie behalten das Projekt, wie es jetzt ist. Sie bekommen nicht mehr, was die anderen schreiben, und sie nicht, was Sie schreiben.
sharing-left = Sie haben das Projekt verlassen
sharing-untold-title = Dem Server konnte es nicht gesagt werden
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Sie können das Teilen auf diesem Computer trotzdem beenden; das Projekt bleibt dann auf dem Server, bis es ihm gesagt werden kann.
sharing-end-here = Hier beenden
sharing-keep = Weiter teilen
sharing-end-failed = Das Teilen konnte nicht beendet werden

## Joining a shared project

sharing-join-title = Einem geteilten Projekt beitreten
sharing-join-about = Mit dem Server und dem Code, die Sie bekommen haben
sharing-code = Code
sharing-your-name-join-hint = Den anderen im Projekt gezeigt.
sharing-join = Beitreten
sharing-joining = Wird beigetreten…
sharing-failed = Das hat nicht geklappt.
