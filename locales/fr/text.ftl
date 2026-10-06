# A map as text: the elements one after another, each a heading and its text.

text-title = Titre
text-name = Nom de l’élément
text-first-section = Écrivez ici, ou appuyez sur Ctrl+Entrée pour commencer la première section.
text-not-printed = non imprimé
text-grip = Déplacer ou modifier cet élément
# The map an element stands for, which is shown in bold where the variable stands.
text-include = Dans le document, la carte { $map } se place ici.
text-include-open = L’ouvrir
text-loose = Éléments libres
text-loose-hint = Des pensées qui n’ont pas encore leur place. Elles ne font pas partie du document.
text-split = Scinder ici
text-split-hint = Ce qui suit le curseur devient un nouvel élément
text-join = Joindre à l’élément au-dessus

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
text-keys = { $alt }+{ $enter } nouvel élément · { $alt }+{ $shift }+{ $enter } un dessous · { $at } citer
