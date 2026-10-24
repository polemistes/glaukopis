# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = Les vôtres
format-kind-general = Généraux
format-kind-style-guide = Guides de style
format-kind-publisher = Éditeurs
format-kind-journal = Revues
format-kind-fiction = Fiction
format-kind-stage = Scène et écran
format-kind-poetry = Poésie

## Layouts of the writer's own, kept from the changes of a document.

format-name = Nom de la mise en page
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, modifié
format-saved = La mise en page « { $name } » est enregistrée parmi les vôtres
format-save-failed = La mise en page n’a pas pu être enregistrée.
format-delete-failed = La mise en page n’a pas pu être supprimée.
format-delete-title = Supprimer la mise en page « { $name } » ?
format-delete-message = Les éléments qui l’utilisent prendront à la place la mise en page générale de manuscrit.
format-delete-confirm = Supprimer la mise en page

## Words that stand in several parts.

format-size = Taille
format-bold = Gras
format-italic = Italique
format-letters = Lettres
format-alignment = Alignement
format-line-spacing = Interligne
format-as-the-text = Comme le texte
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = comme le texte
format-align-left = À gauche
format-align-center = Centré
format-align-right = À droite
format-align-justified = Justifié
format-align-ragged = À gauche, en drapeau
format-case-none = Comme écrit
format-case-upper = CAPITALES
format-case-smallcaps = Petites capitales
format-spacing-single = Simple
format-spacing-one-and-a-half = Un et demi
format-spacing-double = Double
format-stands-left = À gauche
format-stands-center = Au milieu
format-stands-right = À droite

## The page.

format-page-custom = Une autre taille
format-page-width = Largeur
format-page-height = Hauteur
format-margins = Marges
format-margin-top = Haut
format-margin-bottom = Bas
format-margin-left = Gauche
format-margin-right = Droite
format-columns-heading = Colonnes
format-columns = Colonnes
format-column-gap = Espace entre les colonnes
format-lengths-hint = Les longueurs s’écrivent avec leur unité : 2.5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-verse-every = Montrer le numéro d’une ligne sur
format-verse-side = Les numéros se placent
format-side-left = À gauche
format-side-right = À droite
format-numbers-page = Les lignes de la page
format-line-numbers = Numéroter les lignes

## Type and spacing, and paragraphs.

format-typeface = Police
format-hyphenate = Couper les mots en fin de ligne
format-indent-first = Aussi après un titre
format-space-between = Espace entre les paragraphes
format-italics = L’italique est rendu
format-italics-italic = En italique
format-italics-underline = Souligné, comme dans les manuscrits tapés à la machine
format-refmarks = Les marques de référence sont rendues
format-refmarks-raised = Petites et surélevées dans la ligne
format-refmarks-margin = Dans la marge, à côté de leur ligne

## Headings.

