# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = impossible de lire { $path } : { $message }
error-not-found = introuvable : { $what }
error-network = réseau : { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } n’est pas installé ou n’a pas pu être trouvé
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } est installé. Glaukopis a besoin de { $program } { $least } ou plus récent.
program-failed = { $program } a échoué : { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = il s’est terminé avec { $status }
program-stopped = { $program } a été arrêté.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = lecture de { $path }
io-writing = écriture de { $path }
io-creating = création de { $path }
io-creating-directory-in = création d’un dossier dans { $path }
io-creating-temporary-in = création d’un fichier temporaire dans { $path }
io-creating-temporary = création d’un dossier temporaire
io-opening = ouverture de { $path }
io-removing = suppression de { $path }
io-copying = copie de { $path }
io-flushing = fin de l’écriture de { $path }
io-replacing = remplacement de { $path }
io-backing-up = copie de sauvegarde de { $path }
io-setting-aside = mise de côté de { $path }
io-storing = stockage de { $path }
io-no-directory = { $path } n’a pas de dossier

## A file of the application's own that could not be read: it is set aside,
## under its name with the time added, and the application goes on without
## it. Shown at the foot of the window.

# $path is where the file was; $aside the name it has now, in the same folder; $cause what was wrong with it.
core-set-aside = { $path } n’a pas pu être lu, et il est mis de côté sous le nom { $aside }, dans le même dossier ; Glaukopis continue sans ce qu’il contenait. Ce qui n’allait pas : { $cause }

## The network. Shown after "network: ".

network-timeout = { $host } n’a pas répondu à temps
network-host-not-found = { $host } est introuvable ; y a-t-il une connexion au réseau ?
network-unreachable = { $host } n’a pas pu être joint
network-unreachable-because = { $host } n’a pas pu être joint : { $error }
network-nothing-there = { $host } n’a rien à cette adresse
network-wait = { $host } nous demande d’attendre avant de redemander
network-status = { $host } a répondu par une erreur ({ $status })
# $most is in megabytes.
network-too-large = { $host } a répondu par plus que Glaukopis n’en accepte ({ $most } Mo)
network-tls = une connexion sécurisée à { $host } n’a pas pu être établie : son certificat n’est peut-être pas reconnu sur cet ordinateur, ou quelque chose se met en travers, comme un proxy ou un pare-feu
network-redirects = { $host } a renvoyé la demande d’une adresse à une autre trop de fois
network-stalled = la réponse de { $host } a cessé d’arriver
network-not-understood = { $host } a répondu d’une manière qui n’a pas pu être comprise
# What else went wrong; what was said of it is in the log of the run.
network-failed = { $host } n’a pas pu être interrogé ; le journal de l’exécution dit pourquoi
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } n’est pas une manière de demander qui soit utilisée ici

## When the application is opened a second time.

core-in-use-title = Glaukopis est déjà ouvert
core-in-use = Glaukopis est déjà ouvert, et travaille dans { $path }. Un seul peut y travailler à la fois, sans quoi chacun écrirait par-dessus ce que l’autre a écrit. Continuez dans celui qui est ouvert.

## When the application cannot start: its data cannot be made or read.

core-start-failed-title = Glaukopis n’a pas pu démarrer
# What went wrong is given after the colon, as "creating /home/…/library: Permission denied".
core-start-failed = Glaukopis n’a pas pu démarrer. Ce qui n’a pas marché : { $error }
# Said after core-start-failed, where the log of the run could be written.
core-start-failed-log = Le journal de l’exécution en dit davantage : { $log }

## When something goes wrong inside Glaukopis itself.

# What the program said of itself is given after the colon, in English.
core-worker-panicked = Quelque chose n’a pas marché dans Glaukopis même, et ce qui était en cours a été abandonné : { $message }. Le journal de l’exécution en dit davantage.
