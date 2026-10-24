# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Carte
diagram-idea = Nom
diagram-new-here = Nouvel élément ici
diagram-open-as-map = Ouvrir comme carte
diagram-show-all = Afficher toute la carte
diagram-tidy = Ranger toute la carte
# The keys are shown as keys, where the variables stand.
diagram-hint-linking = Cliquez sur l’élément à associer, ou allez-y avec les flèches et appuyez sur { $enter } · { $esc } pour renoncer
diagram-link-handle = Glissez vers un autre élément pour les associer

## The view

diagram-view = Affichage
diagram-zoom-out = Réduire
diagram-zoom-in = Agrandir
diagram-actual-size = Taille réelle
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent } %

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Un élément copié, avec tout ce qui est dessous
    [many] { $count } éléments copiés, avec tout ce qui est dessous
   *[other] { $count } éléments copiés, avec tout ce qui est dessous
}
diagram-cut = { $count ->
    [one] Un élément est coupé : il ira là où vous le collerez
    [many] { $count } éléments sont coupés : ils iront là où vous les collerez
   *[other] { $count } éléments sont coupés : ils iront là où vous les collerez
}
diagram-paste-here = Coller ici
diagram-nothing-copied = Rien n’est encore copié
diagram-pasted-elsewhere = Ce qui a été copié vient d’un autre projet et ne peut pas être collé ici
