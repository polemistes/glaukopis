# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = no se pudo leer { $path }: { $message }
error-not-found = no se encontró: { $what }
error-network = red: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } no está instalado o no se encontró
# A program that is there, but older than what Glaukopis needs.
program-too-old = Está instalado { $program } { $version }. Glaukopis necesita { $program } { $least } o más reciente.
program-failed = { $program } falló: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = terminó con { $status }
program-stopped = Se detuvo { $program }.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = al leer { $path }
io-writing = al escribir { $path }
io-creating = al crear { $path }
io-creating-directory-in = al crear una carpeta en { $path }
io-creating-temporary-in = al crear un archivo temporal en { $path }
io-creating-temporary = al crear una carpeta temporal
io-opening = al abrir { $path }
io-removing = al eliminar { $path }
io-copying = al copiar { $path }
io-flushing = al terminar de escribir { $path }
io-replacing = al reemplazar { $path }
io-backing-up = al hacer una copia de seguridad de { $path }
io-storing = al almacenar { $path }
io-no-directory = { $path } no está dentro de ninguna carpeta

## The network. Shown after "network: ".

network-timeout = { $host } no respondió a tiempo
network-host-not-found = no se encontró { $host }; ¿hay conexión a la red?
network-unreachable = no se pudo conectar con { $host }
network-unreachable-because = no se pudo conectar con { $host }: { $error }
network-nothing-there = { $host } no tiene nada en esa dirección
network-wait = { $host } pide esperar antes de volver a preguntar
network-status = { $host } respondió con un error ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } no es una forma de preguntar que se use aquí

## When the application is opened a second time.

core-in-use-title = Glaukopis ya está abierto
core-in-use = Glaukopis ya está abierto y trabajando en { $path }. Solo uno puede trabajar ahí a la vez, para que ninguno escriba encima de lo que el otro ha escrito. Siga en el que ya está abierto.
