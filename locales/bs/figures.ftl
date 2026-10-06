# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Ilustracija
figures-width = Širina
figures-width-third = Trećina
figures-width-half = Polovina
figures-width-three-quarters = Tri četvrtine
figures-width-whole = Cijela
figures-width-of-row = Od prostora koji ima u redu.
figures-width-of-text = Od širine teksta, u dokumentu.
figures-shows = Prikazuje
figures-shows-placeholder = Riječima, za one koji je ne mogu vidjeti
figures-numbered = Numerirana, kao „Slika 1“
figures-keep-caption = Zadrži natpis uz sliku
figures-keep-caption-hint = Ilustracije napravljene od ove slike počinju onda onim što je ovdje rečeno
figures-take-caption = Uzmi onaj od slike
figures-take-caption-hint = Ono što se čuva uz sliku kaže se ovdje, umjesto onoga što se sada kaže
figures-another-picture = Druga slika…
figures-remove = Ukloni ilustraciju
figures-caption-kept = Sačuvano uz sliku
figures-caption-kept-detail = Ilustracije napravljene od nje počinju ovim riječima.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Slika
# What the files that can be chosen there are called.
figures-picture-files = Slike

## The store of pictures, as the text reads it.

figures-pictures-unread = Slike nije bilo moguće pročitati
figures-picture-not-taken = Sliku nije bilo moguće dodati
figures-picture-not-kept = Ono što je rečeno o slici nije bilo moguće sačuvati
figures-picture-not-removed = Sliku nije bilo moguće ukloniti

## Where a figure, a table or an equation stands.

figures-stands = Stoji
figures-stands-in-row = pored drugih, u redu
figures-stands-alone = Opet sama za sebe
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Gdje { $kind ->
        [figure] ilustracija
        [table] tabela
       *[equation] jednačina
    } stoji
figures-side-format = Kao format
figures-side-left = Lijevo
figures-side-middle = Sredina
figures-side-right = Desno
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Format { $kind ->
        [figure] ilustracije
        [table] tabele
       *[equation] jednačine
    } smješta { $side ->
        [left] lijevo
        [right] desno
       *[center] u sredinu
    }{ $flow ->
        [around] , s tekstom koji teče oko njih
        [apart] , odvojeno od teksta
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Teče li tekst oko { $kind ->
        [figure] ilustracije
        [table] tabele
       *[equation] jednačine
    }
figures-flow-format = Kao format
figures-flow-around = Teče oko nje
figures-flow-apart = Stoji odvojeno
figures-flow-at-side = Tekst teče oko onoga što stoji sa strane.
figures-beside = Stavi je pored prethodne

## A formula in the line, and an equation on a line of its own.

figures-formula = Formula
figures-equation = Jednačina
figures-equation-numbered = Numerirana
figures-formula-field = Formula, u notaciji TeX-a
figures-formula-empty = Ono što je napisano prikazuje se ovdje kako će stajati.
figures-formula-hint = Piše se kao u TeX-u. Enter kad završite, Esc da ostane kako je bila.
figures-equation-hint = Piše se kao u TeX-u. Enter kad završite, Shift+Enter za novi red, Esc da ostane kako je bila.
figures-formula-unread = Formulu nije bilo moguće pročitati.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formula
figures-equation-blank = Jednačina

## What can be put into a formula by pressing.

figures-sign-raised = Podignuto
figures-sign-lowered = Spušteno
figures-sign-fraction = Razlomak
figures-sign-root = Korijen
figures-sign-sum = Suma
figures-sign-integral = Integral
figures-sign-brackets = Zagrade koje rastu
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Manje ili jednako
figures-sign-greater-or-equal = Veće ili jednako
figures-sign-not-equal = Nije jednako
figures-sign-nearly-equal = Približno jednako
figures-sign-times = Puta
figures-sign-plus-or-minus = Plus-minus
figures-sign-arrow = Strelica
figures-sign-infinity = Beskonačno
figures-sign-words = Riječi unutar formule

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Prikazano kao
figures-form-full = Riječ i broj
figures-form-number = Samo broj
figures-form-equation = Broj kako stoji uz jednačinu
figures-form-its-number = Njegov broj
figures-form-its-name = Njegov naziv
figures-go-to = Idi na ono na šta upućuje
figures-pointed-gone = Onoga na šta ovo upućuje više nema u dokumentu
figures-point-elsewhere = Uputi na nešto drugo…

## Choosing what a cross-reference refers to.

figures-targets = Odaberite na šta uputiti
figures-targets-placeholder = Uputi na ilustraciju, tabelu, jednačinu, dio
figures-targets-search = Pretraži ono na šta se može uputiti
figures-targets-results = Na šta se može uputiti
figures-targets-figures = Ilustracije
figures-targets-tables = Tabele
figures-targets-equations = Jednačine
figures-targets-parts = Dijelovi dokumenta
figures-targets-figure-unsaid = Ilustracija o kojoj ništa nije rečeno
figures-targets-table-unsaid = Tabela o kojoj ništa nije rečeno
figures-targets-no-match = Ništa u dokumentu ne odgovara ovim riječima.
figures-targets-none = Još nema ničega na šta bi se uputilo: nijedne ilustracije, tabele, numerirane jednačine ni dijela s nazivom.
figures-targets-hint = Uputnica prati ono na šta upućuje: njegov broj i kako ga format zove.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Slika nije na ovom računaru
figures-caption-placeholder = Ono što se kaže o slici
