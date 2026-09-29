# Figures, formulas and equations in the text, and the words that point to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figure
figures-width = Width
figures-width-third = A third
figures-width-half = Half
figures-width-three-quarters = Three quarters
figures-width-whole = Whole
figures-width-of-row = Of the room it has in the row.
figures-width-of-text = Of the width of the text, in the document.
figures-shows = Shows
figures-shows-placeholder = In words, for those who cannot see it
figures-numbered = Numbered, as “Figure 1”
figures-keep-caption = Keep the caption with the picture
figures-keep-caption-hint = Figures made with this picture then begin with what is said here
figures-take-caption = Use the picture’s own
figures-take-caption-hint = What is kept with the picture is said here, in place of what is said now
figures-another-picture = Another picture…
figures-remove = Remove the figure
figures-caption-kept = Kept with the picture
figures-caption-kept-detail = Figures made with it begin with these words.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = A picture
# What the files that can be chosen there are called.
figures-picture-files = Pictures

## The store of pictures, as the text reads it.

figures-pictures-unread = The pictures could not be read
figures-picture-not-taken = The picture could not be taken in
figures-picture-not-kept = What was said of the picture could not be kept
figures-picture-not-removed = The picture could not be removed

## Where a figure, a table or an equation stands.

figures-stands = Stands
figures-stands-in-row = beside others, in a row
figures-stands-alone = By itself again
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Where the { $kind ->
        [figure] figure
        [table] table
       *[equation] equation
    } stands
figures-side-format = As the format
figures-side-left = Left
figures-side-middle = Middle
figures-side-right = Right
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = The format has { $kind ->
        [figure] figures
        [table] tables
       *[equation] equations
    } { $side ->
        [left] to the left
        [right] to the right
       *[center] in the middle
    }{ $flow ->
        [around] , with the text flowing around them
        [apart] , apart from the text
       *[none] {""}
    }.
figures-text = Text
figures-flows-where = Whether the text flows around the { $kind ->
        [figure] figure
        [table] table
       *[equation] equation
    }
figures-flow-format = As the format
figures-flow-around = Flows around it
figures-flow-apart = Stands apart
figures-flow-at-side = The text flows around what stands at a side.
figures-beside = Put it beside the one before it

## A formula in the line, and an equation on a line of its own.

figures-formula = Formula
figures-equation = Equation
figures-equation-numbered = Numbered
figures-formula-field = The formula, in the notation of TeX
figures-formula-empty = What is written is shown here as it will stand.
figures-formula-hint = Written as in TeX. Enter when done, Escape to leave it as it was.
figures-equation-hint = Written as in TeX. Enter when done, Shift+Enter for a new line, Escape to leave it as it was.
figures-formula-unread = The formula could not be read.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formula
figures-equation-blank = An equation

## What can be put into a formula by pressing.

figures-sign-raised = Raised
figures-sign-lowered = Lowered
figures-sign-fraction = Fraction
figures-sign-root = Root
figures-sign-sum = Sum
figures-sign-integral = Integral
figures-sign-brackets = Brackets that grow
figures-sign-alpha = alpha
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Less than or equal
figures-sign-greater-or-equal = Greater than or equal
figures-sign-not-equal = Not equal
figures-sign-nearly-equal = Nearly equal
figures-sign-times = Times
figures-sign-plus-or-minus = Plus or minus
figures-sign-arrow = Arrow
figures-sign-infinity = Without end
figures-sign-words = Words within a formula

## Words that point to a figure, a table, an equation or a part.

figures-points-by = Points by
figures-form-full = The word and the number
figures-form-number = The number alone
figures-form-equation = The number as it stands by the equation
figures-form-its-number = Its number
figures-form-its-name = Its name
figures-go-to = Go to what it points to
figures-pointed-gone = What this pointed to is not in the document
figures-point-elsewhere = Point to something else…

## Choosing what to point to.

figures-targets = Choose what to point to
figures-targets-placeholder = Point to a figure, a table, an equation, a part
figures-targets-search = Search what can be pointed to
figures-targets-results = What can be pointed to
figures-targets-figures = Figures
figures-targets-tables = Tables
figures-targets-equations = Equations
figures-targets-parts = Parts of the document
figures-targets-figure-unsaid = A figure of which nothing is said
figures-targets-table-unsaid = A table of which nothing is said
figures-targets-no-match = Nothing in the document answers to these words.
figures-targets-none = There is nothing to point to yet: no figure, no table, no numbered equation, no part with a name.
figures-targets-hint = The words follow what they point to: its number, and what the format calls it.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = The picture is not on this computer
figures-caption-placeholder = What is said of the picture
