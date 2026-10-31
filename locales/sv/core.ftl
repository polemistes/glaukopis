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
io-setting-aside = undanläggningen av { $path }
io-storing = lagringen av { $path }
io-no-directory = { $path } har ingen mapp
# $most is in megabytes.
io-too-large = { $path } är större än { $most } MB, vilket är det mesta som läses
io-not-an-archive = { $path } är inte ett zip-arkiv: { $error }

## A file of the application's own that could not be read: it is set aside,
## under its name with the time added, and the application goes on without
## it. Shown at the foot of the window.

# $path is where the file was; $aside the name it has now, in the same folder; $cause what was wrong with it.
core-set-aside = { $path } kunde inte läsas, och har lagts undan som { $aside } i samma mapp; Glaukopis fortsätter utan det som stod i den. Det som var fel: { $cause }

## The network. Shown after "network: ".

network-timeout = { $host } svarade inte i tid
network-host-not-found = { $host } kunde inte hittas; finns det någon förbindelse med nätet?
network-unreachable = { $host } kunde inte nås
network-unreachable-because = { $host } kunde inte nås: { $error }
network-nothing-there = { $host } har inget på den adressen
network-wait = { $host } ber oss vänta innan vi frågar igen
network-status = { $host } svarade med ett fel ({ $status })
# $most is in megabytes.
network-too-large = { $host } svarade med mer än Glaukopis tar emot ({ $most } MB)
network-tls = ingen säker förbindelse med { $host } kunde upprättas: dess certifikat är kanske inte betrott på den här datorn, eller så står något emellan, som en proxy eller en brandvägg, i vägen
network-redirects = { $host } skickade frågan vidare från en adress till en annan för många gånger
network-stalled = svaret från { $host } slutade komma
network-not-understood = { $host } svarade på ett sätt som inte kunde förstås
# What else went wrong; what was said of it is in the log of the run.
network-failed = { $host } kunde inte tillfrågas; körningens logg säger varför
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } är inte ett sätt att fråga som används här

## When the application is opened a second time.

core-in-use-title = Glaukopis är redan öppet
core-in-use = Glaukopis är redan öppet och arbetar i { $path }. Bara ett kan arbeta där åt gången, så att inte det ena skriver över vad det andra har skrivit. Fortsätt i det som är öppet.

## When the application cannot start: its data cannot be made or read.

core-start-failed-title = Glaukopis kunde inte starta
# What went wrong is given after the colon, as "creating /home/…/library: Permission denied".
core-start-failed = Glaukopis kunde inte starta. Det som gick fel: { $error }
# Said after core-start-failed, where the log of the run could be written.
core-start-failed-log = Mer om vad som hände står i körningens logg, { $log }

## When something goes wrong inside Glaukopis itself.

# What the program said of itself is given after the colon, in English.
core-worker-panicked = Något gick fel inne i Glaukopis, och det som höll på att göras gavs upp: { $message }. Körningens logg säger mer.
