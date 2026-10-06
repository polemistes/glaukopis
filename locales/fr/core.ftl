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
io-storing = stockage de { $path }
io-no-directory = { $path } n’a pas de dossier

## The network. Shown after "network: ".

network-timeout = { $host } n’a pas répondu à temps
network-host-not-found = { $host } est introuvable ; y a-t-il une connexion au réseau ?
network-unreachable = { $host } n’a pas pu être joint
network-unreachable-because = { $host } n’a pas pu être joint : { $error }
network-nothing-there = { $host } n’a rien à cette adresse
network-wait = { $host } nous demande d’attendre avant de redemander
network-status = { $host } a répondu par une erreur ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } n’est pas une manière de demander qui soit utilisée ici

## When the application is opened a second time.

core-in-use-title = Glaukopis est déjà ouvert
core-in-use = Glaukopis est déjà ouvert, et travaille dans { $path }. Un seul peut y travailler à la fois, sans quoi chacun écrirait par-dessus ce que l’autre a écrit. Continuez dans celui qui est ouvert.
