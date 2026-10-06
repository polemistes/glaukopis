# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figura
figures-width = Larghezza
figures-width-third = Un terzo
figures-width-half = Metà
figures-width-three-quarters = Tre quarti
figures-width-whole = Intera
figures-width-of-row = Dello spazio che ha nella fila.
figures-width-of-text = Della larghezza del testo, nel documento.
figures-shows = Mostra
figures-shows-placeholder = A parole, per chi non può vederla
figures-numbered = Numerata, come «Figura 1»
figures-keep-caption = Tieni la didascalia con l'immagine
figures-keep-caption-hint = Le figure fatte con questa immagine cominciano allora con ciò che è detto qui
figures-take-caption = Usa quella dell'immagine
figures-take-caption-hint = Ciò che è tenuto con l'immagine è detto qui, al posto di ciò che è detto ora
figures-another-picture = Un'altra immagine…
figures-remove = Togli la figura
figures-caption-kept = Tenuta con l'immagine
figures-caption-kept-detail = Le figure fatte con essa cominciano con queste parole.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Un'immagine
# What the files that can be chosen there are called.
figures-picture-files = Immagini

## The store of pictures, as the text reads it.

figures-pictures-unread = Le immagini non si sono potute leggere
figures-picture-not-taken = L'immagine non si è potuta aggiungere
figures-picture-not-kept = Ciò che è stato detto dell'immagine non si è potuto conservare
figures-picture-not-removed = L'immagine non si è potuta togliere

## Where a figure, a table or an equation stands.

figures-stands = Sta
figures-stands-in-row = accanto ad altre, in fila
figures-stands-alone = Di nuovo da sola
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Dove sta { $kind ->
        [figure] la figura
        [table] la tabella
       *[equation] l'equazione
    }
figures-side-format = Come il formato
figures-side-left = A sinistra
figures-side-middle = In mezzo
figures-side-right = A destra
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Il formato mette { $kind ->
        [figure] le figure
        [table] le tabelle
       *[equation] le equazioni
    } { $side ->
        [left] a sinistra
        [right] a destra
       *[center] in mezzo
    }{ $flow ->
        [around] , con il testo che scorre intorno
        [apart] , staccate dal testo
       *[none] {""}
    }.
figures-text = Testo
figures-flows-where = Se il testo scorre intorno { $kind ->
        [figure] alla figura
        [table] alla tabella
       *[equation] all'equazione
    }
figures-flow-format = Come il formato
figures-flow-around = Scorre intorno
figures-flow-apart = Sta staccato
figures-flow-at-side = Il testo scorre intorno a ciò che sta a lato.
figures-beside = Mettila accanto alla precedente

## A formula in the line, and an equation on a line of its own.

figures-formula = Formula
figures-equation = Equazione
figures-equation-numbered = Numerata
figures-formula-field = La formula, nella notazione di TeX
figures-formula-empty = Ciò che si scrive è mostrato qui come apparirà.
figures-formula-hint = Scritta come in TeX. Invio quando è pronta, Esc per lasciarla com'era.
figures-equation-hint = Scritta come in TeX. Invio quando è pronta, Maiusc+Invio per andare a capo, Esc per lasciarla com'era.
figures-formula-unread = La formula non si è potuta leggere.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formula
figures-equation-blank = Un'equazione

## What can be put into a formula by pressing.

figures-sign-raised = In alto
figures-sign-lowered = In basso
figures-sign-fraction = Frazione
figures-sign-root = Radice
figures-sign-sum = Sommatoria
figures-sign-integral = Integrale
figures-sign-brackets = Parentesi che crescono
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi greco
figures-sign-sigma = sigma
figures-sign-less-or-equal = Minore o uguale
figures-sign-greater-or-equal = Maggiore o uguale
figures-sign-not-equal = Diverso
figures-sign-nearly-equal = Circa uguale
figures-sign-times = Per
figures-sign-plus-or-minus = Più o meno
figures-sign-arrow = Freccia
figures-sign-infinity = Infinito
figures-sign-words = Parole dentro una formula

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Mostrato come
figures-form-full = La parola e il numero
figures-form-number = Solo il numero
figures-form-equation = Il numero come sta accanto all'equazione
figures-form-its-number = Il suo numero
figures-form-its-name = Il suo nome
figures-go-to = Vai a ciò a cui rimanda
figures-pointed-gone = Ciò a cui rimanda non è più nel documento
figures-point-elsewhere = Rimanda ad altro…

## Choosing what a cross-reference refers to.

figures-targets = Scegli a che cosa rimandare
figures-targets-placeholder = Rimanda a una figura, una tabella, un'equazione, una parte
figures-targets-search = Cerca a che cosa si può rimandare
figures-targets-results = A che cosa si può rimandare
figures-targets-figures = Figure
figures-targets-tables = Tabelle
figures-targets-equations = Equazioni
figures-targets-parts = Parti del documento
figures-targets-figure-unsaid = Una figura di cui non si dice nulla
figures-targets-table-unsaid = Una tabella di cui non si dice nulla
figures-targets-no-match = Nulla nel documento risponde a queste parole.
figures-targets-none = Non c'è ancora nulla a cui rimandare: nessuna figura, nessuna tabella, nessuna equazione numerata, nessuna parte con un nome.
figures-targets-hint = Un rimando segue ciò a cui rimanda: il suo numero, e come il formato lo chiama.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = L'immagine non è su questo computer
figures-caption-placeholder = Ciò che si dice dell'immagine
