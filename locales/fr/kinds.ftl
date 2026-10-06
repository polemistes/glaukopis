# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Type
kinds-title = Types d’éléments
kinds-subtitle = Ce que peuvent être les éléments de ce projet : autant de types que le travail en demande, chacun avec une couleur.
kinds-new = Nouveau type
kinds-new-ellipsis = Nouveau type…
kinds-change = Changer le type
kinds-manage = Types de ce projet…
kinds-none-of-them = Aucun
kinds-none = Pas encore de types. Un type est un nom et une couleur : personnage, lieu, événement, source, argument, ce que le travail demande.
kinds-name = Nom
kinds-name-placeholder = Personnage, lieu, événement…
kinds-name-taken = Il y a déjà un type de ce nom.
kinds-colour = Couleur
kinds-colour-teal = Sarcelle
kinds-colour-amber = Ambre
kinds-colour-violet = Violet
kinds-colour-rose = Rose
kinds-colour-green = Vert
kinds-colour-blue = Bleu
kinds-colour-rust = Rouille
kinds-colour-olive = Olive
kinds-colour-slate = Ardoise
kinds-colour-plum = Prune
kinds-template = Texte pour commencer
kinds-template-placeholder = Apparence
    Désirs
    Craintes
kinds-template-hint = Un élément sans texte qui reçoit ce type commence par ces lignes, un paragraphe chacune.
kinds-begins = Un élément de ce type écrit en
kinds-begins-hint = Le texte commence dans ce type de paragraphe, là où l’élément n’en a pas encore
kinds-create = Créer
kinds-elements = { $count ->
    [one] { $count } élément
    [many] { $count } éléments
   *[other] { $count } éléments
}
kinds-delete-title = Supprimer le type « { $name } » ?
kinds-delete-message = { $count ->
    [0] Aucun élément n’en est.
    [one] Le seul élément qui en est n’aura plus de type.
    [many] Les { $count } éléments qui en sont n’auront plus de type.
   *[other] Les { $count } éléments qui en sont n’auront plus de type.
}
