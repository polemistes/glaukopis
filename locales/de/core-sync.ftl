# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = Eine Änderung an einem Dokument kann nicht gelesen werden: { $why }

## The server.

core-sync-old-server = Der Server unter { $host } ist älter als diese Version von Glaukopis und kann nicht synchronisieren. Er muss auf den neuesten Stand gebracht werden.
core-sync-refused = Der Server lässt dieses Gerät nicht mehr zu. Es wurde aus den synchronisierten Geräten entfernt, oder der Server bewahrt nichts mehr von ihnen auf.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Für die Synchronisierung ist ein Update nötig.

## Turning it on, and the devices.

core-sync-not-on = Dieses Gerät wird nicht synchronisiert.
core-sync-already = Dieses Gerät wird schon synchronisiert.
core-sync-needs-name = Geben Sie diesem Gerät einen Namen.
core-sync-remove-self = Dieses Gerät wird herausgenommen, indem die Synchronisierung hier beendet wird.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = „{ $name }“ konnte nicht synchronisiert werden. { $why }
core-sync-problem-notebook = Das Notizbuch konnte nicht synchronisiert werden. { $why }
core-sync-problem-library = Die Bibliothek konnte nicht synchronisiert werden. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = „{ $name }“ ist größer, als der Server annimmt (höchstens { $most } MB), und ist nicht auf Ihren anderen Geräten.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] Der Server ist voll. Eine Datei ist nicht auf Ihren anderen Geräten.
   *[other] Der Server ist voll. { $count } Dateien sind nicht auf Ihren anderen Geräten.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] Der Server ist voll. Eine Datei Ihrer Notizen ist nicht auf Ihren anderen Geräten.
   *[other] Der Server ist voll. { $count } Dateien Ihrer Notizen sind nicht auf Ihren anderen Geräten.
}
core-sync-file-not-sent = „{ $name }“ konnte nicht an den Server gesendet werden. { $why }
core-sync-file-not-fetched = „{ $name }“ konnte nicht vom Server geholt werden. { $why }
core-sync-file-not-as-named = Was der Server gab, ist nicht die Datei, die verlangt wurde: sie wurde unterwegs beschädigt oder dort, wo sie aufbewahrt wird.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Ohne Namen
