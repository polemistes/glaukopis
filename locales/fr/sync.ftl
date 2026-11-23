# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = Synchronisation
sync-about = Les projets, la bibliothèque, le carnet et vos réglages seront synchronisés entre vos appareils.
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = Seul le carnet est synchronisé.

## Before it is on.

sync-server = Serveur
sync-computer-name = Nom de cet appareil
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = Comment cet appareil commence
sync-how-start = Commencer ici
sync-how-join = Rejoindre avec un code
sync-password = Mot de passe du serveur
sync-code = Code
sync-start = Démarrer la synchronisation
sync-starting = Démarrage…
sync-join = Rejoindre
sync-joining = Connexion…
sync-unreachable = Le serveur n’a pas pu être joint.

## While it is on.

sync-working = Synchronisation…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = Dernière synchronisation : { $when }
sync-never = Pas encore synchronisé
sync-offline = Le serveur ne peut pas être joint. Ce qui est écrit ici est gardé, et envoyé dès que possible.
sync-refused = La synchronisation s’est arrêtée sur cet appareil
# The line over the notes of a phone whose app is older than the form of something that is synchronized: the synchronization has stopped on it until the app is updated. The words are the owner's, and the core says the same in the settings (core-sync-update-needed).
sync-outdated = Une mise à jour est nécessaire pour la synchronisation.
sync-now = Synchroniser maintenant
sync-computers = Appareils
sync-this-computer = { $name } (cet appareil)
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = Dernière connexion : { $when }
sync-computers-unread = Le serveur n’a pas pu être interrogé sur les appareils synchronisés.
sync-add = Ajouter un appareil…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = Entrez le code sur l’autre appareil, en choisissant { $join } sous Synchronisation dans ses réglages. Il ne peut servir qu’une fois, jusqu’à { $until }.
sync-code-failed = Aucun code n’a pu être créé.
sync-rename-title = Renommer l’appareil
sync-remove-title = Retirer « { $name } » ?
sync-remove-message = Il n’est plus synchronisé. Ce qui s’y trouve y reste.
# $why is what went wrong, a sentence of its own.
sync-remove-failed = « { $name } » n’a pas pu être retiré. { $why }
sync-stop = Cesser de synchroniser sur cet appareil
sync-stop-title = Cesser de synchroniser sur cet appareil ?
sync-stop-message = Ce qui se trouve sur cet appareil y reste tel quel. Ce qui est écrit sur vos autres appareils ne vient plus ici, et ce qui est écrit ici ne va plus vers eux.
sync-stop-message-alone = Ce qui se trouve sur cet appareil y reste tel quel. C’est le seul appareil synchronisé : il ne reste donc rien sur le serveur.
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = Ce qui se trouve sur cet appareil y reste tel quel. C’est le seul appareil synchronisé : il ne reste donc rien sur le serveur. Vos projets et les fichiers de votre bibliothèque ne sont pas sur cet appareil : ce que le serveur en garde est supprimé.
sync-stop-confirm = Cesser de synchroniser
sync-stop-failed = La synchronisation n’a pas pu être arrêtée

## Written apart.

sync-apart = « { $name } » a été écrit sur deux appareils alors qu’ils n’étaient pas en contact.
sync-apart-show = Afficher les modifications
sync-apart-no-history = Son historique n’est pas conservé : les modifications ne peuvent donc pas être affichées. Le projet tel qu’il était avant se trouve parmi ses versions antérieures.
sync-apart-earlier = Versions antérieures
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = la rencontre des appareils
