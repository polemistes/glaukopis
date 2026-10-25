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
io-setting-aside = kunne ikke legge { $path } til side
io-storing = kunne ikke lagre { $path }
io-no-directory = { $path } ligger ikke i noen mappe
# $most er i megabyte.
io-too-large = { $path } er større enn { $most } MB, som er det meste som leses
io-not-an-archive = { $path } er ikke et zip-arkiv: { $error }

## En av programmets egne filer som ikke kunne leses: den legges til side,
## under sitt navn med tiden lagt til, og programmet fortsetter uten den.
## Vises nederst i vinduet.

core-set-aside = { $path } kunne ikke leses, og er lagt til side som { $aside } i samme mappe; Glaukopis fortsetter uten det den inneholdt. Feilen: { $cause }

## Nettverket. Vises etter «nettverket: ».

network-timeout = { $host } svarte ikke i tide
network-host-not-found = { $host } ble ikke funnet; er det forbindelse til nettet?
network-unreachable = fikk ikke kontakt med { $host }
network-unreachable-because = fikk ikke kontakt med { $host }: { $error }
network-nothing-there = { $host } har ingenting på den adressen
network-wait = { $host } ber oss vente før vi spør igjen
network-status = { $host } svarte med en feil ({ $status })
network-too-large = { $host } svarte med mer enn Glaukopis tar imot ({ $most } MB)
network-tls = fikk ikke en sikker forbindelse til { $host }: datamaskinen stoler kanskje ikke på sertifikatet, eller noe imellom, som en proxy eller en brannmur, står i veien
network-redirects = { $host } sendte spørsmålet videre fra én adresse til en annen for mange ganger
network-stalled = svaret fra { $host } stoppet opp
network-not-understood = { $host } svarte på en måte som ikke kunne forstås
network-failed = { $host } kunne ikke spørres; loggen for kjøringen sier hvorfor
network-method = { $method } er ikke en måte å spørre på som brukes her

## Når programmet åpnes en gang til.

core-in-use-title = Glaukopis er allerede åpent
core-in-use = Glaukopis er allerede åpent, og arbeider i { $path }. Bare ett kan arbeide der om gangen, ellers skriver de over det den andre har skrevet. Fortsett i det som er åpent.

## Når programmet ikke kan starte: dataene kan ikke lages eller leses.

core-start-failed-title = Glaukopis kunne ikke starte
core-start-failed = Glaukopis kunne ikke starte. Det som gikk galt: { $error }
core-start-failed-log = Mer om hva som skjedde, står i loggen for kjøringen, { $log }

## Når noe går galt inne i Glaukopis selv.

core-worker-panicked = Noe gikk galt inne i Glaukopis, og det som ble gjort, ble gitt opp: { $message }. Loggen for kjøringen har mer.
