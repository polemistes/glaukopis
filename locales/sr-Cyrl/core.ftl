# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } није могло да се прочита: { $message }
error-not-found = није пронађено: { $what }
error-network = мрежа: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } није инсталиран или није могао да се нађе
# A program that is there, but older than what Glaukopis needs.
program-too-old = Инсталиран је { $program } { $version }. Glaukopis тражи { $program } { $least } или новији.
program-failed = { $program } није успео: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = завршио се са { $status }
program-stopped = { $program } је заустављен.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = читање { $path }
io-writing = писање { $path }
io-creating = прављење { $path }
io-creating-directory-in = прављење фасцикле у { $path }
io-creating-temporary-in = прављење привремене датотеке у { $path }
io-creating-temporary = прављење привремене фасцикле
io-opening = отварање { $path }
io-removing = уклањање { $path }
io-copying = копирање { $path }
io-flushing = испис { $path } на диск
io-replacing = замена { $path }
io-backing-up = прављење резервне копије { $path }
io-storing = смештање { $path }
io-no-directory = { $path } нема фасциклу

## The network. Shown after "network: ".

network-timeout = { $host } није одговорио на време
network-host-not-found = { $host } није могао да се нађе; има ли везе с мрежом?
network-unreachable = { $host } није доступан
network-unreachable-because = { $host } није доступан: { $error }
network-nothing-there = { $host } нема ништа на тој адреси
network-wait = { $host } тражи да сачекамо пре него што поново питамо
network-status = { $host } је одговорио грешком ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } није начин питања који се овде користи

## When the application is opened a second time.

core-in-use-title = Glaukopis је већ отворен
core-in-use = Glaukopis је већ отворен и ради у { $path }. Тамо може да ради само један, да један другом не би преписивао написано. Наставите у оном који је отворен.
