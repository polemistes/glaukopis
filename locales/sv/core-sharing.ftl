# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Skriv in serverns adress.
core-sharing-no-spaces = En servers adress har inga mellanslag.
# The scheme is what was typed before "://".
core-sharing-scheme = En server nås med http eller https, inte med ”{ $scheme }”.
core-sharing-not-an-address = Det ser inte ut som adressen till en server.
core-sharing-no-server = Det finns ingen Glaukopis-server på { $host }. Kontrollera adressen med den som gav dig den.
core-sharing-no-answer-behind = { $host } finns, men servern bakom svarar inte
core-sharing-newer = Servern är nyare än den här versionen av Glaukopis, som måste uppdateras för att kunna använda den.

## What the server refuses, by its kind.

core-sharing-no-room = Projektet finns inte längre på servern.
core-sharing-not-admitted = Servern släpper inte längre in den här kopian av projektet.
core-sharing-not-owner = Bara den som delar projektet kan göra detta.
core-sharing-bad-code = Koden gäller inte. Den kan vara felskriven, redan använd, återkallad, eller så har den gått ut.
core-sharing-exists = Projektet finns redan på servern.
core-sharing-full = Servern rymmer så många projekt som den är inställd på att rymma.
core-sharing-password-asked = Den här servern begär lösenord av dem som delar projekt genom den.
core-sharing-password-wrong = Lösenordet är inte det servern begär.
core-sharing-too-many = För många försök har gjorts härifrån. Försök igen om tio minuter.
core-sharing-no-file = Servern har inte bilden.
core-sharing-server-error = { $host } svarade med ett fel.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = Projektet har inget namn.
core-sharing-bad-id = Projektets id är inte ett som servern kan använda.
core-sharing-many-invitations = Det finns redan femtio öppna inbjudningar; återkalla några.
core-sharing-no-collaborator = Det finns ingen sådan medarbetare.
core-sharing-not-whole = Filen kom inte fram hel.
core-sharing-bad-file-name = En fil namnges efter SHA-256 av det den innehåller: 64 tecken, vart och ett 0 till 9 eller a till f.
core-sharing-not-as-named = Det som skickades är inte det som dess namn säger: dess SHA-256 är en annan.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Filen är större än vad den här servern tar emot: en fil får rymma högst { $most }.
core-sharing-project-full = Det finns inte plats för filen: ett projekts filer får tillsammans rymma högst { $most } på den här servern.

## What the server refuses of the synchronization of a writer's own
## devices, which it keeps together as what it calls a home.

core-sharing-no-home = Servern har inte längre det som de här enheterna synkroniserar.
# The texts of a project, the notebook or the library use something this version does not know.
core-sharing-later = Något skrevs på en annan enhet av en senare version av Glaukopis. Uppdatera den här för att synkronisera det.
core-sharing-home-not-admitted = Servern släpper inte längre in den här enheten: den kan ha tagits bort från dem som synkroniseras.
core-sharing-home-full = Servern synkroniserar enheterna för så många skribenter som den är inställd på.
core-sharing-many-computers = Sexton enheter synkroniseras redan, vilket är det mesta; ta bort en först.
core-sharing-many-codes = Det finns redan fem öppna koder; återkalla en.
core-sharing-no-computer = Det finns ingen sådan enhet bland dem som synkroniseras.
core-sharing-no-computer-name = Enheten har inget namn.
core-sharing-bad-kind = Vilket slags dokument det är skrivs med en till sexton små bokstäver.
core-sharing-bad-document = Dokumentets id är inte ett som servern kan använda.
core-sharing-many-documents = Servern har så många dokument för de här enheterna som den får ha.
core-sharing-not-an-exchange = Servern kunde inte läsa det som skickades.
core-sharing-unreadable-change = En ändring som skickades kunde inte läsas.
core-sharing-document-too-large = Ett projekt, anteckningsboken eller biblioteket skulle bli större än vad den här servern förvarar.
# The most is in the server's words: "10 GB".
core-sharing-home-files-full = Det finns inte plats för filen: de filer som synkroniseras får tillsammans rymma högst { $most } på den här servern.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } tar inte emot en så stor bild som den här.
core-sharing-picture-larger = En bild är större än vad { $host } tar emot (högst { $most } MB), och når inte de andra.
core-sharing-picture-not-sent = En bild kunde inte skickas: { $error }.
core-sharing-picture-not-fetched = En bild kunde inte hämtas: { $error }.
# The server gave a picture whose content is not what its name says: damaged on the way or where the server keeps it.
core-sharing-picture-not-as-listed = En bild som { $host } gav är inte den som den listade: den skadades på vägen eller där den förvaras.

## Publishing and joining.

core-sharing-shared-already = Projektet är redan delat.
core-sharing-own-code = Koden gäller ”{ $name }”, som delas från den här datorn: du har det redan.
