# The full history of a project, in English.
# See locales/README.md.

history-title = Historique
history-between = Entre les cartes et l’historique
history-settings = Réglages de l’historique
history-failed = L’historique n’a pas pu être lu.
history-reading = Lecture de l’historique…

## When it is not kept

history-off = L’historique de ce projet n’est pas tenu.
history-on-word = Chaque modification est gardée
history-off-word = Pas tenu
history-off-about = Tant qu’il est tenu, chaque modification est gardée, avec qui l’a faite et quand : le projet peut être regardé tel qu’il était à tout moment, et ramené. Cela prend de la place, et dans un projet partagé cela montre aux autres ce que chacun a écrit, et quand.
history-turn-on = Tenir l’historique

## The moments

# Someone whose name the history does not know.
history-someone = Quelqu’un
history-began = L’historique commence
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = gardé moins finement
history-added = { $count ->
    [one] +{ $count } caractère
    [many] +{ $count } caractères
   *[other] +{ $count } caractères
}
history-removed = { $count ->
    [one] −{ $count } caractère
    [many] −{ $count } caractères
   *[other] −{ $count } caractères
}

## The map as it was

history-back = Retour au présent
history-as-it-was = Tel qu’il était le { $when }
history-marked = Ce qui a changé depuis le moment précédent est marqué de la couleur de qui l’a changé.
history-map-not-there = Cette carte n’existait pas alors.
history-added-by = Ajouté par { $name }
history-removed-by = Retiré par { $name }
history-changed-by = Modifié par { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = renvoi
history-name-moment = Nommer ce moment
history-name-placeholder = Comment l’appeler
history-named = Le moment s’appelle « { $name } ».
history-bring-back-element = Ramener cet élément tel qu’il était
history-bring-back-map = Ramener la carte telle qu’elle était
history-brought-back = Ramené tel que c’était. Annuler le reprend.
history-bring-back-failed = Cela n’a pas pu être ramené.
history-open-copy = Ouvrir comme projet à part
history-copy-name = { $name }, tel qu’il était le { $day }
history-copy-failed = Le projet n’a pas pu être créé.

## Archives

history-open-archive = Ouvrir une archive…
history-archive-kind = Historique de Glaukopis
history-archive-unread = L’archive n’a pas pu être lue.
history-archive-of = Archive : { $name }
history-archive-close = Fermer

## Settings

history-keep = Tenir l’historique
history-room = L’historique prend { $size }.
history-turn-off-title = Cesser de tenir l’historique ?
history-turn-off-message = Ce qui a été gardé est supprimé. Le projet lui-même reste tel quel.
history-turn-off-shared = Ce qui a été gardé est supprimé, ici et sur les ordinateurs de ceux avec qui le projet est partagé. Le projet lui-même reste tel quel.
history-turn-off = Supprimer l’historique
history-finely = Historique ancien
history-finely-about = Les modifications anciennes sont fusionnées, pour prendre moins de place et se lire plus vite ; les moments qu’elles contiennent ne peuvent alors plus être distingués. Les moments nommés, et ceux auxquels les révisions comparent, sont gardés.
history-hourly = Fusionner chaque heure en une seule après
history-weeks = { $count ->
    [one] semaine
    [many] semaines
   *[other] semaines
}
history-daily = Fusionner chaque jour en un seul après
history-months = { $count ->
    [one] mois
    [many] mois
   *[other] mois
}
history-before = Ce qui précède
history-before-choose = Choisissez un moment de l’historique pour archiver ou supprimer ce qui le précède.
history-before-about = L’historique antérieur au { $when } peut être archivé dans un fichier, pour être regardé plus tard, ou supprimé.
history-archive = Archiver…
history-delete = Supprimer
history-archive-title = Archiver l’historique antérieur au { $when } ?
history-delete-title = Supprimer l’historique antérieur au { $when } ?
history-cut-message = Ce qui reste commence par le projet tel qu’il était alors.
history-cut-kept = { $count ->
    [one] Un moment nommé ou révisé le précède, et ne pourra plus être regardé ici.
    [many] { $count } moments nommés ou révisés le précèdent, et ne pourront plus être regardés ici.
   *[other] { $count } moments nommés ou révisés le précèdent, et ne pourront plus être regardés ici.
}
history-cut-not-here = L’historique ne peut pas être retiré avant ce moment.
history-cut-failed = L’historique n’a pas pu être retiré.
history-archive-until = jusqu’au { $when }
history-archived = L’historique antérieur au { $when } est archivé.
history-deleted = L’historique antérieur au { $when } est supprimé.
