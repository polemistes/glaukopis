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
io-storing = Ablegen von { $path }
io-no-directory = { $path } hat keinen Ordner

## The network. Shown after "network: ".

network-timeout = { $host } hat nicht rechtzeitig geantwortet
network-host-not-found = { $host } wurde nicht gefunden; besteht eine Verbindung zum Netzwerk?
network-unreachable = { $host } war nicht zu erreichen
network-unreachable-because = { $host } war nicht zu erreichen: { $error }
network-nothing-there = { $host } hat unter dieser Adresse nichts
network-wait = { $host } bittet uns zu warten, bevor wir wieder fragen
network-status = { $host } hat mit einem Fehler geantwortet ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } ist keine Art zu fragen, die hier gebraucht wird

## When the application is opened a second time.

core-in-use-title = Glaukopis ist schon offen
core-in-use = Glaukopis ist schon offen und arbeitet in { $path }. Nur eines kann dort zugleich arbeiten, sonst überschreibt jedes, was das andere geschrieben hat. Machen Sie in dem weiter, das offen ist.
