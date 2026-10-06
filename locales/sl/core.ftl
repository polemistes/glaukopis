# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } ni bilo mogoče prebrati: { $message }
error-not-found = ni najdeno: { $what }
error-network = omrežje: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } ni nameščen ali ga ni bilo mogoče najti
# A program that is there, but older than what Glaukopis needs.
program-too-old = Nameščen je { $program } { $version }. Glaukopis potrebuje { $program } { $least } ali novejšega.
program-failed = { $program } ni uspel: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = končal se je ({ $status })
program-stopped = { $program } je bil ustavljen.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = branje { $path }
io-writing = pisanje { $path }
io-creating = ustvarjanje { $path }
io-creating-directory-in = ustvarjanje mape v { $path }
io-creating-temporary-in = ustvarjanje začasne datoteke v { $path }
io-creating-temporary = ustvarjanje začasne mape
io-opening = odpiranje { $path }
io-removing = odstranjevanje { $path }
io-copying = kopiranje { $path }
io-flushing = zapisovanje { $path } na disk
io-replacing = zamenjava { $path }
io-backing-up = varnostno kopiranje { $path }
io-storing = shranjevanje { $path }
io-no-directory = { $path } nima mape

## The network. Shown after "network: ".

network-timeout = { $host } ni odgovoril pravočasno
network-host-not-found = { $host } ni bilo mogoče najti; je računalnik povezan v omrežje?
network-unreachable = { $host } ni dosegljiv
network-unreachable-because = { $host } ni dosegljiv: { $error }
network-nothing-there = { $host } na tem naslovu nima ničesar
network-wait = { $host } prosi, naj pred novim vprašanjem počakamo
network-status = { $host } je odgovoril z napako ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } ni način spraševanja, ki bi se tu uporabljal

## When the application is opened a second time.

core-in-use-title = Glaukopis je že odprt
core-in-use = Glaukopis je že odprt in dela v { $path }. Tam lahko dela le eden naenkrat, sicer bi vsak prepisal, kar je zapisal drugi. Nadaljujte v tistem, ki je odprt.
