# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titre
text-name = Nom de l’élément
text-not-printed = non imprimé
text-grip = Déplacer ou modifier cet élément
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = Dans le document, { $name } prend place ici, avec tout ce qui est dessous.
text-include-open = L’ouvrir
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Sous « { $name } »
text-drop-after = Après « { $name } »
text-drop-before = Avant « { $name } »
text-split = Scinder ici
text-split-hint = Ce qui suit le curseur devient un nouvel élément
text-join = Joindre à l’élément au-dessus
text-open-as-map = Ouvrir comme carte
text-open-as-map-hint = Il est affiché seul, avec ce qui est dessous

## Folding away what is under an element, and its text

text-open = L’ouvrir
text-fold = Le replier
text-open-shift = L’ouvrir · avec Maj, tout ce qui est replié dessous aussi
text-fold-hint = Replier son texte et ce qui est dessous
text-fold-shift = Replier son texte et ce qui est dessous · avec Maj, ouvrir tout ce qui est replié dessous
text-open-all = Tout ouvrir
text-open-all-under = Ouvrir tout ce qui est replié dessous
text-fold-all-under = Tout replier dessous
text-fold-all-under-hint = De ce qui est directement dessous, les noms sont affichés, et rien de plus profond
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Son texte replié
        [one] Son texte et { $parts } élément repliés
        [many] Son texte et { $parts } éléments repliés
       *[other] Son texte et { $parts } éléments repliés
    }
   *[no] { $parts ->
        [one] { $parts } élément replié
        [many] { $parts } éléments repliés
       *[other] { $parts } éléments repliés
    }
}{ $words ->
    [0] {""}
    [one] , { $words } mot
    [many] , { $words } mots
   *[other] , { $words } mots
}

## Associations, in the margin

text-associations = Associations
text-outline = Plan
text-outline-between = Entre le plan et le texte
text-outline-fold = Replier ce qui est dessous
text-outline-open = Ouvrir ce qui est dessous
text-go-to = Aller à « { $name } »
text-add-label = Ajouter une étiquette…
text-change-label = Changer l’étiquette…
text-remove-association = Retirer l’association
text-hint-linking = Cliquez sur le nom de l’élément à associer · { $esc } pour renoncer

## Under the text

text-notes = { $count ->
    [one] { $count } note
    [many] { $count } notes
   *[other] { $count } notes
}
# The keys are shown as keys, where the variables stand.
text-keys = { $ctrl }+{ $enter } nouvel élément · { $ctrl }+{ $shift }+{ $enter } un dessous · { $at } citer
