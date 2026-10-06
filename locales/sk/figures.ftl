# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Vyobrazenie
figures-width = Šírka
figures-width-third = Tretina
figures-width-half = Polovica
figures-width-three-quarters = Tri štvrtiny
figures-width-whole = Celá
figures-width-of-row = Z miesta, ktoré má v rade.
figures-width-of-text = Zo šírky textu v dokumente.
figures-shows = Zobrazuje
figures-shows-placeholder = Slovami, pre tých, ktorí ho nevidia
figures-numbered = Číslované, ako „Obrázok 1“
figures-keep-caption = Uchovať popisku s obrázkom
figures-keep-caption-hint = Vyobrazenia vytvorené s týmto obrázkom sa potom začínajú tým, čo je povedané tu
figures-take-caption = Použiť vlastnú popisku obrázka
figures-take-caption-hint = Čo je uchované s obrázkom, sa povie tu namiesto toho, čo je povedané teraz
figures-another-picture = Iný obrázok…
figures-remove = Odstrániť vyobrazenie
figures-caption-kept = Uchované s obrázkom
figures-caption-kept-detail = Vyobrazenia vytvorené s ním sa začínajú týmito slovami.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Obrázok
# What the files that can be chosen there are called.
figures-picture-files = Obrázky

## The store of pictures, as the text reads it.

figures-pictures-unread = Obrázky sa nepodarilo prečítať
figures-picture-not-taken = Obrázok sa nepodarilo pridať
figures-picture-not-kept = Čo bolo povedané o obrázku, sa nepodarilo uchovať
figures-picture-not-removed = Obrázok sa nepodarilo odstrániť

## Where a figure, a table or an equation stands.

figures-stands = Stojí
figures-stands-in-row = vedľa iných, v rade
figures-stands-alone = Opäť samostatne
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Kde { $kind ->
        [figure] vyobrazenie
        [table] tabuľka
       *[equation] rovnica
    } stojí
figures-side-format = Ako formát
figures-side-left = Vľavo
figures-side-middle = V strede
figures-side-right = Vpravo
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Formát má { $kind ->
        [figure] vyobrazenia
        [table] tabuľky
       *[equation] rovnice
    } { $side ->
        [left] vľavo
        [right] vpravo
       *[center] v strede
    }{ $flow ->
        [around] , s textom obtekajúcim okolo nich
        [apart] , oddelene od textu
       *[none] {""}
    }.
figures-text = Text
figures-flows-where = Či text obteká { $kind ->
        [figure] vyobrazenie
        [table] tabuľku
       *[equation] rovnicu
    }
figures-flow-format = Ako formát
figures-flow-around = Obteká
figures-flow-apart = Stojí oddelene
figures-flow-at-side = Text obteká to, čo stojí pri okraji.
figures-beside = Postaviť vedľa predchádzajúceho

## A formula in the line, and an equation on a line of its own.

figures-formula = Vzorec
figures-equation = Rovnica
figures-equation-numbered = Číslovaná
figures-formula-field = Vzorec v zápise TeXu
figures-formula-empty = Čo napíšete, sa tu zobrazí tak, ako bude stáť.
figures-formula-hint = Zapísaný ako v TeXu. Enter po skončení, Esc ponechá, ako bolo.
figures-equation-hint = Zapísaná ako v TeXu. Enter po skončení, Shift+Enter nový riadok, Esc ponechá, ako bolo.
figures-formula-unread = Vzorec sa nepodarilo prečítať.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = vzorec
figures-equation-blank = Rovnica

## What can be put into a formula by pressing.

figures-sign-raised = Horný index
figures-sign-lowered = Dolný index
figures-sign-fraction = Zlomok
figures-sign-root = Odmocnina
figures-sign-sum = Suma
figures-sign-integral = Integrál
figures-sign-brackets = Rastúce zátvorky
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pí
figures-sign-sigma = sigma
figures-sign-less-or-equal = Menšie alebo rovné
figures-sign-greater-or-equal = Väčšie alebo rovné
figures-sign-not-equal = Nerovná sa
figures-sign-nearly-equal = Približne rovné
figures-sign-times = Krát
figures-sign-plus-or-minus = Plus mínus
figures-sign-arrow = Šípka
figures-sign-infinity = Nekonečno
figures-sign-words = Slová vo vzorci

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Zobrazený ako
figures-form-full = Slovo a číslo
figures-form-number = Len číslo
figures-form-equation = Číslo, ako stojí pri rovnici
figures-form-its-number = Jeho číslo
figures-form-its-name = Jeho názov
figures-go-to = Prejsť na to, na čo odkazuje
figures-pointed-gone = To, na čo odkazuje, už v dokumente nie je
figures-point-elsewhere = Odkázať na niečo iné…

## Choosing what a cross-reference refers to.

figures-targets = Vyberte, na čo odkázať
figures-targets-placeholder = Odkázať na vyobrazenie, tabuľku, rovnicu, časť
figures-targets-search = Hľadať, na čo možno odkázať
figures-targets-results = Na čo možno odkázať
figures-targets-figures = Vyobrazenia
figures-targets-tables = Tabuľky
figures-targets-equations = Rovnice
figures-targets-parts = Časti dokumentu
figures-targets-figure-unsaid = Vyobrazenie, o ktorom nie je nič povedané
figures-targets-table-unsaid = Tabuľka, o ktorej nie je nič povedané
figures-targets-no-match = Nič v dokumente nezodpovedá týmto slovám.
figures-targets-none = Zatiaľ nie je na čo odkázať: žiadne vyobrazenie, tabuľka, číslovaná rovnica ani časť s názvom.
figures-targets-hint = Odkaz sleduje to, na čo odkazuje: jeho číslo a to, ako to formát nazýva.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Obrázok nie je v tomto počítači
figures-caption-placeholder = Čo sa hovorí o obrázku
