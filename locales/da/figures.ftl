# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figur
figures-width = Bredde
figures-width-third = En tredjedel
figures-width-half = Halv
figures-width-three-quarters = Tre fjerdedele
figures-width-whole = Hel
figures-width-of-row = Af den plads, den har i rækken.
figures-width-of-text = Af tekstens bredde i dokumentet.
figures-shows = Viser
figures-shows-placeholder = Med ord, for dem, der ikke kan se det
figures-numbered = Nummereret, som »Figur 1«
figures-keep-caption = Gem billedteksten med billedet
figures-keep-caption-hint = Figurer lavet med dette billede begynder så med det, der står her
figures-take-caption = Brug billedets egen
figures-take-caption-hint = Det, der er gemt med billedet, sættes her i stedet for det, der står nu
figures-another-picture = Et andet billede…
figures-remove = Fjern figuren
figures-caption-kept = Gemt med billedet
figures-caption-kept-detail = Figurer lavet med det begynder med disse ord.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Et billede
# What the files that can be chosen there are called.
figures-picture-files = Billeder

## The store of pictures, as the text reads it.

figures-pictures-unread = Billederne kunne ikke læses
figures-picture-not-taken = Billedet kunne ikke tilføjes
figures-picture-not-kept = Det, der blev sagt om billedet, kunne ikke gemmes
figures-picture-not-removed = Billedet kunne ikke fjernes

## Where a figure, a table or an equation stands.

figures-stands = Står
figures-stands-in-row = ved siden af andre, i en række
figures-stands-alone = For sig selv igen
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Hvor { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] ligningen
    } står
figures-side-format = Som formatet
figures-side-left = Venstre
figures-side-middle = Midten
figures-side-right = Højre
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Formatet har { $kind ->
        [figure] figurer
        [table] tabeller
       *[equation] ligninger
    } { $side ->
        [left] til venstre
        [right] til højre
       *[center] i midten
    }{ $flow ->
        [around] , med teksten løbende omkring dem
        [apart] , adskilt fra teksten
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Om teksten løber omkring { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] ligningen
    }
figures-flow-format = Som formatet
figures-flow-around = Løber omkring
figures-flow-apart = Står for sig
figures-flow-at-side = Teksten løber omkring det, der står i en side.
figures-beside = Sæt den ved siden af den foregående

## A formula in the line, and an equation on a line of its own.

figures-formula = Formel
figures-equation = Ligning
figures-equation-numbered = Nummereret
figures-formula-field = Formlen, i TeX-notation
figures-formula-empty = Det, der skrives, vises her, som det kommer til at stå.
figures-formula-hint = Skrives som i TeX. Enter, når du er færdig, Esc for at lade den stå, som den var.
figures-equation-hint = Skrives som i TeX. Enter, når du er færdig, Skift+Enter for en ny linje, Esc for at lade den stå, som den var.
figures-formula-unread = Formlen kunne ikke læses.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formel
figures-equation-blank = En ligning

## What can be put into a formula by pressing.

figures-sign-raised = Hævet
figures-sign-lowered = Sænket
figures-sign-fraction = Brøk
figures-sign-root = Rod
figures-sign-sum = Sum
figures-sign-integral = Integral
figures-sign-brackets = Parenteser, der vokser
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Mindre end eller lig med
figures-sign-greater-or-equal = Større end eller lig med
figures-sign-not-equal = Ikke lig med
figures-sign-nearly-equal = Omtrent lig med
figures-sign-times = Gange
figures-sign-plus-or-minus = Plus eller minus
figures-sign-arrow = Pil
figures-sign-infinity = Uendelig
figures-sign-words = Ord i en formel

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Vises som
figures-form-full = Ordet og tallet
figures-form-number = Tallet alene
figures-form-equation = Tallet, som det står ved ligningen
figures-form-its-number = Nummeret
figures-form-its-name = Navnet
figures-go-to = Gå til det, den henviser til
figures-pointed-gone = Det, denne henviser til, er ikke længere i dokumentet
figures-point-elsewhere = Henvis til noget andet…

## Choosing what a cross-reference refers to.

figures-targets = Vælg, hvad der skal henvises til
figures-targets-placeholder = Henvis til en figur, en tabel, en ligning, en del
figures-targets-search = Søg i det, der kan henvises til
figures-targets-results = Det, der kan henvises til
figures-targets-figures = Figurer
figures-targets-tables = Tabeller
figures-targets-equations = Ligninger
figures-targets-parts = Dele af dokumentet
figures-targets-figure-unsaid = En figur, der intet er sagt om
figures-targets-table-unsaid = En tabel, der intet er sagt om
figures-targets-no-match = Intet i dokumentet svarer til disse ord.
figures-targets-none = Der er intet at henvise til endnu: ingen figur, ingen tabel, ingen nummereret ligning, ingen del med et navn.
figures-targets-hint = En krydshenvisning følger det, den henviser til: dets nummer, og hvad formatet kalder det.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Billedet er ikke på denne computer
figures-caption-placeholder = Det, der siges om billedet
