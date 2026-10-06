# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figuur
figures-width = Breedte
figures-width-third = Een derde
figures-width-half = De helft
figures-width-three-quarters = Driekwart
figures-width-whole = Volledig
figures-width-of-row = Van de ruimte die ze in de rij heeft.
figures-width-of-text = Van de breedte van de tekst, in het document.
figures-shows = Toont
figures-shows-placeholder = In woorden, voor wie ze niet kan zien
figures-numbered = Genummerd, als ‘Figuur 1’
figures-keep-caption = Het bijschrift bij de afbeelding bewaren
figures-keep-caption-hint = Figuren die met deze afbeelding worden gemaakt, beginnen dan met wat hier staat
figures-take-caption = Dat van de afbeelding gebruiken
figures-take-caption-hint = Wat bij de afbeelding is bewaard, komt hier te staan, in plaats van wat er nu staat
figures-another-picture = Een andere afbeelding…
figures-remove = De figuur verwijderen
figures-caption-kept = Bewaard bij de afbeelding
figures-caption-kept-detail = Figuren die ermee worden gemaakt, beginnen met deze woorden.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Een afbeelding
# What the files that can be chosen there are called.
figures-picture-files = Afbeeldingen

## The store of pictures, as the text reads it.

figures-pictures-unread = De afbeeldingen konden niet worden gelezen
figures-picture-not-taken = De afbeelding kon niet worden toegevoegd
figures-picture-not-kept = Wat over de afbeelding is gezegd, kon niet worden bewaard
figures-picture-not-removed = De afbeelding kon niet worden verwijderd

## Where a figure, a table or an equation stands.

figures-stands = Staat
figures-stands-in-row = naast andere, in een rij
figures-stands-alone = Weer op zichzelf
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Waar de { $kind ->
        [figure] figuur
        [table] tabel
       *[equation] vergelijking
    } staat
figures-side-format = Zoals het formaat
figures-side-left = Links
figures-side-middle = Midden
figures-side-right = Rechts
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Het formaat zet { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] vergelijkingen
    } { $side ->
        [left] links
        [right] rechts
       *[center] in het midden
    }{ $flow ->
        [around] , met de tekst eromheen
        [apart] , los van de tekst
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Of de tekst om de { $kind ->
        [figure] figuur
        [table] tabel
       *[equation] vergelijking
    } heen loopt
figures-flow-format = Zoals het formaat
figures-flow-around = Loopt eromheen
figures-flow-apart = Staat los
figures-flow-at-side = De tekst loopt om wat aan een zijde staat.
figures-beside = Naast de vorige zetten

## A formula in the line, and an equation on a line of its own.

figures-formula = Formule
figures-equation = Vergelijking
figures-equation-numbered = Genummerd
figures-formula-field = De formule, in de notatie van TeX
figures-formula-empty = Wat wordt geschreven, wordt hier getoond zoals het komt te staan.
figures-formula-hint = Geschreven als in TeX. Enter als het klaar is, Esc om het te laten zoals het was.
figures-equation-hint = Geschreven als in TeX. Enter als het klaar is, Shift+Enter voor een nieuwe regel, Esc om het te laten zoals het was.
figures-formula-unread = De formule kon niet worden gelezen.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formule
figures-equation-blank = Een vergelijking

## What can be put into a formula by pressing.

figures-sign-raised = Verhoogd
figures-sign-lowered = Verlaagd
figures-sign-fraction = Breuk
figures-sign-root = Wortel
figures-sign-sum = Som
figures-sign-integral = Integraal
figures-sign-brackets = Meegroeiende haakjes
figures-sign-alpha = alfa
figures-sign-beta = bèta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Kleiner dan of gelijk aan
figures-sign-greater-or-equal = Groter dan of gelijk aan
figures-sign-not-equal = Ongelijk aan
figures-sign-nearly-equal = Ongeveer gelijk aan
figures-sign-times = Maal
figures-sign-plus-or-minus = Plus of min
figures-sign-arrow = Pijl
figures-sign-infinity = Oneindig
figures-sign-words = Woorden in een formule

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Getoond als
figures-form-full = Het woord en het nummer
figures-form-number = Alleen het nummer
figures-form-equation = Het nummer zoals het bij de vergelijking staat
figures-form-its-number = Zijn nummer
figures-form-its-name = Zijn naam
figures-go-to = Ga naar waar ze naar verwijst
figures-pointed-gone = Waar deze naar verwijst, staat niet meer in het document
figures-point-elsewhere = Naar iets anders verwijzen…

## Choosing what a cross-reference refers to.

figures-targets = Kies waarnaar wordt verwezen
figures-targets-placeholder = Verwijs naar een figuur, een tabel, een vergelijking, een deel
figures-targets-search = Zoeken waarnaar kan worden verwezen
figures-targets-results = Waarnaar kan worden verwezen
figures-targets-figures = Figuren
figures-targets-tables = Tabellen
figures-targets-equations = Vergelijkingen
figures-targets-parts = Delen van het document
figures-targets-figure-unsaid = Een figuur waarover niets is gezegd
figures-targets-table-unsaid = Een tabel waarover niets is gezegd
figures-targets-no-match = Niets in het document beantwoordt aan deze woorden.
figures-targets-none = Er is nog niets om naar te verwijzen: geen figuur, geen tabel, geen genummerde vergelijking, geen deel met een naam.
figures-targets-hint = Een kruisverwijzing volgt waar ze naar verwijst: het nummer, en hoe het formaat het noemt.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = De afbeelding staat niet op deze computer
figures-caption-placeholder = Wat over de afbeelding wordt gezegd
