# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = Une modification d’un document ne peut pas être lue : { $why }

## The server.

core-sync-old-server = Le serveur à { $host } est plus ancien que cette version de Glaukopis et ne peut pas synchroniser. Il doit être mis à jour.
core-sync-refused = Le serveur n’admet plus cet appareil. Il a été retiré de ceux qui sont synchronisés, ou le serveur ne garde plus rien d’eux.
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = Une mise à jour est nécessaire pour la synchronisation.

## Turning it on, and the devices.

core-sync-not-on = Cet appareil n’est pas synchronisé.
core-sync-already = Cet appareil est déjà synchronisé.
core-sync-needs-name = Donnez un nom à cet appareil.
core-sync-remove-self = Pour retirer cet appareil, arrêtez ici la synchronisation.

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = « { $name } » n’a pas pu être synchronisé. { $why }
core-sync-problem-notebook = Le carnet n’a pas pu être synchronisé. { $why }
core-sync-problem-library = La bibliothèque n’a pas pu être synchronisée. { $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = « { $name } » est plus gros que ce que le serveur accepte ({ $most } Mo au plus), et n’est pas sur vos autres appareils.
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
    [one] Le serveur est plein. Un fichier n’est pas sur vos autres appareils.
    [many] Le serveur est plein. { $count } fichiers ne sont pas sur vos autres appareils.
   *[other] Le serveur est plein. { $count } fichiers ne sont pas sur vos autres appareils.
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
    [one] Le serveur est plein. Un fichier de vos notes n’est pas sur vos autres appareils.
    [many] Le serveur est plein. { $count } fichiers de vos notes ne sont pas sur vos autres appareils.
   *[other] Le serveur est plein. { $count } fichiers de vos notes ne sont pas sur vos autres appareils.
}
core-sync-file-not-sent = « { $name } » n’a pas pu être envoyé au serveur. { $why }
core-sync-file-not-fetched = « { $name } » n’a pas pu être récupéré auprès du serveur. { $why }
core-sync-file-not-as-named = Ce que le serveur a donné n’est pas le fichier demandé : il a été abîmé en chemin, ou là où il est gardé.
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = Sans nom
