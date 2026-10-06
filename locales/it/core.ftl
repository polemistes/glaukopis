# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = non si è potuto leggere { $path }: { $message }
error-not-found = non trovato: { $what }
error-network = rete: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } non è installato o non si trova
# A program that is there, but older than what Glaukopis needs.
program-too-old = È installato { $program } { $version }. A Glaukopis serve { $program } { $least } o più recente.
program-failed = { $program } non è riuscito: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = è terminato con { $status }
program-stopped = { $program } è stato fermato.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = lettura di { $path }
io-writing = scrittura di { $path }
io-creating = creazione di { $path }
io-creating-directory-in = creazione di una cartella in { $path }
io-creating-temporary-in = creazione di un file temporaneo in { $path }
io-creating-temporary = creazione di una cartella temporanea
io-opening = apertura di { $path }
io-removing = rimozione di { $path }
io-copying = copia di { $path }
io-flushing = scrittura su disco di { $path }
io-replacing = sostituzione di { $path }
io-backing-up = copia di sicurezza di { $path }
io-storing = conservazione di { $path }
io-no-directory = { $path } non è in alcuna cartella

## The network. Shown after "network: ".

network-timeout = { $host } non ha risposto in tempo
network-host-not-found = { $host } non si trova; c'è una connessione alla rete?
network-unreachable = { $host } non è raggiungibile
network-unreachable-because = { $host } non è raggiungibile: { $error }
network-nothing-there = { $host } non ha nulla a quell'indirizzo
network-wait = { $host } chiede di aspettare prima di chiedere di nuovo
network-status = { $host } ha risposto con un errore ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } non è un modo di chiedere che si usa qui

## When the application is opened a second time.

core-in-use-title = Glaukopis è già aperto
core-in-use = Glaukopis è già aperto, e al lavoro in { $path }. Lì può lavorare uno solo alla volta, perché l'uno non scriva sopra ciò che l'altro ha scritto. Continua in quello che è aperto.
