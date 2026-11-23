# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = Una modifica a un documento non si può leggere: { $why }

## The server.

core-sync-old-server = Il server a { $host } è più vecchio di questa versione di Glaukopis e non può sincronizzare. Va aggiornato.
core-sync-refused = Il server non fa più entrare questo dispositivo. È stato tolto da quelli sincronizzati, oppure sul server non è rimasto più nulla di essi.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Serve un aggiornamento per la sincronizzazione.

## Turning it on, and the devices.

core-sync-not-on = Questo dispositivo non è sincronizzato.
core-sync-already = Questo dispositivo è già sincronizzato.
core-sync-needs-name = Dai un nome a questo dispositivo.
core-sync-remove-self = Questo dispositivo si toglie smettendo di sincronizzare qui.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = «{ $name }» non si è potuto sincronizzare. { $why }
core-sync-problem-notebook = Il taccuino non si è potuto sincronizzare. { $why }
core-sync-problem-library = La biblioteca non si è potuta sincronizzare. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = «{ $name }» è più grande di quanto il server accetti (al massimo { $most } MB), e non è sui tuoi altri dispositivi.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] Il server è pieno. Un file non è sui tuoi altri dispositivi.
    [many] Il server è pieno. { $count } file non sono sui tuoi altri dispositivi.
   *[other] Il server è pieno. { $count } file non sono sui tuoi altri dispositivi.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] Il server è pieno. Un file delle tue note non è sui tuoi altri dispositivi.
    [many] Il server è pieno. { $count } file delle tue note non sono sui tuoi altri dispositivi.
   *[other] Il server è pieno. { $count } file delle tue note non sono sui tuoi altri dispositivi.
}
core-sync-file-not-sent = «{ $name }» non si è potuto mandare al server. { $why }
core-sync-file-not-fetched = «{ $name }» non si è potuto scaricare dal server. { $why }
core-sync-file-not-as-named = Ciò che il server ha dato non è il file che era stato chiesto: si è danneggiato per strada o dove è tenuto.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Senza nome