format-numbered = Numérotés
format-level = Niveau { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = gras
format-level-italic = italique
format-level-capitals = capitales
format-level-small-caps = petites capitales
format-level-centred = centré
format-level-right = à droite
format-level-run-in = dans le texte
format-level-indent = Avec l’alinéa d’un paragraphe
format-level-begins-text = Dans le texte
format-level-begins-page = Sur une nouvelle page
format-level-begins-right-page = Sur une page de droite
format-level-right-page-said = sur une page de droite
format-level-numbering = Numérotation
format-level-numbering-as-above = Comme le niveau du dessus
format-level-numbering-none = Aucune
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = numéroté { $style }
format-level-not-numbered = non numéroté
format-level-new-page-said = sur une nouvelle page
format-space-before = Espace avant
format-space-after = Espace après
format-level-add = Un niveau de plus
format-level-remove = Retirer le plus profond

## The title and the abstract.

format-title-placement = Le titre se place
format-title-top = En haut de la première page
format-title-own-page = Sur une page à part
format-title-authors = Auteurs
format-title-affiliations = Leurs affiliations
format-title-date = Date
format-title-abstract = Résumé et mots-clés
format-title-abstract-label = Titre du résumé
format-title-keywords-label = Mot devant les mots-clés

## Quotations, notes and the bibliography.

format-quote-from-words = À partir de tant de mots
format-quote-from-lines = Ou de tant de lignes
format-notes-kind = Les notes se placent
format-notes-footnotes = En bas de page
format-notes-endnotes = En fin de texte
format-notes-title = Titre des notes
format-bibliography-title = Titre
format-bibliography-new-page = Commence sur une nouvelle page
format-bibliography-hanging-indent = Retrait suspendu
format-bibliography-entry-spacing = Espace entre les notices

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = fondé sur { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = comme le veulent les caractères et les paragraphes de la mise en page
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = comme la base
format-kind-resolved = Tel que ce sera : { $look }
format-kind-resolved-nothing = Tel que ce sera : comme le texte autour
format-kind-resolved-failed = Ce que ce sera n’a pas pu être établi : { $reason }
format-as-the-base = Comme la base
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = Comme la base ({ $value })
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = comme la base
format-yes = Oui
format-no = Non
format-underline = Souligné
format-equal-width = Lettres de même largeur
format-equal-width-hint = Comme on compose le code
format-indent-left = Retrait à gauche
format-indent-right = Retrait à droite
format-first-line = Première ligne
format-first-line-hint = De combien elle commence plus loin que le reste
format-keep-with-next = Lié au suivant
format-keep-with-next-hint = Pas laissé seul en bas de page
format-new-page = Commence une nouvelle page
format-break-text = Ce qui se trouve dans une séparation
format-break-text-hint = * * * si rien n’est dit ; # pour un manuscrit
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = pas gras
format-look-not-italic = pas italique
format-look-underlined = souligné
format-look-not-underlined = pas souligné
format-look-as-written = comme écrit
format-look-left = à gauche
format-look-justified = justifié
format-look-indent-left = retrait de { $length } à gauche
format-look-indent-right = retrait de { $length } à droite
format-look-first-line = première ligne { $length }
format-look-space-before = { $length } avant
format-look-space-after = { $length } après
format-look-line-spacing = interligne { $spacing }
format-look-equal-width = lettres de même largeur
format-look-not-equal-width = lettres de largeur inégale
format-look-kept = lié au suivant
format-look-not-kept = pas lié au suivant
format-look-no-new-page = pas de nouvelle page
format-look-text = « { $text } » dans une séparation

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figures
format-tables = Tableaux
format-captioned-called = { $kind ->
    [figure] Une figure s’appelle
   *[table] Un tableau s’appelle
}
format-captioned-reference = Là où le texte y renvoie
format-captioned-label-bold = Le mot et le numéro en gras
format-captioned-label-italic = Le mot et le numéro en italique
format-captioned-between = { $kind ->
    [figure] Entre le numéro et la légende
   *[table] Entre le numéro et la légende
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Point ({ $called }. Légende)
   *[table] Point ({ $called }. Légende)
}
format-between-colon = { $kind ->
    [figure] Deux-points ({ $called } : Légende)
   *[table] Deux-points ({ $called } : Légende)
}
format-between-line = { $kind ->
    [figure] Légende sur une ligne à part
   *[table] Légende sur une ligne à part
}
format-between-other = Autre…
format-captioned-separator = Ce qui se trouve entre les deux
format-captioned-own-line = { $kind ->
    [figure] Puis la légende sur une ligne à part
   *[table] Puis la légende sur une ligne à part
}
format-caption = { $kind ->
    [figure] Légende
   *[table] Légende
}
format-caption-stands = { $kind ->
    [figure] La légende se place
   *[table] La légende se place
}
format-caption-below = { $kind ->
    [figure] Sous l’image
   *[table] Sous le tableau
}
format-caption-above = { $kind ->
    [figure] Au-dessus de l’image
   *[table] Au-dessus du tableau
}
format-captioned-where = { $kind ->
    [figure] Où se placent les figures
   *[table] Où se placent les tableaux
}
format-captioned-stand = { $kind ->
    [figure] Les figures se placent
   *[table] Les tableaux se placent
}
format-captioned-wrap = Le texte coule autour
format-captioned-placement = Dans le document
format-captioned-in-text = Dans le texte
format-captioned-at-end = Rassemblés à la fin
format-captioned-end-title = { $kind ->
    [figure] Titre au-dessus des figures
   *[table] Titre au-dessus des tableaux
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Ligne laissée dans le texte
format-captioned-placeholder-missing = Elle doit contenir {"{}"}, où vont le mot et le numéro
format-table-rules = Filets
format-table-rules-horizontal = Au-dessus, au-dessous, et sous les en-têtes
format-table-rules-grid = Autour de chaque cellule
format-table-rules-none = Aucun
format-table-header-bold = En-têtes en gras
format-equations = Équations
format-equations-stand = Les équations se placent
format-equations-before = Avant le numéro
format-equations-after = Après le numéro

## Page numbers and the running head.

format-page-numbers = Numéros de page
format-page-numbers-show = Les pages sont numérotées
format-page-numbering = Style des numéros
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Recommence ici à compter les pages
format-margin-header = En-tête
format-margin-footer = Pied de page
format-margin-shown = Affiché
format-margin-first-page = Sur la première page aussi
format-margin-openers = Sur les pages où commence un chapitre ou une partie aussi
format-margin-alternate = Différent sur les pages de gauche et de droite
format-margin-right-pages = Sur les pages de droite
format-margin-left-pages = Sur les pages de gauche
format-margin-place-left = À gauche
format-margin-place-center = Au centre
format-margin-place-right = À droite
format-margin-add = Ajouter…
# Said of an item in a place of the header or the footer.
format-margin-remove = Retirer { $item }
format-margin-separator = Séparateur
format-margin-text-placeholder = Vos mots
format-item-page-number = Numéro de page
format-item-title = Titre
format-item-author = Auteur
format-item-chapter = Chapitre
format-item-date = Date
format-item-text = Mes propres mots

## About the layout: where its requirements are from.

format-description = Description
format-source = D’où viennent les exigences
# The date the source was read on.
format-source-read = Lu le { $date }.
format-source-high = Les valeurs sont celles de la source.
format-source-medium = La source n’a pu être lue qu’en partie ou dans un état antérieur : vérifiez ce qui compte pour vous.
format-source-low = Peu a pu être vérifié : prenez les valeurs comme un point de départ.

## Fewer words, stage 3: the rows of Look in plain words.

format-level-begins-paragraph = Ouvre le paragraphe
format-level-placement = Placement
format-title-include = Inclure
format-title-formatting = Mise en forme
format-title-anonymize = Anonymiser la première page
format-table-inside = À l’intérieur du tableau

## Fewer words, stage 4: the two lengths of paragraphs, and the warning of long quotations.

format-indent-first-line = Retrait de la première ligne
format-quote-warn = Signaler les longues citations dans le texte

## The contributors, stage 3: the lines of the editors and the translators on the front page, and their items.

format-title-roles = Éditeurs scientifiques et traducteurs
format-item-editor = Éditeur scientifique
format-item-translator = Traducteur

## The numbering of lines, stage 2: the side of the annotations of lines.
format-verse-annotations = Les annotations se placent
format-verse-annotations-other = Du côté opposé aux numéros

## Where a line begins, stage 4: the step of an indent.
format-indent-step = Retrait par tabulation
