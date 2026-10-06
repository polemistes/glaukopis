# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Ilustracija
figures-width = Širina
figures-width-third = Tretjina
figures-width-half = Polovica
figures-width-three-quarters = Tri četrtine
figures-width-whole = Cela
figures-width-of-row = Prostora, ki ga ima v vrsti.
figures-width-of-text = Širine besedila v dokumentu.
figures-shows = Prikazuje
figures-shows-placeholder = Z besedami, za tiste, ki je ne vidijo
figures-numbered = Oštevilčena, kot »Slika 1«
figures-keep-caption = Obdrži napis pri sliki
figures-keep-caption-hint = Ilustracije, narejene s to sliko, se potem začnejo s tem, kar je povedano tu
figures-take-caption = Uporabi tistega od slike
figures-take-caption-hint = Kar je shranjeno pri sliki, je povedano tu namesto tega, kar je povedano zdaj
figures-another-picture = Druga slika…
figures-remove = Odstrani ilustracijo
figures-caption-kept = Shranjeno pri sliki
figures-caption-kept-detail = Ilustracije, narejene z njo, se začnejo s temi besedami.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Slika
# What the files that can be chosen there are called.
figures-picture-files = Slike

## The store of pictures, as the text reads it.

figures-pictures-unread = Slik ni bilo mogoče prebrati
figures-picture-not-taken = Slike ni bilo mogoče dodati
figures-picture-not-kept = Tega, kar je bilo povedano o sliki, ni bilo mogoče shraniti
figures-picture-not-removed = Slike ni bilo mogoče odstraniti

## Where a figure, a table or an equation stands.

figures-stands = Stoji
figures-stands-in-row = ob drugih, v vrsti
figures-stands-alone = Spet sama zase
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Kje stoji { $kind ->
        [figure] ilustracija
        [table] tabela
       *[equation] enačba
    }
figures-side-format = Kakor format
figures-side-left = Levo
figures-side-middle = Na sredini
figures-side-right = Desno
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Format ima { $kind ->
        [figure] ilustracije
        [table] tabele
       *[equation] enačbe
    } { $side ->
        [left] na levi
        [right] na desni
       *[center] na sredini
    }{ $flow ->
        [around] , besedilo pa teče okoli njih
        [apart] , ločene od besedila
       *[none] {""}
    }.
figures-text = Besedilo
figures-flows-where = Ali besedilo teče okoli { $kind ->
        [figure] ilustracije
        [table] tabele
       *[equation] enačbe
    }
figures-flow-format = Kakor format
figures-flow-around = Teče okoli nje
figures-flow-apart = Stoji ločeno
figures-flow-at-side = Besedilo teče okoli tega, kar stoji ob strani.
figures-beside = Postavi jo ob prejšnjo

## A formula in the line, and an equation on a line of its own.

figures-formula = Formula
figures-equation = Enačba
figures-equation-numbered = Oštevilčena
figures-formula-field = Formula v zapisu TeX
figures-formula-empty = Kar je napisano, je tu prikazano, kakor bo stalo.
figures-formula-hint = Napisano kot v TeXu. Enter, ko končate, Esc, da ostane, kakor je bila.
figures-equation-hint = Napisano kot v TeXu. Enter, ko končate, Shift+Enter za novo vrstico, Esc, da ostane, kakor je bila.
figures-formula-unread = Formule ni bilo mogoče prebrati.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formula
figures-equation-blank = Enačba

## What can be put into a formula by pressing.

figures-sign-raised = Nadpisano
figures-sign-lowered = Podpisano
figures-sign-fraction = Ulomek
figures-sign-root = Koren
figures-sign-sum = Vsota
figures-sign-integral = Integral
figures-sign-brackets = Rastoči oklepaji
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Manjše ali enako
figures-sign-greater-or-equal = Večje ali enako
figures-sign-not-equal = Ni enako
figures-sign-nearly-equal = Približno enako
figures-sign-times = Krat
figures-sign-plus-or-minus = Plus ali minus
figures-sign-arrow = Puščica
figures-sign-infinity = Neskončno
figures-sign-words = Besede v formuli

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Prikazan kot
figures-form-full = Beseda in številka
figures-form-number = Samo številka
figures-form-equation = Številka, kakor stoji ob enačbi
figures-form-its-number = Njegova številka
figures-form-its-name = Njegovo ime
figures-go-to = Pojdi na to, na kar kaže
figures-pointed-gone = Tega, na kar kaže, ni več v dokumentu
figures-point-elsewhere = Kaži na kaj drugega…

## Choosing what a cross-reference refers to.

figures-targets = Izberite, na kaj naj kaže
figures-targets-placeholder = Kaži na ilustracijo, tabelo, enačbo, del
figures-targets-search = Išči, na kar je mogoče kazati
figures-targets-results = Na kar je mogoče kazati
figures-targets-figures = Ilustracije
figures-targets-tables = Tabele
figures-targets-equations = Enačbe
figures-targets-parts = Deli dokumenta
figures-targets-figure-unsaid = Ilustracija, o kateri ni nič povedano
figures-targets-table-unsaid = Tabela, o kateri ni nič povedano
figures-targets-no-match = Nič v dokumentu ne ustreza tem besedam.
figures-targets-none = Še ni ničesar, na kar bi kazali: nobene ilustracije, tabele, oštevilčene enačbe ali dela z imenom.
figures-targets-hint = Sklic sledi temu, na kar kaže: njegovi številki in temu, kako ga imenuje format.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Slike ni na tem računalniku
figures-caption-placeholder = Kar je povedano o sliki
