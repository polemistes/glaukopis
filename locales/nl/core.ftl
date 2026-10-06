# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } kon niet worden gelezen: { $message }
error-not-found = niet gevonden: { $what }
error-network = netwerk: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } is niet geïnstalleerd of kon niet worden gevonden
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } is geïnstalleerd. Glaukopis heeft { $program } { $least } of nieuwer nodig.
program-failed = { $program } is mislukt: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = het eindigde met { $status }
program-stopped = { $program } is gestopt.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = het lezen van { $path }
io-writing = het schrijven van { $path }
io-creating = het aanmaken van { $path }
io-creating-directory-in = het aanmaken van een map in { $path }
io-creating-temporary-in = het aanmaken van een tijdelijk bestand in { $path }
io-creating-temporary = het aanmaken van een tijdelijke map
io-opening = het openen van { $path }
io-removing = het verwijderen van { $path }
io-copying = het kopiëren van { $path }
io-flushing = het wegschrijven van { $path }
io-replacing = het vervangen van { $path }
io-backing-up = het veiligstellen van { $path }
io-storing = het opbergen van { $path }
io-no-directory = { $path } heeft geen map

## The network. Shown after "network: ".

network-timeout = { $host } heeft niet op tijd geantwoord
network-host-not-found = { $host } kon niet worden gevonden; is er verbinding met het netwerk?
network-unreachable = { $host } kon niet worden bereikt
network-unreachable-because = { $host } kon niet worden bereikt: { $error }
network-nothing-there = { $host } heeft niets op dat adres
network-wait = { $host } vraagt ons te wachten voordat we het opnieuw vragen
network-status = { $host } antwoordde met een fout ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } is geen manier van vragen die hier wordt gebruikt

## When the application is opened a second time.

core-in-use-title = Glaukopis is al open
core-in-use = Glaukopis is al open en aan het werk in { $path }. Daar kan er maar één tegelijk werken, anders schrijft de een over wat de ander heeft geschreven. Ga verder in het venster dat al open is.
