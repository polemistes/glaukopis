# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Ilustracija
figures-width = Širina
figures-width-third = Trećina
figures-width-half = Polovica
figures-width-three-quarters = Tri četvrtine
figures-width-whole = Cijela
figures-width-of-row = Od mjesta koje ima u redu.
figures-width-of-text = Od širine teksta, u dokumentu.
figures-shows = Prikazuje
figures-shows-placeholder = Riječima, za one koji je ne vide
figures-numbered = Numerirana, kao „Slika 1”
figures-keep-caption = Zadrži opis uz sliku
figures-keep-caption-hint = Ilustracije načinjene od ove slike tada počinju onim što je ovdje rečeno
figures-take-caption = Uzmi onaj koji slika ima
figures-take-caption-hint = Što je zadržano uz sliku kaže se ovdje, umjesto onoga što se kaže sad
figures-another-picture = Druga slika…
figures-remove = Ukloni ilustraciju
figures-caption-kept = Zadržano uz sliku
figures-caption-kept-detail = Ilustracije načinjene od nje počinju ovim riječima.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Slika
# What the files that can be chosen there are called.
figures-picture-files = Slike

## The store of pictures, as the text reads it.

figures-pictures-unread = Slike nije bilo moguće pročitati
figures-picture-not-taken = Sliku nije bilo moguće dodati
figures-picture-not-kept = Što je rečeno o slici nije bilo moguće sačuvati
figures-picture-not-removed = Sliku nije bilo moguće ukloniti

## Where a figure, a table or an equation stands.

figures-stands = Stoji
figures-stands-in-row = pokraj drugih, u redu
figures-stands-alone = Opet sama za sebe
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Gdje stoji { $kind ->
        [figure] ilustracija
        [table] tablica
       *[equation] jednadžba
    }
figures-side-format = Kao format
figures-side-left = Lijevo
figures-side-middle = U sredini
figures-side-right = Desno
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Format ima { $kind ->
        [figure] ilustracije
        [table] tablice
       *[equation] jednadžbe
    } { $side ->
        [left] lijevo
        [right] desno
       *[center] u sredini
    }{ $flow ->
        [around] , s tekstom koji ih optječe
        [apart] , odvojene od teksta
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Optječe li tekst { $kind ->
        [figure] ilustraciju
        [table] tablicu
       *[equation] jednadžbu
    }
figures-flow-format = Kao format
figures-flow-around = Optječe je
figures-flow-apart = Stoji odvojeno
figures-flow-at-side = Tekst optječe ono što stoji sa strane.
figures-beside = Stavi je pokraj prethodne

## A formula in the line, and an equation on a line of its own.

figures-formula = Formula
figures-equation = Jednadžba
figures-equation-numbered = Numerirana
figures-formula-field = Formula, u zapisu TeX-a
figures-formula-empty = Što je napisano prikazuje se ovdje kako će stajati.
figures-formula-hint = Piše se kao u TeX-u. Enter kad je gotovo, Esc da ostane kako je bilo.
figures-equation-hint = Piše se kao u TeX-u. Enter kad je gotovo, Shift+Enter za novi redak, Esc da ostane kako je bilo.
figures-formula-unread = Formulu nije bilo moguće pročitati.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formula
figures-equation-blank = Jednadžba

## What can be put into a formula by pressing.

figures-sign-raised = Podignuto
figures-sign-lowered = Spušteno
figures-sign-fraction = Razlomak
figures-sign-root = Korijen
figures-sign-sum = Zbroj
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
figures-form-equation = Broj kako stoji uz jednadžbu
figures-form-its-number = Njegov broj
figures-form-its-name = Njegov naziv
figures-go-to = Idi na ono na što upućuje
figures-pointed-gone = Ono na što ovo upućuje više nije u dokumentu
figures-point-elsewhere = Uputi na nešto drugo…

## Choosing what a cross-reference refers to.

figures-targets = Odaberite na što uputiti
figures-targets-placeholder = Uputi na ilustraciju, tablicu, jednadžbu, dio
figures-targets-search = Pretraži ono na što se može uputiti
figures-targets-results = Na što se može uputiti
figures-targets-figures = Ilustracije
figures-targets-tables = Tablice
figures-targets-equations = Jednadžbe
figures-targets-parts = Dijelovi dokumenta
figures-targets-figure-unsaid = Ilustracija o kojoj ništa nije rečeno
figures-targets-table-unsaid = Tablica o kojoj ništa nije rečeno
figures-targets-no-match = Ništa u dokumentu ne odgovara tim riječima.
figures-targets-none = Još nema na što uputiti: ni ilustracije, ni tablice, ni numerirane jednadžbe, ni dijela s nazivom.
figures-targets-hint = Uputnica slijedi ono na što upućuje: njegov broj i kako ga format zove.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Slika nije na ovom računalu
figures-caption-placeholder = Što se o slici kaže
