# What the core says of synchronization between the writer's computers, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = A change to a document cannot be read: { $why }

## The server.

core-sync-old-server = The server at { $host } is older than this version of Glaukopis and cannot synchronize. It must be brought up to date.
core-sync-refused = The server no longer lets this computer in. It was removed from those that are synchronized, or nothing of them is kept on the server any more.
core-sync-later-home = Another of your computers has a later version of Glaukopis, which keeps what is synchronized in a form this version does not know. Update Glaukopis here.
core-sync-later-library = Another of your computers has a later version of Glaukopis, which keeps the library in a form this version does not know. Update Glaukopis here.

## Turning it on, and the computers.

core-sync-not-on = This computer is not synchronized.
core-sync-already = This computer is synchronized already.
core-sync-needs-name = Give this computer a name.
core-sync-remove-self = This computer is taken out by stopping the synchronization here.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = “{ $name }” could not be synchronized. { $why }
core-sync-problem-notebook = The notebook could not be synchronized. { $why }
core-sync-problem-library = The library could not be synchronized. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = “{ $name }” is larger than the server takes ({ $most } MB at the most), and is not on your other computers.
core-sync-file-not-sent = “{ $name }” could not be sent to the server. { $why }
core-sync-file-not-fetched = “{ $name }” could not be fetched from the server. { $why }
core-sync-file-not-as-named = What the server gave is not the file that was asked for: it was damaged on its way or where it is kept.
# The name of a project that came from another computer and says no name of its own.
core-sync-unnamed = Without a name
