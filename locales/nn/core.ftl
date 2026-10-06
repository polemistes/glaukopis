# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = kunne ikkje lese { $path }: { $message }
error-not-found = ikkje funne: { $what }
error-network = nettverket: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } er ikkje installert, eller vart ikkje funne
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } er installert. Glaukopis treng { $program } { $least } eller nyare.
program-failed = { $program } mislukkast: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = det slutta med { $status }
program-stopped = { $program } vart stoppa.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = kunne ikkje lese { $path }
io-writing = kunne ikkje skrive til { $path }
io-creating = kunne ikkje opprette { $path }
io-creating-directory-in = kunne ikkje opprette ei mappe i { $path }
io-creating-temporary-in = kunne ikkje opprette ei mellombels fil i { $path }
io-creating-temporary = kunne ikkje opprette ei mellombels mappe
io-opening = kunne ikkje opne { $path }
io-removing = kunne ikkje fjerne { $path }
io-copying = kunne ikkje kopiere { $path }
io-flushing = kunne ikkje skrive { $path } ferdig til disken
io-replacing = kunne ikkje erstatte { $path }
io-backing-up = kunne ikkje ta tryggingskopi av { $path }
io-storing = kunne ikkje lagre { $path }
io-no-directory = { $path } ligg ikkje i noka mappe

## The network. Shown after "network: ".

network-timeout = { $host } svarte ikkje i tide
network-host-not-found = { $host } vart ikkje funne; er det samband med nettet?
network-unreachable = fekk ikkje kontakt med { $host }
network-unreachable-because = fekk ikkje kontakt med { $host }: { $error }
network-nothing-there = { $host } har ingenting på den adressa
network-wait = { $host } ber oss vente før vi spør igjen
network-status = { $host } svarte med ein feil ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } er ikkje ein måte å spørje på som blir brukt her

## When the application is opened a second time.

core-in-use-title = Glaukopis er allereie ope
core-in-use = Glaukopis er allereie ope, og arbeider i { $path }. Berre eitt kan arbeide der om gongen, elles skriv dei over det den andre har skrive. Hald fram i det som er ope.
