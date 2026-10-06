# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figur
figures-width = Breidd
figures-width-third = Ein tredel
figures-width-half = Halv
figures-width-three-quarters = Tre firedelar
figures-width-whole = Heil
figures-width-of-row = Av plassen den har i rada.
figures-width-of-text = Av tekstbreidda i dokumentet.
figures-shows = Viser
figures-shows-placeholder = Med ord, for dei som ikkje kan sjå det
figures-numbered = Nummerert, som «Figur 1»
figures-keep-caption = Lagre biletteksten med biletet
figures-keep-caption-hint = Figurar som blir laga med dette biletet, byrjar då med det som står her
figures-take-caption = Bruk biletet sin eigen
figures-take-caption-hint = Det som er lagra med biletet, blir sett her i staden for det som står no
figures-another-picture = Eit anna bilete …
figures-remove = Fjern figuren
figures-caption-kept = Lagra med biletet
figures-caption-kept-detail = Figurar som blir laga med det, byrjar med desse orda.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Eit bilete
# What the files that can be chosen there are called.
figures-picture-files = Bilete

## The store of pictures, as the text reads it.

figures-pictures-unread = Bileta kunne ikkje lesast
figures-picture-not-taken = Biletet kunne ikkje leggjast til
figures-picture-not-kept = Det som vart sagt om biletet, kunne ikkje lagrast
figures-picture-not-removed = Biletet kunne ikkje fjernast

## Where a figure, a table or an equation stands.

figures-stands = Står
figures-stands-in-row = ved sida av andre, i ei rad
figures-stands-alone = For seg sjølv igjen
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Kvar { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] likninga
    } står
figures-side-format = Som formatet
figures-side-left = Venstre
figures-side-middle = Midten
figures-side-right = Høgre
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Formatet har { $kind ->
        [figure] figurar
        [table] tabellar
       *[equation] likningar
    } { $side ->
        [left] til venstre
        [right] til høgre
       *[center] i midten
    }{ $flow ->
        [around] , med teksten rundt seg
        [apart] , skilde frå teksten
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Om teksten flyt rundt { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] likninga
    }
figures-flow-format = Som formatet
figures-flow-around = Flyt rundt
figures-flow-apart = Står for seg
figures-flow-at-side = Teksten flyt rundt det som står ved ei side.
figures-beside = Set den ved sida av den framfor

## A formula in the line, and an equation on a line of its own.

figures-formula = Formel
figures-equation = Likning
figures-equation-numbered = Nummerert
figures-formula-field = Formelen, skriven som i TeX
figures-formula-empty = Det som blir skrive, blir vist her slik det vil stå.
figures-formula-hint = Skriv som i TeX. Enter når du er ferdig, Escape for å la den vere som den var.
figures-equation-hint = Skriv som i TeX. Enter når du er ferdig, Shift+Enter for ny linje, Escape for å la den vere som den var.
figures-formula-unread = Formelen kunne ikkje lesast.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formel
figures-equation-blank = Ei likning

## What can be put into a formula by pressing.

figures-sign-raised = Heva
figures-sign-lowered = Senka
figures-sign-fraction = Brøk
figures-sign-root = Rot
figures-sign-sum = Sum
figures-sign-integral = Integral
figures-sign-brackets = Parentesar som veks
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Mindre enn eller lik
figures-sign-greater-or-equal = Større enn eller lik
figures-sign-not-equal = Ikkje lik
figures-sign-nearly-equal = Om lag lik
figures-sign-times = Gonger
figures-sign-plus-or-minus = Pluss eller minus
figures-sign-arrow = Pil
figures-sign-infinity = Uendeleg
figures-sign-words = Ord i ein formel

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Vist som
figures-form-full = Ordet og talet
figures-form-number = Berre talet
figures-form-equation = Talet slik det står ved likninga
figures-form-its-number = Nummeret
figures-form-its-name = Namnet
figures-go-to = Gå til det den viser til
figures-pointed-gone = Det denne viste til, er ikkje lenger i dokumentet
figures-point-elsewhere = Vis til noko anna …

## Choosing what a cross-reference refers to.

figures-targets = Vel kva det skal visast til
figures-targets-placeholder = Vis til ein figur, ein tabell, ei likning, ein del
figures-targets-search = Søk i det som kan visast til
figures-targets-results = Det som kan visast til
figures-targets-figures = Figurar
figures-targets-tables = Tabellar
figures-targets-equations = Likningar
figures-targets-parts = Delar av dokumentet
figures-targets-figure-unsaid = Ein figur utan bilettekst
figures-targets-table-unsaid = Ein tabell utan tabelltekst
figures-targets-no-match = Ingenting i dokumentet svarer til desse orda.
figures-targets-none = Det er ingenting å vise til enno: ingen figur, ingen tabell, inga nummerert likning, ingen del med namn.
figures-targets-hint = Ein kryssreferanse følgjer det den viser til: nummeret, og det formatet kallar det.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Biletet finst ikkje på denne datamaskina
figures-caption-placeholder = Bilettekst
