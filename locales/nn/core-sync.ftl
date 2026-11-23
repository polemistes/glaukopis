# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = Ei endring i eit dokument kan ikkje lesast: { $why }

## The server.

core-sync-old-server = Tenaren på { $host } er eldre enn denne versjonen av Glaukopis og kan ikkje synkronisere. Den må oppdaterast.
core-sync-refused = Tenaren slepp ikkje lenger inn denne eininga. Den vart teken ut av dei som blir synkroniserte, eller tenaren tek ikkje lenger vare på noko av dei.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Oppdatering trengst for synkronisering.

## Turning it on, and the devices.

core-sync-not-on = Denne eininga blir ikkje synkronisert.
core-sync-already = Denne eininga blir synkronisert allereie.
core-sync-needs-name = Gi denne eininga eit namn.
core-sync-remove-self = Denne eininga blir teken ut ved å slutte å synkronisere her.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = «{ $name }» kunne ikkje synkroniserast. { $why }
core-sync-problem-notebook = Notatblokka kunne ikkje synkroniserast. { $why }
core-sync-problem-library = Biblioteket kunne ikkje synkroniserast. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = «{ $name }» er større enn tenaren tek imot (høgst { $most } MB), og finst ikkje på dei andre einingane dine.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] Tenaren er full. Éi fil finst ikkje på dei andre einingane dine.
   *[other] Tenaren er full. { $count } filer finst ikkje på dei andre einingane dine.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] Tenaren er full. Éi fil i notata dine finst ikkje på dei andre einingane dine.
   *[other] Tenaren er full. { $count } filer i notata dine finst ikkje på dei andre einingane dine.
}
core-sync-file-not-sent = «{ $name }» kunne ikkje sendast til tenaren. { $why }
core-sync-file-not-fetched = «{ $name }» kunne ikkje hentast frå tenaren. { $why }
core-sync-file-not-as-named = Det tenaren gav, er ikkje fila det vart spurt etter: den vart skadd undervegs eller der den blir lagra.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Utan namn
