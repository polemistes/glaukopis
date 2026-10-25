# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = could not read { $path }: { $message }
error-not-found = not found: { $what }
error-network = network: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } is not installed or could not be found
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } is installed. Glaukopis needs { $program } { $least } or newer.
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
io-setting-aside = setting aside { $path }
io-storing = storing { $path }
io-no-directory = { $path } has no directory
# $most is in megabytes.
io-too-large = { $path } is larger than { $most } MB, which is the most that is read
io-not-an-archive = { $path } is not a zip archive: { $error }

## A file of the application's own that could not be read: it is set aside,
## under its name with the time added, and the application goes on without
## it. Shown at the foot of the window.

# $path is where the file was; $aside the name it has now, in the same folder; $cause what was wrong with it.
core-set-aside = { $path } could not be read, and is set aside as { $aside } in the same folder; Glaukopis goes on without what it held. What was wrong: { $cause }

## The network. Shown after "network: ".

network-timeout = { $host } did not answer in time
network-host-not-found = { $host } could not be found; is there a connection to the network?
network-unreachable = { $host } could not be reached
network-unreachable-because = { $host } could not be reached: { $error }
network-nothing-there = { $host } has nothing at that address
network-wait = { $host } asks us to wait before asking again
network-status = { $host } answered with an error ({ $status })
# $most is in megabytes.
network-too-large = { $host } answered with more than Glaukopis takes ({ $most } MB)
network-tls = a secure connection to { $host } could not be made: its certificate may not be trusted on this computer, or something between them, such as a proxy or a firewall, is in the way
network-redirects = { $host } sent the question on from one address to another too many times
network-stalled = the answer of { $host } stopped coming
network-not-understood = { $host } answered in a way that could not be understood
# What else went wrong; what was said of it is in the log of the run.
network-failed = { $host } could not be asked; the log of the run says why
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } is not a way of asking that is used here

## When the application is opened a second time.

core-in-use-title = Glaukopis is open already
core-in-use = Glaukopis is already open, and at work in { $path }. Only one can work there at a time, lest each write over what the other has written. Go on in the one that is open.

## When the application cannot start: its data cannot be made or read.

core-start-failed-title = Glaukopis could not start
# What went wrong is given after the colon, as "creating /home/…/library: Permission denied".
core-start-failed = Glaukopis could not start. What went wrong: { $error }
# Said after core-start-failed, where the log of the run could be written.
core-start-failed-log = More of what happened is in the log of the run, { $log }

## When something goes wrong inside Glaukopis itself.

# What the program said of itself is given after the colon, in English.
core-worker-panicked = Something went wrong inside Glaukopis, and what was being done was given up: { $message }. The log of the run has more.
