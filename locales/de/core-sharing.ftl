# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Geben Sie die Adresse des Servers ein.
core-sharing-no-spaces = Die Adresse eines Servers hat keine Leerzeichen.
# The scheme is what was typed before "://".
core-sharing-scheme = Ein Server wird über http oder https erreicht, nicht über „{ $scheme }“.
core-sharing-not-an-address = Das sieht nicht wie die Adresse eines Servers aus.
core-sharing-no-server = Unter { $host } ist kein Glaukopis-Server. Prüfen Sie die Adresse bei dem, der sie Ihnen gegeben hat.
core-sharing-no-answer-behind = { $host } ist da, aber der Server dahinter antwortet nicht
core-sharing-newer = Der Server ist neuer als diese Version von Glaukopis, die auf den neuesten Stand gebracht werden muss, um ihn zu nutzen.

## What the server refuses, by its kind.

core-sharing-no-room = Das Projekt ist nicht mehr auf dem Server.
core-sharing-not-admitted = Der Server lässt diese Kopie des Projekts nicht mehr zu.
core-sharing-not-owner = Das kann nur, wer das Projekt teilt.
core-sharing-bad-code = Der Code ist nicht gültig. Er wurde vielleicht falsch eingegeben, schon verwendet oder zurückgezogen, oder er ist abgelaufen.
core-sharing-exists = Das Projekt ist schon auf dem Server.
core-sharing-full = Der Server hat so viele Projekte, wie er aufnehmen soll.
core-sharing-password-asked = Dieser Server verlangt ein Passwort von denen, die Projekte über ihn teilen.
core-sharing-password-wrong = Das Passwort ist nicht das, das der Server verlangt.
core-sharing-too-many = Von hier aus wurde es zu oft versucht. Versuchen Sie es in zehn Minuten noch einmal.
core-sharing-no-file = Der Server hat das Bild nicht.
core-sharing-server-error = { $host } hat mit einem Fehler geantwortet.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = Das Projekt hat keinen Namen.
core-sharing-bad-id = Die Kennung des Projekts kann der Server nicht verwenden.
core-sharing-many-invitations = Es sind schon fünfzig Einladungen offen; ziehen Sie einige zurück.
core-sharing-no-collaborator = Diese Person ist nicht unter den Mitwirkenden.
core-sharing-not-whole = Die Datei ist nicht vollständig angekommen.
core-sharing-bad-file-name = Eine Datei ist nach dem SHA-256 ihres Inhalts benannt: 64 Zeichen, jedes von 0 bis 9 oder a bis f.
core-sharing-not-as-named = Was gesendet wurde, ist nicht, was sein Name sagt: sein SHA-256 ist ein anderer.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Die Datei ist größer, als dieser Server annimmt: eine Datei darf höchstens { $most } haben.
core-sharing-project-full = Für die Datei ist kein Platz: die Dateien eines Projekts dürfen auf diesem Server zusammen höchstens { $most } haben.

## What the server refuses of the synchronization of a writer's own
## devices, which it keeps together as what it calls a home.

core-sharing-no-home = Der Server bewahrt nicht mehr auf, was diese Geräte synchronisieren.
# The texts of a project, the notebook or the library use something this version does not know.
core-sharing-later = Auf einem anderen Gerät wurde mit einer neueren Version von Glaukopis geschrieben. Bringen Sie Glaukopis auf diesem Gerät auf den neuesten Stand, um es zu synchronisieren.
core-sharing-home-not-admitted = Der Server lässt dieses Gerät nicht mehr zu: es wurde vielleicht aus den synchronisierten Geräten entfernt.
core-sharing-home-full = Der Server synchronisiert die Geräte von so vielen Personen, wie er laut Einstellung darf.
core-sharing-many-computers = Sechzehn Geräte werden schon synchronisiert, mehr geht nicht; entfernen Sie zuerst eines.
core-sharing-many-codes = Es sind schon fünf Codes offen; ziehen Sie einen zurück.
core-sharing-no-computer = Ein solches Gerät ist nicht unter den synchronisierten.
core-sharing-no-computer-name = Das Gerät hat keinen Namen.
core-sharing-bad-kind = Die Art eines Dokuments wird mit einem bis sechzehn Kleinbuchstaben geschrieben.
core-sharing-bad-document = Die Kennung des Dokuments kann der Server nicht verwenden.
core-sharing-many-documents = Der Server bewahrt für diese Geräte so viele Dokumente auf, wie er darf.
core-sharing-not-an-exchange = Der Server konnte nicht lesen, was gesendet wurde.
core-sharing-unreadable-change = Eine gesendete Änderung konnte nicht gelesen werden.
core-sharing-document-too-large = Ein Projekt, das Notizbuch oder die Bibliothek wäre größer, als dieser Server aufbewahrt.
# The most is in the server's words: "10 GB".
core-sharing-home-files-full = Für die Datei ist kein Platz: die synchronisierten Dateien dürfen auf diesem Server zusammen höchstens { $most } haben.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } nimmt kein so großes Bild an.
core-sharing-picture-larger = Ein Bild ist größer, als { $host } annimmt (höchstens { $most } MB), und erreicht die anderen nicht.
core-sharing-picture-not-sent = Ein Bild konnte nicht gesendet werden: { $error }.
core-sharing-picture-not-fetched = Ein Bild konnte nicht geholt werden: { $error }.
# The server gave a picture whose content is not what its name says: damaged on the way or where the server keeps it.
core-sharing-picture-not-as-listed = Ein Bild, das { $host } gab, ist nicht das, das es aufgeführt hat: es wurde unterwegs beschädigt oder dort, wo es aufbewahrt wird.

## Publishing and joining.

core-sharing-shared-already = Das Projekt ist schon geteilt.
core-sharing-own-code = Der Code gehört zu „{ $name }“, das von diesem Computer aus geteilt wird: Sie haben es schon.
