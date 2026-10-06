# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Partager ce projet
sharing-lead = D’autres pourront alors travailler au projet avec vous, en même temps, par un serveur. Il reste aussi sur votre ordinateur, et peut être travaillé sans le serveur.
sharing-server = Serveur
sharing-unreachable = Le serveur n’a pas pu être joint.
sharing-unencrypted = Ce qui est envoyé à ce serveur n’est pas chiffré en chemin. Utilisez-le sur un réseau de confiance.
sharing-password = Mot de passe du serveur
sharing-password-hint = Demandé à ceux qui partagent des projets par lui. Ceux que vous invitez n’en ont pas besoin.
sharing-your-name = Votre nom
sharing-your-name-hint = Montré à ceux avec qui vous partagez le projet.
sharing-your-name-placeholder = Tel que les autres vous connaissent
sharing-share = Partager
sharing-sharing = Partage…
sharing-share-failed = Le projet n’a pas pu être partagé.

## While it is shared

sharing-shared-title = Projet partagé
# Under the title: the server the project is shared through.
sharing-through = Par { $server }
sharing-connected = Connecté. Ce qui est écrit est aussitôt chez les autres.
sharing-connecting = Connexion…
sharing-offline = Le serveur ne peut pas être joint. Ce que vous écrivez est gardé ici, et transmis dès que possible.
sharing-too-large = Le serveur n’accepte pas les dernières modifications : avec elles, le projet serait plus gros que ce qu’il garde. Elles sont gardées ici. La personne qui tient le serveur peut permettre des projets plus gros.
sharing-your-name-seen = Tel que les autres vous voient.

## Invitations

sharing-invite = Inviter
sharing-code-label = Code d’invitation
sharing-copy = Copier l’invitation
sharing-copied-button = Copié
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Envoyez-le à la personne que vous invitez, qui choisit { $join } et entre le serveur et le code. Validité : { $expires }.
sharing-make-code = Créer un code d’invitation
sharing-make-another = Créer un autre code
sharing-options = Options
sharing-fewer-options = Moins d’options
sharing-for = Pour
sharing-one-person = Une personne
sharing-several-people = Plusieurs personnes
sharing-good-for = Valable
sharing-a-day = Un jour
sharing-a-week = Une semaine
sharing-a-month = Un mois
sharing-until-withdrawn = Jusqu’à retrait
sharing-withdraw = Retirer
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = créé : { $when }
sharing-codes-once = Un code n’est montré qu’une fois, à sa création : le serveur n’en garde que ce qu’il lui faut pour le reconnaître. Pour en renvoyer un, créez-en un nouveau.
sharing-for-several = pour plusieurs
sharing-for-one = pour une personne
sharing-for-more = pour { $count } de plus
sharing-hours-left = { $count } h restantes
sharing-days-left = { $count ->
    [one] { $count } jour restant
    [many] { $count } jours restants
   *[other] { $count } jours restants
}
sharing-used = { $count ->
    [one] utilisé une fois
    [many] utilisé { $count } fois
   *[other] utilisé { $count } fois
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Rejoignez « { $project } » dans Glaukopis : choisissez « { $join } » et entrez
sharing-invitation-server = Serveur : { $server }
sharing-invitation-code = Code : { $code }
sharing-copied = L’invitation a été copiée
sharing-copied-detail = Collez-la dans un message à la personne que vous invitez.
sharing-invite-failed = L’invitation n’a pas pu être créée
sharing-copy-failed = L’invitation n’a pas pu être copiée
sharing-withdraw-failed = L’invitation n’a pas pu être retirée

## Who has the project

sharing-who = Qui a le projet
sharing-list-unreachable = La liste est chez le serveur, qui ne peut pas être joint.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Propriétaire
sharing-the-owner = La personne qui le partage
sharing-you = { $name } (vous)
sharing-here = Ici en ce moment
sharing-not-here = Pas ici en ce moment
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Dernière présence : { $ago }
sharing-remove-member = Retirer { $name }
sharing-none-joined = Personne n’a encore rejoint le projet.
sharing-remove-title = Retirer { $name } ?
sharing-remove-message = { $name } garde le projet tel qu’il est maintenant, et ne reçoit plus ce qui est écrit après cela.
sharing-remove-failed = { $name } n’a pas pu être retiré
# What the others see you called, when you have not given a name.
sharing-name-owner = Le propriétaire
sharing-name-member = Un collaborateur
# The others who have the project open, shown by their initials.
sharing-present = Ici en ce moment : { $names }
sharing-is-here = { $name } est là

## Ending the sharing

sharing-stop = Cesser de partager
sharing-stop-title = Cesser de partager ce projet ?
sharing-stop-message = Le projet est retiré du serveur. Vous et tous ceux avec qui vous l’avez partagé le gardez tel qu’il est maintenant, chacun de son côté.
sharing-stopped = Le projet n’est plus partagé
sharing-leave = Quitter
sharing-leave-project = Quitter le projet
sharing-leave-title = Quitter ce projet ?
sharing-leave-message = Vous gardez le projet tel qu’il est maintenant. Vous ne recevez plus ce que les autres écrivent, ni eux ce que vous écrivez.
sharing-left = Vous avez quitté le projet
sharing-untold-title = Le serveur n’a pas pu être prévenu
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Vous pouvez tout de même mettre fin au partage sur cet ordinateur ; le projet reste alors sur le serveur jusqu’à ce qu’il puisse être prévenu.
sharing-end-here = Y mettre fin ici
sharing-keep = Continuer à partager
sharing-end-failed = Le partage n’a pas pu prendre fin

## Joining a shared project

sharing-join-title = Rejoindre un projet partagé
sharing-join-about = Avec le serveur et le code que vous avez reçus
sharing-code = Code
sharing-your-name-join-hint = Montré aux autres dans le projet.
sharing-join = Rejoindre
sharing-joining = Connexion…
sharing-failed = Cela n’a pas marché.
