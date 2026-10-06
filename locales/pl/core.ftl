# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = nie udało się odczytać { $path }: { $message }
error-not-found = nie znaleziono: { $what }
error-network = sieć: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } nie jest zainstalowany lub nie można go znaleźć
# A program that is there, but older than what Glaukopis needs.
program-too-old = Zainstalowany jest { $program } w wersji { $version }. Glaukopis potrzebuje wersji { $least } lub nowszej.
program-failed = { $program } zawiódł: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = zakończył się tak: { $status }
program-stopped = { $program } został zatrzymany.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = odczyt { $path }
io-writing = zapis { $path }
io-creating = tworzenie { $path }
io-creating-directory-in = tworzenie folderu w { $path }
io-creating-temporary-in = tworzenie pliku tymczasowego w { $path }
io-creating-temporary = tworzenie folderu tymczasowego
io-opening = otwieranie { $path }
io-removing = usuwanie { $path }
io-copying = kopiowanie { $path }
io-flushing = zapisywanie { $path } na dysk
io-replacing = zastępowanie { $path }
io-backing-up = tworzenie kopii zapasowej { $path }
io-storing = zachowywanie { $path }
io-no-directory = { $path } nie ma folderu nadrzędnego

## The network. Shown after "network: ".

network-timeout = { $host } nie odpowiedział na czas
network-host-not-found = nie można znaleźć { $host }; czy jest połączenie z siecią?
network-unreachable = { $host } jest nieosiągalny
network-unreachable-because = { $host } jest nieosiągalny: { $error }
network-nothing-there = { $host } nie ma nic pod tym adresem
network-wait = { $host } prosi, by odczekać, zanim zapytamy znowu
network-status = { $host } odpowiedział błędem ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } nie jest sposobem pytania, którego się tu używa

## When the application is opened a second time.

core-in-use-title = Glaukopis jest już otwarty
core-in-use = Glaukopis jest już otwarty i pracuje w { $path }. Tylko jeden może tam pracować naraz, by jeden nie nadpisywał tego, co zapisał drugi. Pracuj dalej w tym, który jest otwarty.
