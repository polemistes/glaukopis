# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figur
figures-width = Bredd
figures-width-third = En tredjedel
figures-width-half = Hälften
figures-width-three-quarters = Tre fjärdedelar
figures-width-whole = Hela
figures-width-of-row = Av det utrymme den har i raden.
figures-width-of-text = Av textens bredd, i dokumentet.
figures-shows = Visar
figures-shows-placeholder = I ord, för dem som inte kan se den
figures-numbered = Numrerad, som ”Figur 1”
figures-keep-caption = Behåll bildtexten hos bilden
figures-keep-caption-hint = Figurer som görs med den här bilden börjar då med det som sägs här
figures-take-caption = Använd bildens egen
figures-take-caption-hint = Det som finns hos bilden sägs här, i stället för det som sägs nu
figures-another-picture = En annan bild…
figures-remove = Ta bort figuren
figures-caption-kept = Hos bilden
figures-caption-kept-detail = Figurer som görs med den börjar med de här orden.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = En bild
# What the files that can be chosen there are called.
figures-picture-files = Bilder

## The store of pictures, as the text reads it.

figures-pictures-unread = Bilderna kunde inte läsas
figures-picture-not-taken = Bilden kunde inte läggas till
figures-picture-not-kept = Det som sades om bilden kunde inte sparas
figures-picture-not-removed = Bilden kunde inte tas bort

## Where a figure, a table or an equation stands.

figures-stands = Står
figures-stands-in-row = bredvid andra, i en rad
figures-stands-alone = För sig själv igen
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Var { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] ekvationen
    } står
figures-side-format = Som formatet
figures-side-left = Vänster
figures-side-middle = Mitten
figures-side-right = Höger
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Formatet har { $kind ->
        [figure] figurer
        [table] tabeller
       *[equation] ekvationer
    } { $side ->
        [left] till vänster
        [right] till höger
       *[center] i mitten
    }{ $flow ->
        [around] , med texten flytande runt dem
        [apart] , skilda från texten
       *[none] {""}
    }.
figures-text = Text
figures-flows-where = Om texten flyter runt { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] ekvationen
    }
figures-flow-format = Som formatet
figures-flow-around = Flyter runt den
figures-flow-apart = Står för sig
figures-flow-at-side = Texten flyter runt det som står vid en sida.
figures-beside = Ställ den bredvid den föregående

## A formula in the line, and an equation on a line of its own.

figures-formula = Formel
figures-equation = Ekvation
figures-equation-numbered = Numrerad
figures-formula-field = Formeln, i TeX-notation
figures-formula-empty = Det som skrivs visas här som det kommer att stå.
figures-formula-hint = Skrivs som i TeX. Retur när du är klar, Esc för att lämna den som den var.
figures-equation-hint = Skrivs som i TeX. Retur när du är klar, Skift+Retur för ny rad, Esc för att lämna den som den var.
figures-formula-unread = Formeln kunde inte läsas.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formel
figures-equation-blank = En ekvation

## What can be put into a formula by pressing.

figures-sign-raised = Upphöjt
figures-sign-lowered = Nedsänkt
figures-sign-fraction = Bråk
figures-sign-root = Rot
figures-sign-sum = Summa
figures-sign-integral = Integral
figures-sign-brackets = Parenteser som växer
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Mindre än eller lika med
figures-sign-greater-or-equal = Större än eller lika med
figures-sign-not-equal = Inte lika med
figures-sign-nearly-equal = Ungefär lika med
figures-sign-times = Gånger
figures-sign-plus-or-minus = Plus eller minus
figures-sign-arrow = Pil
figures-sign-infinity = Oändligt
figures-sign-words = Ord inuti en formel

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Visas som
figures-form-full = Ordet och numret
figures-form-number = Bara numret
figures-form-equation = Numret som det står vid ekvationen
figures-form-its-number = Dess nummer
figures-form-its-name = Dess namn
figures-go-to = Gå till det den hänvisar till
figures-pointed-gone = Det den här hänvisar till finns inte längre i dokumentet
figures-point-elsewhere = Hänvisa till något annat…

## Choosing what a cross-reference refers to.

figures-targets = Välj vad som ska hänvisas till
figures-targets-placeholder = Hänvisa till en figur, en tabell, en ekvation, en del
figures-targets-search = Sök bland det som kan hänvisas till
figures-targets-results = Det som kan hänvisas till
figures-targets-figures = Figurer
figures-targets-tables = Tabeller
figures-targets-equations = Ekvationer
figures-targets-parts = Delar av dokumentet
figures-targets-figure-unsaid = En figur som inget sägs om
figures-targets-table-unsaid = En tabell som inget sägs om
figures-targets-no-match = Inget i dokumentet svarar mot de här orden.
figures-targets-none = Det finns inget att hänvisa till än: ingen figur, ingen tabell, ingen numrerad ekvation, ingen del med namn.
figures-targets-hint = En korshänvisning följer det den hänvisar till: dess nummer, och vad formatet kallar det.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Bilden finns inte på den här datorn
figures-caption-placeholder = Vad som sägs om bilden
