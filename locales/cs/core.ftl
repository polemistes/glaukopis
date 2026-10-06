# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = nelze přečíst { $path }: { $message }
error-not-found = nenalezeno: { $what }
error-network = síť: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } není nainstalován nebo nebyl nalezen
# A program that is there, but older than what Glaukopis needs.
program-too-old = Je nainstalován { $program } { $version }. Glaukopis potřebuje { $program } { $least } nebo novější.
program-failed = { $program } selhal: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = skončil s { $status }
program-stopped = { $program } byl zastaven.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = čtení { $path }
io-writing = zápis { $path }
io-creating = vytváření { $path }
io-creating-directory-in = vytváření složky v { $path }
io-creating-temporary-in = vytváření dočasného souboru v { $path }
io-creating-temporary = vytváření dočasné složky
io-opening = otevírání { $path }
io-removing = odstraňování { $path }
io-copying = kopírování { $path }
io-flushing = dopisování { $path } na disk
io-replacing = nahrazování { $path }
io-backing-up = zálohování { $path }
io-storing = ukládání { $path }
io-no-directory = { $path } nemá složku

## The network. Shown after "network: ".

network-timeout = { $host } neodpověděl včas
network-host-not-found = { $host } nebyl nalezen; je počítač připojen k síti?
network-unreachable = { $host } je nedostupný
network-unreachable-because = { $host } je nedostupný: { $error }
network-nothing-there = { $host } na této adrese nic nemá
network-wait = { $host } žádá, abychom před dalším dotazem počkali
network-status = { $host } odpověděl chybou ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } není způsob dotazu, který se zde používá

## When the application is opened a second time.

core-in-use-title = Glaukopis už běží
core-in-use = Glaukopis už běží a pracuje v { $path }. V jednu chvíli tam může pracovat jen jeden, jinak by jeden přepisoval, co zapsal druhý. Pokračujte v tom, který už je otevřený.
