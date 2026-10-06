# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = nepodarilo sa prečítať { $path }: { $message }
error-not-found = nenájdené: { $what }
error-network = sieť: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } nie je nainštalovaný alebo sa nenašiel
# A program that is there, but older than what Glaukopis needs.
program-too-old = Nainštalovaný je { $program } { $version }. Glaukopis potrebuje { $program } { $least } alebo novší.
program-failed = { $program } zlyhal: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = skončil s { $status }
program-stopped = { $program } bol zastavený.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = čítanie { $path }
io-writing = zápis { $path }
io-creating = vytváranie { $path }
io-creating-directory-in = vytváranie priečinka v { $path }
io-creating-temporary-in = vytváranie dočasného súboru v { $path }
io-creating-temporary = vytváranie dočasného priečinka
io-opening = otváranie { $path }
io-removing = odstraňovanie { $path }
io-copying = kopírovanie { $path }
io-flushing = zapisovanie { $path } na disk
io-replacing = nahrádzanie { $path }
io-backing-up = zálohovanie { $path }
io-storing = ukladanie { $path }
io-no-directory = { $path } nemá priečinok

## The network. Shown after "network: ".

network-timeout = { $host } neodpovedal včas
network-host-not-found = { $host } sa nenašiel; je pripojenie k sieti?
network-unreachable = { $host } je nedostupný
network-unreachable-because = { $host } je nedostupný: { $error }
network-nothing-there = { $host } nemá na tej adrese nič
network-wait = { $host } žiada, aby sme pred ďalšou otázkou počkali
network-status = { $host } odpovedal chybou ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } nie je spôsob dopytu, ktorý sa tu používa

## When the application is opened a second time.

core-in-use-title = Glaukopis je už otvorený
core-in-use = Glaukopis je už otvorený a pracuje v { $path }. Naraz tam môže pracovať len jeden, aby si navzájom neprepisovali, čo ten druhý napísal. Pokračujte v tom, ktorý je otvorený.
