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
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Die Datei ist größer, als dieser Server annimmt: eine Datei darf höchstens { $most } haben.
core-sharing-project-full = Für die Datei ist kein Platz: die Dateien eines Projekts dürfen auf diesem Server zusammen höchstens { $most } haben.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } nimmt kein so großes Bild an.
core-sharing-picture-larger = Ein Bild ist größer, als { $host } annimmt (höchstens { $most } MB), und erreicht die anderen nicht.
core-sharing-picture-not-sent = Ein Bild konnte nicht gesendet werden: { $error }.
core-sharing-picture-not-fetched = Ein Bild konnte nicht geholt werden: { $error }.

## Publishing and joining.

core-sharing-shared-already = Das Projekt ist schon geteilt.
core-sharing-own-code = Der Code gehört zu „{ $name }“, das von diesem Computer aus geteilt wird: Sie haben es schon.
