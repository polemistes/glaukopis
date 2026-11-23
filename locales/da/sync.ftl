# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = Synkronisering
sync-about = Projekter, biblioteket, notesbogen og dine indstillinger bliver synkroniseret mellem enhederne.
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = Kun notesbogen bliver synkroniseret.

## Before it is on.

sync-server = Server
sync-computer-name = Navn på denne enhed
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = Sådan begynder denne enhed
sync-how-start = Begynd her
sync-how-join = Deltag med en kode
sync-password = Serverens adgangskode
sync-code = Kode
sync-start = Start synkronisering
sync-starting = Starter…
sync-join = Deltag
sync-joining = Deltager…
sync-unreachable = Serveren kunne ikke nås.

## While it is on.

sync-working = Synkroniserer…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = Sidst synkroniseret { $when }
sync-never = Ikke synkroniseret endnu
sync-offline = Serveren kan ikke nås. Det, der skrives her, gemmes og sendes, når det er muligt.
sync-refused = Synkroniseringen er stoppet på denne enhed
# The line over the notes of a phone whose app is older than the form of something that is synchronized: the synchronization has stopped on it until the app is updated. The words are the owner's, and the core says the same in the settings (core-sync-update-needed).
sync-outdated = Opdatering er nødvendig for synkronisering.
sync-now = Synkroniser nu
sync-computers = Enheder
sync-this-computer = { $name } (denne enhed)
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = Sidst set { $when }
sync-computers-unread = Serveren kunne ikke spørges, hvilke enheder der er med.
sync-add = Tilføj en enhed…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = Skriv koden på den anden enhed, med { $join } under Synkronisering i dens indstillinger. Den kan bruges én gang, indtil kl. { $until }.
sync-code-failed = Der kunne ikke laves nogen kode.
sync-rename-title = Omdøb enheden
sync-remove-title = Fjern »{ $name }«?
sync-remove-message = Den synkroniseres ikke mere. Det, der er på den, bliver der.
# $why is what went wrong, a sentence of its own.
sync-remove-failed = »{ $name }« kunne ikke fjernes. { $why }
sync-stop = Hold op med at synkronisere på denne enhed
sync-stop-title = Hold op med at synkronisere på denne enhed?
sync-stop-message = Det, der er på denne enhed, bliver her, som det er. Det, der skrives på dine andre enheder, kommer ikke længere hertil, og det, der skrives her, går ikke længere til dem.
sync-stop-message-alone = Det, der er på denne enhed, bliver her, som det er. Det er den eneste enhed, der synkroniseres, så der bliver intet tilbage på serveren.
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = Det, der er på denne enhed, bliver her, som det er. Det er den eneste enhed, der synkroniseres, så der bliver intet tilbage på serveren. Dine projekter og bibliotekets filer er ikke på denne enhed: det, serveren har af dem, bliver slettet.
sync-stop-confirm = Hold op med at synkronisere
sync-stop-failed = Synkroniseringen kunne ikke stoppes

## Written apart.

sync-apart = Der blev skrevet i »{ $name }« på to enheder, mens de var uden forbindelse med hinanden.
sync-apart-show = Vis ændringerne
sync-apart-no-history = Projektets historik gemmes ikke, så ændringerne kan ikke vises. Projektet, som det var før, ligger blandt de tidligere versioner.
sync-apart-earlier = Tidligere versioner
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = enhederne mødtes
