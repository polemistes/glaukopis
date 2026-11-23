# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = Synkronisering
sync-about = Projekten, biblioteket, anteckningsboken och dina inställningar synkroniseras mellan enheterna.
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = Bara anteckningsboken synkroniseras.

## Before it is on.

sync-server = Server
sync-computer-name = Namn på den här enheten
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = Hur den här enheten börjar
sync-how-start = Börja här
sync-how-join = Gå med via en kod
sync-password = Serverns lösenord
sync-code = Kod
sync-start = Starta synkronisering
sync-starting = Startar…
sync-join = Gå med
sync-joining = Går med…
sync-unreachable = Servern kunde inte nås.

## While it is on.

sync-working = Synkroniserar…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = Senast synkroniserat { $when }
sync-never = Inte synkroniserat än
sync-offline = Servern kan inte nås. Det som skrivs här sparas och skickas när det går.
sync-refused = Synkroniseringen har stoppats på den här enheten
# The line over the notes of a phone whose app is older than the form of something that is synchronized: the synchronization has stopped on it until the app is updated. The words are the owner's, and the core says the same in the settings (core-sync-update-needed).
sync-outdated = Uppdatering behövs för synkronisering.
sync-now = Synkronisera nu
sync-computers = Enheter
sync-this-computer = { $name } (den här enheten)
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = Senast sedd { $when }
sync-computers-unread = Det gick inte att fråga servern vilka enheter som finns.
sync-add = Lägg till en enhet…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = Skriv in koden på den andra enheten, med { $join } under Synkronisering i inställningarna där. Den kan användas en gång, till klockan { $until }.
sync-code-failed = Ingen kod kunde göras.
sync-rename-title = Byt namn på enheten
sync-remove-title = Ta bort ”{ $name }”?
sync-remove-message = Den synkroniseras inte längre. Det som finns på den blir kvar där.
# $why is what went wrong, a sentence of its own.
sync-remove-failed = ”{ $name }” kunde inte tas bort. { $why }
sync-stop = Sluta synkronisera på den här enheten
sync-stop-title = Sluta synkronisera på den här enheten?
sync-stop-message = Det som finns på den här enheten blir kvar här som det är. Det som skrivs på dina andra enheter kommer inte längre hit, och det som skrivs här går inte längre till dem.
sync-stop-message-alone = Det som finns på den här enheten blir kvar här som det är. Det är den enda enheten som synkroniseras, så inget blir kvar på servern.
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = Det som finns på den här enheten blir kvar här som det är. Det är den enda enheten som synkroniseras, så inget blir kvar på servern. Dina projekt och bibliotekets filer finns inte på den här enheten: det servern har av dem raderas.
sync-stop-confirm = Sluta synkronisera
sync-stop-failed = Synkroniseringen kunde inte stoppas

## Written apart.

sync-apart = ”{ $name }” skrevs i på två enheter medan de inte var i kontakt med varandra.
sync-apart-show = Visa ändringarna
sync-apart-no-history = Dess historik sparas inte, så ändringarna kan inte visas. Projektet som det var förut finns bland dess tidigare versioner.
sync-apart-earlier = Tidigare versioner
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = enheterna möttes
