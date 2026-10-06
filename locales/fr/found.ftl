# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Citations reconnues
# On the tab of the panel, beside the other tabs: short.
found-tab = Citations reconnues
found-between = Entre la carte et les citations reconnues
found-taken = Ce qui est pris pour des citations
found-taken-always = Ce qu’un logiciel a fait, et les balises
found-taken-years = Les parenthèses contenant une année
found-taken-named = Les notes qui nomment une œuvre de la bibliothèque
found-taken-notes = Toutes les notes
found-asking = Interrogation de la bibliothèque…
found-make-certain = { $count ->
    [one] Faire une citation de celle qui est certaine
    [many] Faire des citations des { $count } qui sont certaines
   *[other] Faire des citations des { $count } qui sont certaines
}
found-made = { $count ->
    [one] Une citation a été faite
    [many] { $count } citations ont été faites
   *[other] { $count } citations ont été faites
}
found-made-undo = Ctrl+Z les reprend, en une seule étape.
found-library-failed = La bibliothèque n’a pas pu être interrogée.
found-nothing = Rien à passer en revue
found-nothing-looked = Il ne reste dans cette carte aucune citation reconnue, et rien n’y ressemble à une citation.
found-nothing-looked-more = Il ne reste dans cette carte aucune citation reconnue, et rien n’y ressemble à une citation. Davantage peut être pris pour des citations, ci-dessus.
found-nothing-not-looked = Il ne reste dans cette carte aucune citation reconnue. Le texte qui ne fait que ressembler à une citation est cherché quand vous dites ci-dessus ce qui doit être pris pour une citation : les parenthèses contenant une année, ou les notes.
found-list-label = Ce qu’il y a à passer en revue
found-untitled = Sans titre
found-in-a-note = Dans une note
# The element of the map a citation stands in.
found-in = Dans « { $element } »
found-in-note-of = Dans une note de « { $element } »
# Set small and high after the words a note stands after.
found-note-mark = note
found-position = { $index } sur { $count }
found-previous = La précédente
found-next = La suivante
found-list-show = Afficher la liste
found-list-hide = Cacher la liste
found-later = Plus tard
found-leave = Laisser comme texte
found-make = En faire une citation

## How sure the library is of what it proposes.

found-sure-certain = La bibliothèque l’a, c’est certain
found-sure-likely = La bibliothèque a ce qui est probablement elle
found-sure-possible = La bibliothèque a ce qui pourrait être elle
found-sure-none = Une de ses œuvres n’a pas encore de référence

## By what a citation was found.

found-by-zotero = Faite par Zotero
found-by-mendeley = Faite par Mendeley, ou un logiciel qui écrit comme lui
found-by-key = Une balise qui nomme une référence
found-by-form = Prise pour une citation d’après son allure

## The citation that is to be made.

found-the-citation = La citation
found-no-works = Elle ne nomme aucune œuvre. Ajoutez-en une, ou laissez-la comme le texte qu’elle est.
found-add-work = Ajouter une œuvre
found-author-in-text = Auteur dans le texte : Nagy (1979)
found-pick-work = L’œuvre citée : auteur, titre, année
found-pick-add = Ajouter une œuvre à la citation
found-too-little = Le fichier en dit trop peu sur cette œuvre pour en faire une référence
found-reference-failed = La référence n’a pas pu être faite

## A citation that stands in a note.

found-in-note = Elle se trouve dans une note
found-note-becomes = La note devient une citation
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Ce que la note dit d’autre va avant et après ses œuvres{ $has ->
        [before]  : « { $before } » avant
        [after]  : « { $after } » après
       *[both]  : « { $before } » avant, « { $after } » après
    }. Le style des références la met dans la ligne ou en note.
found-note-style = Le style des références la met dans la ligne ou en note.
found-citation-in-note = La citation reste dans la note
    .hint = La note reste une note, avec ce qu’elle dit d’autre.
found-for-all = Ainsi pour toutes celles qui suivent
found-note-not = Elle ne se trouve pas dans une note.
# What else the note holds, by the name of what it is in the text.
found-note-holds = La note contient { $what ->
        [math] une formule
        [crossref] un renvoi
        [citation] une citation
        [hard_break] une deuxième ligne
       *[other] quelque chose qui n’est pas du texte
    }, ce que les mots avant et après une œuvre ne peuvent pas contenir.
found-note-another = La note contient une autre citation reconnue, qui serait perdue dans les mots après celle-ci.

## Why what was asked could not be done.

found-trouble-gone = Elle n’est plus dans le texte.
found-trouble-changed = Le texte a changé ici depuis qu’elle a été proposée, et a été réexaminé.
found-trouble-cannot = On ne peut pas en faire une citation ici.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } et { $second }
found-people-more = { $first } et al.
found-work-a-work = Une œuvre
found-work-looking = { $work } est cherché dans votre bibliothèque…
found-work-no-tag = { $work } est une balise qu’aucune référence de votre bibliothèque n’a.
found-work-not-found = { $work } n’a pas été trouvé dans votre bibliothèque.
found-work-chosen = Choisie par vous
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Comme vous avez choisi pour la même œuvre
found-work-certain = Certaine
found-work-likely = Probable
found-work-possible = Possible
# What the text says the work is.
found-work-for = pour « { $work } »
found-work-others = D’autres références qu’elle pourrait être
found-work-or = Ou
found-work-may-be = Ce pourrait être
found-work-another = Une autre…
found-work-find = La trouver…
found-work-add = L’ajouter à la bibliothèque
