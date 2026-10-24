# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titre
text-name = Nom de l’élément
text-grip = Déplacer ou modifier cet élément
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Sous « { $name } »
text-drop-after = Après « { $name } »
text-drop-before = Avant « { $name } »
text-split = Scinder ici
text-heading-kept = Ce qui suit le curseur contient ce qu’un nom ne peut pas contenir, comme une citation ou une note, et forme le premier paragraphe du nouvel élément
text-join = Joindre à l’élément au-dessus
text-open-as-map = Entrer

## Folding away what is under an element, and its text

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
text-keys = { $alt }+{ $enter } nouvel élément · { $alt }+{ $shift }+{ $enter } un sous-élément · { $at } citer

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Clone de { $name }
text-clone-go = Aller à l’original
text-unfold = Déplier cet élément
text-fold-this = Replier cet élément
text-unfold-all-under = Déplier tous les sous-éléments
text-fold-all-sub = Replier tous les sous-éléments
text-unfold-all = Tout déplier
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Déplier · avec Maj, tous les sous-éléments aussi
text-fold-this-shift = Replier cet élément · avec Maj, déplier tous les sous-éléments
# The buttons of the outline.
text-outline-unfold = Déplier les sous-éléments
text-outline-fold-sub = Replier les sous-éléments
