# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figure
figures-width = Largeur
figures-width-third = Un tiers
figures-width-half = La moitié
figures-width-three-quarters = Trois quarts
figures-width-whole = Entière
figures-width-of-row = De la place qu’elle a dans la rangée.
figures-width-of-text = De la largeur du texte, dans le document.
figures-shows = Montre
figures-shows-placeholder = En mots, pour qui ne peut pas la voir
figures-numbered = Numérotée, comme « Figure 1 »
figures-keep-caption = Garder la légende avec l’image
figures-keep-caption-hint = Les figures faites avec cette image commencent alors par ce qui est dit ici
figures-take-caption = Prendre celle de l’image
figures-take-caption-hint = Ce qui est gardé avec l’image est dit ici, à la place de ce qui est dit maintenant
figures-another-picture = Une autre image…
figures-remove = Retirer la figure
figures-caption-kept = Gardée avec l’image
figures-caption-kept-detail = Les figures faites avec elle commencent par ces mots.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Une image
# What the files that can be chosen there are called.
figures-picture-files = Images

## The store of pictures, as the text reads it.

figures-pictures-unread = Les images n’ont pas pu être lues
figures-picture-not-taken = L’image n’a pas pu être ajoutée
figures-picture-not-kept = Ce qui a été dit de l’image n’a pas pu être gardé
figures-picture-not-removed = L’image n’a pas pu être retirée

## Where a figure, a table or an equation stands.

figures-stands = Position
figures-stands-in-row = à côté d’autres, en rangée
figures-stands-alone = De nouveau à part
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Où { $kind ->
        [figure] la figure
        [table] le tableau
       *[equation] l’équation
    } se place
figures-side-format = Comme le format
figures-side-left = À gauche
figures-side-middle = Au milieu
figures-side-right = À droite
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Le format met { $kind ->
        [figure] les figures
        [table] les tableaux
       *[equation] les équations
    } { $side ->
        [left] à gauche
        [right] à droite
       *[center] au milieu
    }{ $flow ->
        [around] , le texte coulant autour
        [apart] , à l’écart du texte
       *[none] {""}
    }.
figures-text = Texte
figures-flows-where = Si le texte coule autour { $kind ->
        [figure] de la figure
        [table] du tableau
       *[equation] de l’équation
    }
figures-flow-format = Comme le format
figures-flow-around = Coule autour
figures-flow-apart = Reste à l’écart
figures-flow-at-side = Le texte coule autour de ce qui se place sur un côté.
figures-beside = Placer à côté de ce qui précède

## A formula in the line, and an equation on a line of its own.

figures-formula = Formule
figures-equation = Équation
figures-equation-numbered = Numérotée
figures-formula-field = La formule, en notation TeX
figures-formula-empty = Ce qui est écrit s’affiche ici tel qu’il se présentera.
figures-formula-hint = Écrite comme en TeX. Entrée quand c’est fini, Échap pour la laisser comme elle était.
figures-equation-hint = Écrite comme en TeX. Entrée quand c’est fini, Maj+Entrée pour une nouvelle ligne, Échap pour la laisser comme elle était.
figures-formula-unread = La formule n’a pas pu être lue.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formule
figures-equation-blank = Une équation

## What can be put into a formula by pressing.

figures-sign-raised = Exposant
figures-sign-lowered = Indice
figures-sign-fraction = Fraction
figures-sign-root = Racine
figures-sign-sum = Somme
figures-sign-integral = Intégrale
figures-sign-brackets = Parenthèses qui grandissent
figures-sign-alpha = alpha
figures-sign-beta = bêta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Inférieur ou égal
figures-sign-greater-or-equal = Supérieur ou égal
figures-sign-not-equal = Différent
figures-sign-nearly-equal = À peu près égal
figures-sign-times = Multiplié par
figures-sign-plus-or-minus = Plus ou moins
figures-sign-arrow = Flèche
figures-sign-infinity = Infini
figures-sign-words = Des mots dans une formule

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Affiché comme
figures-form-full = Le mot et le numéro
figures-form-number = Le numéro seul
figures-form-equation = Le numéro tel qu’il est à côté de l’équation
figures-form-its-number = Son numéro
figures-form-its-name = Son nom
figures-go-to = Aller à ce qu’il désigne
figures-pointed-gone = Ce que ce renvoi désigne n’est plus dans le document
figures-point-elsewhere = Renvoyer à autre chose…

## Choosing what a cross-reference refers to.

figures-targets = Choisir à quoi renvoyer
figures-targets-placeholder = Renvoyer à une figure, un tableau, une équation, une partie
figures-targets-search = Rechercher ce à quoi renvoyer
figures-targets-results = Ce à quoi on peut renvoyer
figures-targets-figures = Figures
figures-targets-tables = Tableaux
figures-targets-equations = Équations
figures-targets-parts = Parties du document
figures-targets-figure-unsaid = Une figure dont rien n’est dit
figures-targets-table-unsaid = Un tableau dont rien n’est dit
figures-targets-no-match = Rien dans le document ne répond à ces mots.
figures-targets-none = Il n’y a encore rien à quoi renvoyer : ni figure, ni tableau, ni équation numérotée, ni partie qui ait un nom.
figures-targets-hint = Un renvoi suit ce qu’il désigne : son numéro, et le nom que le format lui donne.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = L’image n’est pas sur cet ordinateur
figures-caption-placeholder = Ce qui est dit de l’image
