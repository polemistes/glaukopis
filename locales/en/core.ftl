# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = could not read { $path }: { $message }
error-not-found = not found: { $what }
error-network = network: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } is not installed or could not be found
program-failed = { $program } failed: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = it ended with { $status }
program-stopped = { $program } was stopped.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = reading { $path }
io-writing = writing { $path }
io-creating = creating { $path }
io-creating-directory-in = creating a directory in { $path }
io-creating-temporary-in = creating a temporary file in { $path }
io-creating-temporary = creating a temporary directory
io-opening = opening { $path }
io-removing = removing { $path }
io-copying = copying { $path }
io-flushing = flushing { $path }
io-replacing = replacing { $path }
io-backing-up = backing up { $path }
io-storing = storing { $path }
io-no-directory = { $path } has no directory

## The network. Shown after "network: ".

network-timeout = { $host } did not answer in time
network-host-not-found = { $host } could not be found; is there a connection to the network?
network-unreachable = { $host } could not be reached
network-unreachable-because = { $host } could not be reached: { $error }
network-nothing-there = { $host } has nothing at that address
network-wait = { $host } asks us to wait before asking again
network-status = { $host } answered with an error ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } is not a way of asking that is used here

## When the application is opened a second time.

core-in-use-title = Glaukopis is open already
core-in-use = Glaukopis is already open, and at work in { $path }. Only one can work there at a time, lest each write over what the other has written. Go on in the one that is open.
