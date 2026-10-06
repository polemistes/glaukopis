# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Entrez l’adresse du serveur.
core-sharing-no-spaces = L’adresse d’un serveur ne contient pas d’espaces.
# The scheme is what was typed before "://".
core-sharing-scheme = Un serveur se joint par http ou https, non par « { $scheme } ».
core-sharing-not-an-address = Cela ne ressemble pas à l’adresse d’un serveur.
core-sharing-no-server = Il n’y a pas de serveur Glaukopis à { $host }. Vérifiez l’adresse auprès de la personne qui vous l’a donnée.
core-sharing-no-answer-behind = { $host } est là, mais le serveur derrière ne répond pas
core-sharing-newer = Le serveur est plus récent que cette version de Glaukopis, qu’il faut mettre à jour pour l’utiliser.

## What the server refuses, by its kind.

core-sharing-no-room = Le projet n’est plus sur le serveur.
core-sharing-not-admitted = Le serveur n’admet plus cette copie du projet.
core-sharing-not-owner = Seule la personne qui partage le projet peut faire cela.
core-sharing-bad-code = Le code n’est pas valable. Il a peut-être été mal tapé, déjà utilisé ou retiré, ou il a expiré.
core-sharing-exists = Le projet est déjà sur le serveur.
core-sharing-full = Le serveur contient autant de projets qu’il est réglé pour en contenir.
core-sharing-password-asked = Ce serveur demande un mot de passe à ceux qui partagent des projets par lui.
core-sharing-password-wrong = Le mot de passe n’est pas celui que le serveur demande.
core-sharing-too-many = Trop de tentatives ont été faites d’ici. Réessayez dans dix minutes.
core-sharing-no-file = Le serveur n’a pas l’image.
core-sharing-server-error = { $host } a répondu par une erreur.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = Le projet n’a pas de nom.
core-sharing-bad-id = L’identifiant du projet n’est pas de ceux que le serveur peut utiliser.
core-sharing-many-invitations = Il y a déjà cinquante invitations ouvertes ; retirez-en quelques-unes.
core-sharing-no-collaborator = Il n’y a pas de tel collaborateur.
core-sharing-not-whole = Le fichier n’est pas arrivé entier.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Le fichier est plus gros que ce que ce serveur accepte : un fichier peut faire { $most } au plus.
core-sharing-project-full = Il n’y a pas de place pour le fichier : les fichiers d’un projet peuvent faire { $most } en tout au plus sur ce serveur.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } n’accepte pas une image aussi grosse.
core-sharing-picture-larger = Une image est plus grosse que ce que { $host } accepte ({ $most } Mo au plus), et ne parvient pas aux autres.
core-sharing-picture-not-sent = Une image n’a pas pu être envoyée : { $error }.
core-sharing-picture-not-fetched = Une image n’a pas pu être récupérée : { $error }.

## Publishing and joining.

core-sharing-shared-already = Le projet est déjà partagé.
core-sharing-own-code = Le code est celui de « { $name } », qui est partagé depuis cet ordinateur : vous l’avez déjà.
