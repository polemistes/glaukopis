# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = A change to a document cannot be read: { $why }

## The server.

core-sync-old-server = The server at { $host } is older than this version of Glaukopis and cannot synchronize. It must be brought up to date.
core-sync-refused = The server no longer lets this device in. It was removed from those that are synchronized, or nothing of them is kept on the server any more.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Update is needed for synchronization.

## Turning it on, and the devices.

core-sync-not-on = This device is not synchronized.
core-sync-already = This device is synchronized already.
core-sync-needs-name = Give this device a name.
core-sync-remove-self = This device is taken out by stopping the synchronization here.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = “{ $name }” could not be synchronized. { $why }
core-sync-problem-notebook = The notebook could not be synchronized. { $why }
core-sync-problem-library = The library could not be synchronized. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = “{ $name }” is larger than the server takes ({ $most } MB at the most), and is not on your other devices.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] The server is full. One file is not on your other devices.
   *[other] The server is full. { $count } files are not on your other devices.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] The server is full. One file of your notes is not on your other devices.
   *[other] The server is full. { $count } files of your notes are not on your other devices.
}
core-sync-file-not-sent = “{ $name }” could not be sent to the server. { $why }
core-sync-file-not-fetched = “{ $name }” could not be fetched from the server. { $why }
core-sync-file-not-as-named = What the server gave is not the file that was asked for: it was damaged on its way or where it is kept.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Without a name
