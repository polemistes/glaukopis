# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figură
figures-width = Lățime
figures-width-third = O treime
figures-width-half = Jumătate
figures-width-three-quarters = Trei sferturi
figures-width-whole = Întreagă
figures-width-of-row = Din locul pe care îl are în rând.
figures-width-of-text = Din lățimea textului, în document.
figures-shows = Arată
figures-shows-placeholder = În cuvinte, pentru cei care nu o pot vedea
figures-numbered = Numerotată, ca „Figura 1”
figures-keep-caption = Păstrează legenda cu imaginea
figures-keep-caption-hint = Figurile făcute cu această imagine încep atunci cu ce se spune aici
figures-take-caption = Folosește-o pe a imaginii
figures-take-caption-hint = Ce se păstrează cu imaginea se spune aici, în locul a ce se spune acum
figures-another-picture = Altă imagine…
figures-remove = Scoate figura
figures-caption-kept = Păstrată cu imaginea
figures-caption-kept-detail = Figurile făcute cu ea încep cu aceste cuvinte.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = O imagine
# What the files that can be chosen there are called.
figures-picture-files = Imagini

## The store of pictures, as the text reads it.

figures-pictures-unread = Imaginile nu s-au putut citi
figures-picture-not-taken = Imaginea nu s-a putut adăuga
figures-picture-not-kept = Ce s-a spus despre imagine nu s-a putut păstra
figures-picture-not-removed = Imaginea nu s-a putut scoate

## Where a figure, a table or an equation stands.

figures-stands = Stă
figures-stands-in-row = alături de altele, într-un rând
figures-stands-alone = Din nou singură
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Unde stă { $kind ->
        [figure] figura
        [table] tabelul
       *[equation] ecuația
    }
figures-side-format = Ca formatul
figures-side-left = La stânga
figures-side-middle = La mijloc
figures-side-right = La dreapta
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Formatul are { $kind ->
        [figure] figurile
        [table] tabelele
       *[equation] ecuațiile
    } { $side ->
        [left] la stânga
        [right] la dreapta
       *[center] la mijloc
    }{ $flow ->
        [around] , cu textul curgând în jurul lor
        [apart] , despărțite de text
       *[none] {""}
    }.
figures-text = Text
figures-flows-where = Dacă textul curge în jurul { $kind ->
        [figure] figurii
        [table] tabelului
       *[equation] ecuației
    }
figures-flow-format = Ca formatul
figures-flow-around = Curge în jur
figures-flow-apart = Stă despărțit
figures-flow-at-side = Textul curge în jurul a ceea ce stă pe o parte.
figures-beside = Pune-o alături de cea dinainte

## A formula in the line, and an equation on a line of its own.

figures-formula = Formulă
figures-equation = Ecuație
figures-equation-numbered = Numerotată
figures-formula-field = Formula, în notația TeX
figures-formula-empty = Ce se scrie se arată aici așa cum va sta.
figures-formula-hint = Scrisă ca în TeX. Enter când e gata, Esc ca să rămână cum era.
figures-equation-hint = Scrisă ca în TeX. Enter când e gata, Shift+Enter pentru un rând nou, Esc ca să rămână cum era.
figures-formula-unread = Formula nu s-a putut citi.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formulă
figures-equation-blank = O ecuație

## What can be put into a formula by pressing.

figures-sign-raised = Ridicat
figures-sign-lowered = Coborât
figures-sign-fraction = Fracție
figures-sign-root = Radical
figures-sign-sum = Sumă
figures-sign-integral = Integrală
figures-sign-brackets = Paranteze care cresc
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Mai mic sau egal
figures-sign-greater-or-equal = Mai mare sau egal
figures-sign-not-equal = Diferit
figures-sign-nearly-equal = Aproximativ egal
figures-sign-times = Înmulțit
figures-sign-plus-or-minus = Plus sau minus
figures-sign-arrow = Săgeată
figures-sign-infinity = Infinit
figures-sign-words = Cuvinte într-o formulă

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Arătată ca
figures-form-full = Cuvântul și numărul
figures-form-number = Numărul singur
figures-form-equation = Numărul așa cum stă lângă ecuație
figures-form-its-number = Numărul ei
figures-form-its-name = Numele ei
figures-go-to = Mergi la ce se referă
figures-pointed-gone = Ceea la ce se referă nu mai este în document
figures-point-elsewhere = Referă-te la altceva…

## Choosing what a cross-reference refers to.

figures-targets = Alegeți la ce să se refere
figures-targets-placeholder = O figură, un tabel, o ecuație, o parte
figures-targets-search = Caută la ce se poate face trimitere
figures-targets-results = La ce se poate face trimitere
figures-targets-figures = Figuri
figures-targets-tables = Tabele
figures-targets-equations = Ecuații
figures-targets-parts = Părți ale documentului
figures-targets-figure-unsaid = O figură despre care nu se spune nimic
figures-targets-table-unsaid = Un tabel despre care nu se spune nimic
figures-targets-no-match = Nimic din document nu răspunde la aceste cuvinte.
figures-targets-none = Nu este încă nimic la care să se facă trimitere: nicio figură, niciun tabel, nicio ecuație numerotată, nicio parte cu nume.
figures-targets-hint = O trimitere urmează ceea la ce se referă: numărul lui și cum îi spune formatul.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Imaginea nu este pe acest calculator
figures-caption-placeholder = Ce se spune despre imagine
