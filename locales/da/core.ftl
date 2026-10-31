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
io-setting-aside = kunne ikke lægge { $path } til side
io-storing = kunne ikke gemme { $path }
io-no-directory = { $path } ligger ikke i nogen mappe
# $most is in megabytes.
io-too-large = { $path } er større end { $most } MB, som er det største, der læses
io-not-an-archive = { $path } er ikke et zip-arkiv: { $error }

## A file of the application's own that could not be read: it is set aside,
## under its name with the time added, and the application goes on without
## it. Shown at the foot of the window.

# $path is where the file was; $aside the name it has now, in the same folder; $cause what was wrong with it.
core-set-aside = { $path } kunne ikke læses og er lagt til side som { $aside } i samme mappe; Glaukopis fortsætter uden det, den indeholdt. Hvad der var galt: { $cause }

## The network. Shown after "network: ".

network-timeout = { $host } svarede ikke i tide
network-host-not-found = { $host } kunne ikke findes; er der forbindelse til nettet?
network-unreachable = { $host } kunne ikke nås
network-unreachable-because = { $host } kunne ikke nås: { $error }
network-nothing-there = { $host } har intet på den adresse
network-wait = { $host } beder os vente, før vi spørger igen
network-status = { $host } svarede med en fejl ({ $status })
# $most is in megabytes.
network-too-large = { $host } svarede med mere, end Glaukopis tager imod ({ $most } MB)
network-tls = der kunne ikke oprettes en sikker forbindelse til { $host }: dens certifikat er måske ikke betroet på denne computer, eller noget imellem dem, som en proxy eller en firewall, står i vejen
network-redirects = { $host } sendte spørgsmålet videre fra den ene adresse til den anden for mange gange
network-stalled = svaret fra { $host } holdt op med at komme
network-not-understood = { $host } svarede på en måde, der ikke kunne forstås
# What else went wrong; what was said of it is in the log of the run.
network-failed = { $host } kunne ikke spørges; kørslens log siger hvorfor
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } er ikke en måde at spørge på, som bruges her

## When the application is opened a second time.

core-in-use-title = Glaukopis er allerede åbent
core-in-use = Glaukopis er allerede åbent og arbejder i { $path }. Kun ét kan arbejde der ad gangen, ellers skriver det ene oven i det, det andet har skrevet. Fortsæt i det, der er åbent.

## When the application cannot start: its data cannot be made or read.

core-start-failed-title = Glaukopis kunne ikke starte
# What went wrong is given after the colon, as "creating /home/…/library: Permission denied".
core-start-failed = Glaukopis kunne ikke starte. Hvad der gik galt: { $error }
# Said after core-start-failed, where the log of the run could be written.
core-start-failed-log = Mere om, hvad der skete, står i kørslens log, { $log }

## When something goes wrong inside Glaukopis itself.

# What the program said of itself is given after the colon, in English.
core-worker-panicked = Noget gik galt inde i Glaukopis, og det, der blev gjort, blev opgivet: { $message }. Kørslens log har mere.
