# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = En ændring af et dokument kan ikke læses: { $why }

## The server.

core-sync-old-server = Serveren på { $host } er ældre end denne version af Glaukopis og kan ikke synkronisere. Den skal opdateres.
core-sync-refused = Serveren lukker ikke længere denne enhed ind. Den blev fjernet fra dem, der synkroniseres, eller der opbevares ikke længere noget af dem på serveren.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Opdatering er nødvendig for synkronisering.

## Turning it on, and the devices.

core-sync-not-on = Denne enhed synkroniseres ikke.
core-sync-already = Denne enhed synkroniseres allerede.
core-sync-needs-name = Giv denne enhed et navn.
core-sync-remove-self = Denne enhed tages ud ved at holde op med at synkronisere her.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = »{ $name }« kunne ikke synkroniseres. { $why }
core-sync-problem-notebook = Notesbogen kunne ikke synkroniseres. { $why }
core-sync-problem-library = Biblioteket kunne ikke synkroniseres. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = »{ $name }« er større, end serveren tager imod (højst { $most } MB), og findes ikke på dine andre enheder.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] Serveren er fuld. Én fil findes ikke på dine andre enheder.
   *[other] Serveren er fuld. { $count } filer findes ikke på dine andre enheder.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] Serveren er fuld. Én fil i dine notater findes ikke på dine andre enheder.
   *[other] Serveren er fuld. { $count } filer i dine notater findes ikke på dine andre enheder.
}
core-sync-file-not-sent = »{ $name }« kunne ikke sendes til serveren. { $why }
core-sync-file-not-fetched = »{ $name }« kunne ikke hentes fra serveren. { $why }
core-sync-file-not-as-named = Det, serveren gav, er ikke den fil, der blev bedt om: den blev beskadiget undervejs eller der, hvor den opbevares.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Uden navn
