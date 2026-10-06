# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = nije moguće pročitati { $path }: { $message }
error-not-found = nije pronađeno: { $what }
error-network = mreža: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } nije instaliran ili ga nije moguće pronaći
# A program that is there, but older than what Glaukopis needs.
program-too-old = Instaliran je { $program } { $version }. Glaukopis treba { $program } { $least } ili noviji.
program-failed = { $program } nije uspio: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = završio je s { $status }
program-stopped = { $program } je zaustavljen.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = čitanje { $path }
io-writing = pisanje { $path }
io-creating = stvaranje { $path }
io-creating-directory-in = stvaranje direktorija u { $path }
io-creating-temporary-in = stvaranje privremene datoteke u { $path }
io-creating-temporary = stvaranje privremenog direktorija
io-opening = otvaranje { $path }
io-removing = uklanjanje { $path }
io-copying = kopiranje { $path }
io-flushing = ispisivanje { $path }
io-replacing = zamjena { $path }
io-backing-up = izrada sigurnosne kopije { $path }
io-storing = pohrana { $path }
io-no-directory = { $path } nema direktorija

## The network. Shown after "network: ".

network-timeout = { $host } nije odgovorio na vrijeme
network-host-not-found = { $host } nije moguće pronaći; postoji li veza s mrežom?
network-unreachable = { $host } nije dostupan
network-unreachable-because = { $host } nije dostupan: { $error }
network-nothing-there = { $host } nema ništa na toj adresi
network-wait = { $host } traži da pričekamo prije ponovnog upita
network-status = { $host } je odgovorio pogreškom ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } nije način upita koji se ovdje koristi

## When the application is opened a second time.

core-in-use-title = Glaukopis je već otvoren
core-in-use = Glaukopis je već otvoren i radi u { $path }. Ondje može raditi samo jedan odjednom, da jedan ne prepiše što je drugi napisao. Nastavite u onome koji je otvoren.
