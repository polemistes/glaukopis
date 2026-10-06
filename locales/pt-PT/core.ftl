# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = não foi possível ler { $path }: { $message }
error-not-found = não se encontrou { $what }
error-network = rede: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = o { $program } não está instalado ou não foi encontrado
# A program that is there, but older than what Glaukopis needs.
program-too-old = Está instalado o { $program } { $version }. O Glaukopis precisa do { $program } { $least } ou mais recente.
program-failed = o { $program } falhou: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = terminou com { $status }
program-stopped = O { $program } foi interrompido.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = ao ler { $path }
io-writing = ao escrever { $path }
io-creating = ao criar { $path }
io-creating-directory-in = ao criar uma pasta em { $path }
io-creating-temporary-in = ao criar um ficheiro temporário em { $path }
io-creating-temporary = ao criar uma pasta temporária
io-opening = ao abrir { $path }
io-removing = ao remover { $path }
io-copying = ao copiar { $path }
io-flushing = ao gravar { $path } no disco
io-replacing = ao substituir { $path }
io-backing-up = ao fazer uma cópia de segurança de { $path }
io-storing = ao guardar { $path }
io-no-directory = { $path } não está dentro de uma pasta

## The network. Shown after "network: ".

network-timeout = { $host } não respondeu a tempo
network-host-not-found = não foi possível encontrar { $host }; há ligação à rede?
network-unreachable = não foi possível chegar a { $host }
network-unreachable-because = não foi possível chegar a { $host }: { $error }
network-nothing-there = { $host } não tem nada nesse endereço
network-wait = { $host } pede que se espere antes de perguntar de novo
network-status = { $host } respondeu com um erro ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } não é uma forma de pedir que aqui se use

## When the application is opened a second time.

core-in-use-title = O Glaukopis já está aberto
core-in-use = O Glaukopis já está aberto, a trabalhar em { $path }. Só um pode trabalhar aí de cada vez, para que nenhum escreva por cima do que o outro escreveu. Continue no que está aberto.
