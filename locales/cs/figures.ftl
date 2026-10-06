# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Vyobrazení
figures-width = Šířka
figures-width-third = Třetina
figures-width-half = Polovina
figures-width-three-quarters = Tři čtvrtiny
figures-width-whole = Celá
figures-width-of-row = Z místa, které má v řadě.
figures-width-of-text = Ze šířky textu v dokumentu.
figures-shows = Zobrazuje
figures-shows-placeholder = Slovy, pro ty, kdo je nevidí
figures-numbered = Číslováno, jako „Obrázek 1“
figures-keep-caption = Uchovat popisek u obrázku
figures-keep-caption-hint = Vyobrazení z tohoto obrázku pak začínají tím, co je řečeno zde
figures-take-caption = Použít vlastní popisek obrázku
figures-take-caption-hint = Místo toho, co je řečeno teď, se zde řekne, co je uchováno u obrázku
figures-another-picture = Jiný obrázek…
figures-remove = Odstranit vyobrazení
figures-caption-kept = Uchováno u obrázku
figures-caption-kept-detail = Vyobrazení z něj začínají těmito slovy.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Obrázek
# What the files that can be chosen there are called.
figures-picture-files = Obrázky

## The store of pictures, as the text reads it.

figures-pictures-unread = Obrázky nelze přečíst
figures-picture-not-taken = Obrázek nelze přidat
figures-picture-not-kept = Co bylo o obrázku řečeno, nelze uchovat
figures-picture-not-removed = Obrázek nelze odstranit

## Where a figure, a table or an equation stands.

figures-stands = Stojí
figures-stands-in-row = vedle jiných, v řadě
figures-stands-alone = Opět samostatně
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Kde { $kind ->
        [figure] vyobrazení
        [table] tabulka
       *[equation] rovnice
    } stojí
figures-side-format = Podle formátu
figures-side-left = Vlevo
figures-side-middle = Uprostřed
figures-side-right = Vpravo
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Formát má { $kind ->
        [figure] vyobrazení
        [table] tabulky
       *[equation] rovnice
    } { $side ->
        [left] vlevo
        [right] vpravo
       *[center] uprostřed
    }{ $flow ->
        [around] , s textem obtékajícím kolem
        [apart] , odděleně od textu
       *[none] {""}
    }.
figures-text = Text
figures-flows-where = Zda text obtéká { $kind ->
        [figure] vyobrazení
        [table] tabulku
       *[equation] rovnici
    }
figures-flow-format = Podle formátu
figures-flow-around = Obtéká
figures-flow-apart = Stojí odděleně
figures-flow-at-side = Co stojí u kraje, text obtéká.
figures-beside = Postavit vedle předchozího

## A formula in the line, and an equation on a line of its own.

figures-formula = Vzorec
figures-equation = Rovnice
figures-equation-numbered = Číslovaná
figures-formula-field = Vzorec v zápisu TeXu
figures-formula-empty = Co je napsáno, se zde zobrazí tak, jak bude stát.
figures-formula-hint = Zapsáno jako v TeXu. Enter po dokončení, Esc ponechá vše, jak bylo.
figures-equation-hint = Zapsáno jako v TeXu. Enter po dokončení, Shift+Enter pro nový řádek, Esc ponechá vše, jak bylo.
figures-formula-unread = Vzorec nelze přečíst.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = vzorec
figures-equation-blank = Rovnice

## What can be put into a formula by pressing.

figures-sign-raised = Horní index
figures-sign-lowered = Dolní index
figures-sign-fraction = Zlomek
figures-sign-root = Odmocnina
figures-sign-sum = Suma
figures-sign-integral = Integrál
figures-sign-brackets = Rostoucí závorky
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pí
figures-sign-sigma = sigma
figures-sign-less-or-equal = Menší nebo rovno
figures-sign-greater-or-equal = Větší nebo rovno
figures-sign-not-equal = Nerovná se
figures-sign-nearly-equal = Přibližně rovno
figures-sign-times = Krát
figures-sign-plus-or-minus = Plus minus
figures-sign-arrow = Šipka
figures-sign-infinity = Nekonečno
figures-sign-words = Slova uvnitř vzorce

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Zobrazeno jako
figures-form-full = Slovo a číslo
figures-form-number = Jen číslo
figures-form-equation = Číslo, jak stojí u rovnice
figures-form-its-number = Jeho číslo
figures-form-its-name = Jeho název
figures-go-to = Přejít na to, nač odkazuje
figures-pointed-gone = Nač tento odkaz míří, už v dokumentu není
figures-point-elsewhere = Odkázat na něco jiného…

## Choosing what a cross-reference refers to.

figures-targets = Vyberte, nač odkázat
figures-targets-placeholder = Odkázat na vyobrazení, tabulku, rovnici, část
figures-targets-search = Hledat, nač lze odkázat
figures-targets-results = Nač lze odkázat
figures-targets-figures = Vyobrazení
figures-targets-tables = Tabulky
figures-targets-equations = Rovnice
figures-targets-parts = Části dokumentu
figures-targets-figure-unsaid = Vyobrazení, o němž není nic řečeno
figures-targets-table-unsaid = Tabulka, o níž není nic řečeno
figures-targets-no-match = Nic v dokumentu těmto slovům neodpovídá.
figures-targets-none = Zatím není nač odkazovat: žádné vyobrazení, žádná tabulka, žádná číslovaná rovnice, žádná část s názvem.
figures-targets-hint = Křížový odkaz sleduje to, nač odkazuje: jeho číslo a to, jak to formát nazývá.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Obrázek není v tomto počítači
figures-caption-placeholder = Co se o obrázku říká
