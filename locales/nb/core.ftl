# Det kjernen sier til den som bruker programmet, på bokmål.
# Se locales/README.md.

## Feil, slik de vises etter det som ble gjort.

error-parse = kunne ikke lese { $path }: { $message }
error-not-found = ikke funnet: { $what }
error-network = nettverket: { $message }

## Programmene programmet arbeider med: Pandoc, Typst, Tesseract.

program-missing = { $program } er ikke installert, eller ble ikke funnet
program-too-old = { $program } { $version } er installert. Glaukopis trenger { $program } { $least } eller nyere.
program-failed = { $program } mislyktes: { $message }
program-ended = det sluttet med { $status }
program-stopped = { $program } ble stoppet.

## Det som ble gjort da systemet sa nei, vist foran det systemet sa.

io-reading = kunne ikke lese { $path }
io-writing = kunne ikke skrive til { $path }
io-creating = kunne ikke opprette { $path }
io-creating-directory-in = kunne ikke opprette en mappe i { $path }
io-creating-temporary-in = kunne ikke opprette en midlertidig fil i { $path }
io-creating-temporary = kunne ikke opprette en midlertidig mappe
io-opening = kunne ikke åpne { $path }
io-removing = kunne ikke fjerne { $path }
io-copying = kunne ikke kopiere { $path }
io-flushing = kunne ikke skrive { $path } ferdig til disken
io-replacing = kunne ikke erstatte { $path }
io-backing-up = kunne ikke ta sikkerhetskopi av { $path }
io-storing = kunne ikke lagre { $path }
io-no-directory = { $path } ligger ikke i noen mappe

## Nettverket. Vises etter «nettverket: ».

network-timeout = { $host } svarte ikke i tide
network-host-not-found = { $host } ble ikke funnet; er det forbindelse til nettet?
network-unreachable = fikk ikke kontakt med { $host }
network-unreachable-because = fikk ikke kontakt med { $host }: { $error }
network-nothing-there = { $host } har ingenting på den adressen
network-wait = { $host } ber oss vente før vi spør igjen
network-status = { $host } svarte med en feil ({ $status })
network-method = { $method } er ikke en måte å spørre på som brukes her

## Når programmet åpnes en gang til.

core-in-use-title = Glaukopis er allerede åpent
core-in-use = Glaukopis er allerede åpent, og arbeider i { $path }. Bare ett kan arbeide der om gangen, ellers skriver de over det den andre har skrevet. Fortsett i det som er åpent.
