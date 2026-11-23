# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = Sincronizzazione
sync-about = I progetti, la biblioteca, il taccuino e le tue impostazioni verranno sincronizzati tra i dispositivi.
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = Viene sincronizzato solo il taccuino.

## Before it is on.

sync-server = Server
sync-computer-name = Nome di questo dispositivo
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = Come comincia questo dispositivo
sync-how-start = Comincia da qui
sync-how-join = Entra con un codice
sync-password = Password del server
sync-code = Codice
sync-start = Avvia la sincronizzazione
sync-starting = Avvio…
sync-join = Entra
sync-joining = Ingresso…
sync-unreachable = Il server non è raggiungibile.

## While it is on.

sync-working = Sincronizzazione…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = Ultima sincronizzazione: { $when }
sync-never = Non ancora sincronizzato
sync-offline = Il server non è raggiungibile. Ciò che scrivi qui è tenuto da parte, e mandato quando si potrà.
sync-refused = La sincronizzazione si è fermata su questo dispositivo
# The line over the notes of a phone whose app is older than the form of something that is synchronized: the synchronization has stopped on it until the app is updated. The words are the owner's, and the core says the same in the settings (core-sync-update-needed).
sync-outdated = Serve un aggiornamento per la sincronizzazione.
sync-now = Sincronizza ora
sync-computers = Dispositivi
sync-this-computer = { $name } (questo dispositivo)
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = Ultimo collegamento: { $when }
sync-computers-unread = Non si è potuto chiedere al server quali dispositivi ci sono.
sync-add = Aggiungi un dispositivo…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = Inserisci il codice sull'altro dispositivo, con { $join } sotto Sincronizzazione nelle sue impostazioni. Si può usare una volta sola. Scadenza: { $until }.
sync-code-failed = Non si è potuto fare nessun codice.
sync-rename-title = Rinomina il dispositivo
sync-remove-title = Rimuovere «{ $name }»?
sync-remove-message = Non sarà più sincronizzato. Ciò che c'è sopra resta dov'è.
# $why is what went wrong, a sentence of its own.
sync-remove-failed = «{ $name }» non si è potuto rimuovere. { $why }
sync-stop = Smetti di sincronizzare su questo dispositivo
sync-stop-title = Smettere di sincronizzare su questo dispositivo?
sync-stop-message = Ciò che c'è su questo dispositivo resta qui com'è. Ciò che viene scritto sui tuoi altri dispositivi non arriva più qui, e ciò che viene scritto qui non va più a loro.
sync-stop-message-alone = Ciò che c'è su questo dispositivo resta qui com'è. È l'unico dispositivo sincronizzato, quindi sul server non resta niente.
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = Ciò che c'è su questo dispositivo resta qui com'è. È l'unico dispositivo sincronizzato, quindi sul server non resta niente. I tuoi progetti e i file della biblioteca non sono su questo dispositivo: ciò che il server ne tiene viene eliminato.
sync-stop-confirm = Smetti di sincronizzare
sync-stop-failed = La sincronizzazione non si è potuta fermare

## Written apart.

sync-apart = «{ $name }» è stato scritto su due dispositivi che non erano in contatto fra loro.
sync-apart-show = Mostra le modifiche
sync-apart-no-history = La sua cronologia non è conservata, quindi le modifiche non si possono mostrare. Il progetto com'era prima è fra le sue versioni precedenti.
sync-apart-earlier = Versioni precedenti
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = quando i dispositivi si sono incontrati
