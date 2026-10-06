# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = nu s-a putut citi { $path }: { $message }
error-not-found = nu s-a găsit: { $what }
error-network = rețea: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } nu este instalat sau nu a putut fi găsit
# A program that is there, but older than what Glaukopis needs.
program-too-old = Este instalat { $program } { $version }. Glaukopis are nevoie de { $program } { $least } sau mai nou.
program-failed = { $program } a eșuat: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = s-a încheiat cu { $status }
program-stopped = { $program } a fost oprit.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = la citirea { $path }
io-writing = la scrierea { $path }
io-creating = la crearea { $path }
io-creating-directory-in = la crearea unui dosar în { $path }
io-creating-temporary-in = la crearea unui fișier temporar în { $path }
io-creating-temporary = la crearea unui dosar temporar
io-opening = la deschiderea { $path }
io-removing = la ștergerea { $path }
io-copying = la copierea { $path }
io-flushing = la golirea { $path }
io-replacing = la înlocuirea { $path }
io-backing-up = la copierea de siguranță a { $path }
io-storing = la păstrarea { $path }
io-no-directory = { $path } nu are dosar

## The network. Shown after "network: ".

network-timeout = { $host } nu a răspuns la timp
network-host-not-found = { $host } nu a putut fi găsit; există o legătură la rețea?
network-unreachable = { $host } nu a putut fi atins
network-unreachable-because = { $host } nu a putut fi atins: { $error }
network-nothing-there = { $host } nu are nimic la acea adresă
network-wait = { $host } ne cere să așteptăm înainte de a întreba din nou
network-status = { $host } a răspuns cu o eroare ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } nu este un fel de cerere folosit aici

## When the application is opened a second time.

core-in-use-title = Glaukopis este deja deschis
core-in-use = Glaukopis este deja deschis și lucrează în { $path }. Numai unul poate lucra acolo o dată, ca să nu scrie fiecare peste ce a scris celălalt. Continuați în cel care este deschis.
