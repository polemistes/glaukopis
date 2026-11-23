# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = Synchronisierung
sync-about = Projekte, die Bibliothek, das Notizbuch und Ihre Einstellungen werden zwischen den Geräten synchronisiert.
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = Nur das Notizbuch wird synchronisiert.

## Before it is on.

sync-server = Server
sync-computer-name = Name dieses Geräts
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = Wie dieses Gerät beginnt
sync-how-start = Hier beginnen
sync-how-join = Mit einem Code beitreten
sync-password = Passwort des Servers
sync-code = Code
sync-start = Synchronisierung starten
sync-starting = Wird gestartet…
sync-join = Beitreten
sync-joining = Wird beigetreten…
sync-unreachable = Der Server war nicht zu erreichen.

## While it is on.

sync-working = Wird synchronisiert…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = Zuletzt synchronisiert { $when }
sync-never = Noch nicht synchronisiert
sync-offline = Der Server ist nicht zu erreichen. Was hier geschrieben wird, wird aufbewahrt und gesendet, sobald es geht.
sync-refused = Die Synchronisierung ist auf diesem Gerät angehalten
# The line over the notes of a phone whose app is older than the form of something that is synchronized: the synchronization has stopped on it until the app is updated. The words are the owner's, and the core says the same in the settings (core-sync-update-needed).
sync-outdated = Für die Synchronisierung ist ein Update nötig.
sync-now = Jetzt synchronisieren
sync-computers = Geräte
sync-this-computer = { $name } (dieses Gerät)
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = Zuletzt gesehen { $when }
sync-computers-unread = Der Server konnte nicht gefragt werden, welche Geräte es gibt.
sync-add = Ein Gerät hinzufügen…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = Geben Sie den Code auf dem anderen Gerät ein: wählen Sie dort { $join } unter „Synchronisierung“ in den Einstellungen. Er kann einmal verwendet werden, bis { $until }.
sync-code-failed = Es konnte kein Code erzeugt werden.
sync-rename-title = Gerät umbenennen
sync-remove-title = „{ $name }“ entfernen?
sync-remove-message = Es wird nicht mehr synchronisiert. Was darauf ist, bleibt dort.
# $why is what went wrong, a sentence of its own.
sync-remove-failed = „{ $name }“ konnte nicht entfernt werden. { $why }
sync-stop = Synchronisierung auf diesem Gerät beenden
sync-stop-title = Synchronisierung auf diesem Gerät beenden?
sync-stop-message = Was auf diesem Gerät ist, bleibt hier, wie es ist. Was auf Ihren anderen Geräten geschrieben wird, kommt nicht mehr hierher, und was hier geschrieben wird, geht nicht mehr zu ihnen.
sync-stop-message-alone = Was auf diesem Gerät ist, bleibt hier, wie es ist. Es ist das einzige synchronisierte Gerät, daher bleibt nichts auf dem Server zurück.
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = Was auf diesem Gerät ist, bleibt hier, wie es ist. Es ist das einzige synchronisierte Gerät, daher bleibt nichts auf dem Server zurück. Ihre Projekte und die Dateien Ihrer Bibliothek sind nicht auf diesem Gerät: was der Server von ihnen aufbewahrt, wird gelöscht.
sync-stop-confirm = Synchronisierung beenden
sync-stop-failed = Die Synchronisierung konnte nicht beendet werden

## Written apart.

sync-apart = In „{ $name }“ wurde auf zwei Geräten geschrieben, während sie keine Verbindung hatten.
sync-apart-show = Die Änderungen zeigen
sync-apart-no-history = Der Verlauf des Projekts wird nicht aufbewahrt, daher können die Änderungen nicht gezeigt werden. Das Projekt, wie es vorher war, ist unter seinen früheren Fassungen.
sync-apart-earlier = Frühere Fassungen
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = Geräte verbunden
