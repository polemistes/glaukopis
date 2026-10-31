# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } konnte nicht gelesen werden: { $message }
error-not-found = nicht gefunden: { $what }
error-network = Netzwerk: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } ist nicht installiert oder wurde nicht gefunden
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } ist installiert. Glaukopis braucht { $program } { $least } oder neuer.
program-failed = { $program } ist fehlgeschlagen: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = es endete mit { $status }
program-stopped = { $program } wurde abgebrochen.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = Lesen von { $path }
io-writing = Schreiben von { $path }
io-creating = Anlegen von { $path }
io-creating-directory-in = Anlegen eines Ordners in { $path }
io-creating-temporary-in = Anlegen einer temporären Datei in { $path }
io-creating-temporary = Anlegen eines temporären Ordners
io-opening = Öffnen von { $path }
io-removing = Entfernen von { $path }
io-copying = Kopieren von { $path }
io-flushing = Festschreiben von { $path }
io-replacing = Ersetzen von { $path }
io-backing-up = Sichern von { $path }
io-setting-aside = Beiseitelegen von { $path }
io-storing = Ablegen von { $path }
io-no-directory = { $path } hat keinen Ordner
# $most is in megabytes.
io-too-large = { $path } ist größer als { $most } MB, mehr wird nicht gelesen
io-not-an-archive = { $path } ist kein Zip-Archiv: { $error }

## A file of the application's own that could not be read: it is set aside,
## under its name with the time added, and the application goes on without
## it. Shown at the foot of the window.

# $path is where the file was; $aside the name it has now, in the same folder; $cause what was wrong with it.
core-set-aside = { $path } konnte nicht gelesen werden und ist als { $aside } im selben Ordner beiseitegelegt; Glaukopis macht ohne das weiter, was darin stand. Was nicht stimmte: { $cause }

## The network. Shown after "network: ".

network-timeout = { $host } hat nicht rechtzeitig geantwortet
network-host-not-found = { $host } wurde nicht gefunden; besteht eine Verbindung zum Netzwerk?
network-unreachable = { $host } war nicht zu erreichen
network-unreachable-because = { $host } war nicht zu erreichen: { $error }
network-nothing-there = { $host } hat unter dieser Adresse nichts
network-wait = { $host } bittet uns zu warten, bevor wir wieder fragen
network-status = { $host } hat mit einem Fehler geantwortet ({ $status })
# $most is in megabytes.
network-too-large = { $host } hat mit mehr geantwortet, als Glaukopis annimmt ({ $most } MB)
network-tls = eine sichere Verbindung zu { $host } kam nicht zustande: sein Zertifikat ist auf diesem Computer vielleicht nicht vertrauenswürdig, oder etwas dazwischen, etwa ein Proxy oder eine Firewall, steht im Weg
network-redirects = { $host } hat die Anfrage zu oft von einer Adresse an die nächste weitergeschickt
network-stalled = die Antwort von { $host } kam nicht mehr weiter
network-not-understood = { $host } hat so geantwortet, dass es nicht verstanden werden konnte
# What else went wrong; what was said of it is in the log of the run.
network-failed = { $host } konnte nicht gefragt werden; das Protokoll der Sitzung sagt, warum
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } ist keine Art zu fragen, die hier gebraucht wird

## When the application is opened a second time.

core-in-use-title = Glaukopis ist schon offen
core-in-use = Glaukopis ist schon offen und arbeitet in { $path }. Nur eines kann dort zugleich arbeiten, sonst überschreibt jedes, was das andere geschrieben hat. Machen Sie in dem weiter, das offen ist.

## When the application cannot start: its data cannot be made or read.

core-start-failed-title = Glaukopis konnte nicht starten
# What went wrong is given after the colon, as "creating /home/…/library: Permission denied".
core-start-failed = Glaukopis konnte nicht starten. Was schiefging: { $error }
# Said after core-start-failed, where the log of the run could be written.
core-start-failed-log = Mehr darüber, was geschah, steht im Protokoll der Sitzung, { $log }

## When something goes wrong inside Glaukopis itself.

# What the program said of itself is given after the colon, in English.
core-worker-panicked = In Glaukopis selbst ist etwas schiefgegangen, und was gerade getan wurde, ist aufgegeben: { $message }. Das Protokoll der Sitzung sagt mehr.
