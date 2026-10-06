# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = kunne ikke læse { $path }: { $message }
error-not-found = ikke fundet: { $what }
error-network = netværket: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } er ikke installeret eller blev ikke fundet
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } er installeret. Glaukopis har brug for { $program } { $least } eller nyere.
program-failed = { $program } mislykkedes: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = det endte med { $status }
program-stopped = { $program } blev standset.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = kunne ikke læse { $path }
io-writing = kunne ikke skrive { $path }
io-creating = kunne ikke oprette { $path }
io-creating-directory-in = kunne ikke oprette en mappe i { $path }
io-creating-temporary-in = kunne ikke oprette en midlertidig fil i { $path }
io-creating-temporary = kunne ikke oprette en midlertidig mappe
io-opening = kunne ikke åbne { $path }
io-removing = kunne ikke fjerne { $path }
io-copying = kunne ikke kopiere { $path }
io-flushing = kunne ikke skrive { $path } færdigt til disken
io-replacing = kunne ikke erstatte { $path }
io-backing-up = kunne ikke tage sikkerhedskopi af { $path }
io-storing = kunne ikke gemme { $path }
io-no-directory = { $path } ligger ikke i nogen mappe

## The network. Shown after "network: ".

network-timeout = { $host } svarede ikke i tide
network-host-not-found = { $host } kunne ikke findes; er der forbindelse til nettet?
network-unreachable = { $host } kunne ikke nås
network-unreachable-because = { $host } kunne ikke nås: { $error }
network-nothing-there = { $host } har intet på den adresse
network-wait = { $host } beder os vente, før vi spørger igen
network-status = { $host } svarede med en fejl ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } er ikke en måde at spørge på, som bruges her

## When the application is opened a second time.

core-in-use-title = Glaukopis er allerede åbent
core-in-use = Glaukopis er allerede åbent og arbejder i { $path }. Kun ét kan arbejde der ad gangen, ellers skriver det ene oven i det, det andet har skrevet. Fortsæt i det, der er åbent.
