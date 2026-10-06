# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = kunde inte läsa { $path }: { $message }
error-not-found = hittades inte: { $what }
error-network = nätverket: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } är inte installerat eller kunde inte hittas
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } är installerat. Glaukopis behöver { $program } { $least } eller nyare.
program-failed = { $program } misslyckades: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = det slutade med { $status }
program-stopped = { $program } stoppades.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = läsningen av { $path }
io-writing = skrivningen av { $path }
io-creating = skapandet av { $path }
io-creating-directory-in = skapandet av en mapp i { $path }
io-creating-temporary-in = skapandet av en tillfällig fil i { $path }
io-creating-temporary = skapandet av en tillfällig mapp
io-opening = öppnandet av { $path }
io-removing = borttagningen av { $path }
io-copying = kopieringen av { $path }
io-flushing = tömningen av { $path }
io-replacing = ersättandet av { $path }
io-backing-up = säkerhetskopieringen av { $path }
io-storing = lagringen av { $path }
io-no-directory = { $path } har ingen mapp

## The network. Shown after "network: ".

network-timeout = { $host } svarade inte i tid
network-host-not-found = { $host } kunde inte hittas; finns det någon förbindelse med nätet?
network-unreachable = { $host } kunde inte nås
network-unreachable-because = { $host } kunde inte nås: { $error }
network-nothing-there = { $host } har inget på den adressen
network-wait = { $host } ber oss vänta innan vi frågar igen
network-status = { $host } svarade med ett fel ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } är inte ett sätt att fråga som används här

## When the application is opened a second time.

core-in-use-title = Glaukopis är redan öppet
core-in-use = Glaukopis är redan öppet och arbetar i { $path }. Bara ett kan arbeta där åt gången, så att inte det ena skriver över vad det andra har skrivit. Fortsätt i det som är öppet.
