# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = En ändring av ett dokument kan inte läsas: { $why }

## The server.

core-sync-old-server = Servern på { $host } är äldre än den här versionen av Glaukopis och kan inte synkronisera. Den måste uppdateras.
core-sync-refused = Servern släpper inte längre in den här enheten. Den togs bort från dem som synkroniseras, eller så finns inget av dem kvar på servern.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Uppdatering behövs för synkronisering.

## Turning it on, and the devices.

core-sync-not-on = Den här enheten synkroniseras inte.
core-sync-already = Den här enheten synkroniseras redan.
core-sync-needs-name = Ge den här enheten ett namn.
core-sync-remove-self = Den här enheten tas bort genom att synkroniseringen stoppas här.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = ”{ $name }” kunde inte synkroniseras. { $why }
core-sync-problem-notebook = Anteckningsboken kunde inte synkroniseras. { $why }
core-sync-problem-library = Biblioteket kunde inte synkroniseras. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = ”{ $name }” är större än vad servern tar emot (högst { $most } MB) och finns inte på dina andra enheter.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] Servern är full. En fil finns inte på dina andra enheter.
   *[other] Servern är full. { $count } filer finns inte på dina andra enheter.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] Servern är full. En fil i dina anteckningar finns inte på dina andra enheter.
   *[other] Servern är full. { $count } filer i dina anteckningar finns inte på dina andra enheter.
}
core-sync-file-not-sent = ”{ $name }” kunde inte skickas till servern. { $why }
core-sync-file-not-fetched = ”{ $name }” kunde inte hämtas från servern. { $why }
core-sync-file-not-as-named = Det servern gav är inte den fil som begärdes: den skadades på vägen eller där den förvaras.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Utan namn
