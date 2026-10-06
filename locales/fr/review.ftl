# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Modifications
# The button over the text that opens the panel.
review-open = Réviser les modifications
review-since-last = Depuis votre dernière révision
review-since-beginning = Depuis le début de l’historique
review-since-session = Depuis que { $who } a commencé, le { $when }
review-since-named = Depuis « { $name } »
# When the moment compared with was, under what it is.
review-since-when = À partir du { $when }
review-choose-since = Réviser à partir d’un autre moment
review-own = Vos propres modifications aussi
review-unit = Réviser par
review-by-sentence = Phrase
review-by-paragraph = Paragraphe
review-left = { $count ->
    [one] Il reste { $count } modification
    [many] Il reste { $count } modifications
   *[other] Il reste { $count } modifications
}
review-position = { $index } sur { $count }
review-working = Calcul des modifications…
review-failed = Les modifications n’ont pas pu être établies.
review-nothing = Plus rien à réviser
review-nothing-text = Toutes les modifications que les autres ont faites depuis ont été acceptées.
review-list = Les modifications de cette carte

## What a change is.

review-kind-changed = Modifié
review-kind-added = Nouveau texte
review-kind-removed = Texte supprimé
review-kind-moved = Déplacé
review-kind-object = { $what ->
    [figure] Figure
    [table] Tableau
    [equation] Équation
    [citation] Citation
    [math] Formule
    [footnote] Note
    [crossref] Renvoi
   *[other] Quelque chose qui n’est pas du texte
}
review-kind-put-in = Ajout : { $what }
review-kind-taken-out = Retrait : { $what }
review-kind-altered = Modification : { $what }
review-element-added = Élément ajouté
review-element-removed = Élément supprimé
review-element-moved = Élément déplacé
review-element-heading = Imprimé comme titre
review-element-no-heading = Plus imprimé comme titre
review-element-excluded = Laissé hors du document
review-element-included = Remis dans le document
review-element-other = Élément modifié
# Where a change is: the name of the element.
review-in = Dans « { $element } »
review-moved-from = De « { $element } »
review-untitled = Sans titre
review-gone-element = Un élément qui n’est plus là
review-was = Avant
review-is = Après
review-nothing-there = Rien
review-someone = Quelqu’un
review-now-under = Maintenant sous « { $element } »
review-was-under = Était sous « { $element } »

## What is done with a change.

review-accept = Accepter
review-reject = Rejeter
review-later = Plus tard
review-previous = La précédente
review-reject-cannot = Ce qui a été supprimé de la carte, ou une figure retirée, est ramené depuis l’historique.
review-versions = Son historique
review-versions-count = { $count ->
    [one] Une version
    [many] { $count } versions
   *[other] { $count } versions
}
review-versions-reading = Lecture de son historique…
review-versions-none = Rien ne s’est passé entre les deux bouts.
review-version-by = { $who }, { $when }
review-accept-up-to = Accepter jusqu’ici
review-use-version = Prendre cette version

## Without the history.

review-no-history = L’historique de ce projet n’est pas tenu
review-no-history-text = Les modifications sont révisées d’après l’historique du projet, qui dit qui a changé quoi, et quand. Il est tenu à partir du moment où il est activé.
review-turn-on = Tenir l’historique
review-turn-on-elsewhere = Il s’active avec l’historique du projet.
