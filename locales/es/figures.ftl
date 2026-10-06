# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figura
figures-width = Ancho
figures-width-third = Un tercio
figures-width-half = La mitad
figures-width-three-quarters = Tres cuartos
figures-width-whole = Entero
figures-width-of-row = Del sitio que tiene en la fila.
figures-width-of-text = Del ancho del texto, en el documento.
figures-shows = Muestra
figures-shows-placeholder = En palabras, para quien no puede verla
figures-numbered = Numerada, como «Figura 1»
figures-keep-caption = Guardar la leyenda con la imagen
figures-keep-caption-hint = Las figuras que se hagan con esta imagen empezarán entonces con lo que se dice aquí
figures-take-caption = Usar la propia de la imagen
figures-take-caption-hint = Lo que se guarda con la imagen se dice aquí, en lugar de lo que se dice ahora
figures-another-picture = Otra imagen…
figures-remove = Quitar la figura
figures-caption-kept = Guardada con la imagen
figures-caption-kept-detail = Las figuras que se hagan con ella empiezan con estas palabras.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Una imagen
# What the files that can be chosen there are called.
figures-picture-files = Imágenes

## The store of pictures, as the text reads it.

figures-pictures-unread = No se pudieron leer las imágenes
figures-picture-not-taken = No se pudo añadir la imagen
figures-picture-not-kept = No se pudo guardar lo que se dijo de la imagen
figures-picture-not-removed = No se pudo quitar la imagen

## Where a figure, a table or an equation stands.

figures-stands = Se coloca
figures-stands-in-row = junto a otras, en una fila
figures-stands-alone = Otra vez sola
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Dónde se coloca la { $kind ->
        [figure] figura
        [table] tabla
       *[equation] ecuación
    }
figures-side-format = Como el formato
figures-side-left = Izquierda
figures-side-middle = Centro
figures-side-right = Derecha
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = El formato pone las { $kind ->
        [figure] figuras
        [table] tablas
       *[equation] ecuaciones
    } { $side ->
        [left] a la izquierda
        [right] a la derecha
       *[center] en el centro
    }{ $flow ->
        [around] , con el texto fluyendo alrededor
        [apart] , separadas del texto
       *[none] {""}
    }.
figures-text = Texto
figures-flows-where = Si el texto fluye alrededor de la { $kind ->
        [figure] figura
        [table] tabla
       *[equation] ecuación
    }
figures-flow-format = Como el formato
figures-flow-around = Fluye alrededor
figures-flow-apart = Queda aparte
figures-flow-at-side = El texto fluye alrededor de lo que se coloca a un lado.
figures-beside = Ponerla junto a la anterior

## A formula in the line, and an equation on a line of its own.

figures-formula = Fórmula
figures-equation = Ecuación
figures-equation-numbered = Numerada
figures-formula-field = La fórmula, en la notación de TeX
figures-formula-empty = Lo que se escriba se muestra aquí tal como quedará.
figures-formula-hint = Escrita como en TeX. Intro al terminar, Esc para dejarla como estaba.
figures-equation-hint = Escrita como en TeX. Intro al terminar, Mayús+Intro para una línea nueva, Esc para dejarla como estaba.
figures-formula-unread = No se pudo leer la fórmula.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = fórmula
figures-equation-blank = Una ecuación

## What can be put into a formula by pressing.

figures-sign-raised = Superíndice
figures-sign-lowered = Subíndice
figures-sign-fraction = Fracción
figures-sign-root = Raíz
figures-sign-sum = Suma
figures-sign-integral = Integral
figures-sign-brackets = Paréntesis que crecen
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Menor o igual
figures-sign-greater-or-equal = Mayor o igual
figures-sign-not-equal = Distinto
figures-sign-nearly-equal = Aproximadamente igual
figures-sign-times = Por
figures-sign-plus-or-minus = Más o menos
figures-sign-arrow = Flecha
figures-sign-infinity = Infinito
figures-sign-words = Palabras dentro de una fórmula

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Se muestra como
figures-form-full = La palabra y el número
figures-form-number = Solo el número
figures-form-equation = El número tal como está junto a la ecuación
figures-form-its-number = Su número
figures-form-its-name = Su nombre
figures-go-to = Ir a lo que remite
figures-pointed-gone = Aquello a lo que remite ya no está en el documento
figures-point-elsewhere = Remitir a otra cosa…

## Choosing what a cross-reference refers to.

figures-targets = Elegir a qué remitir
figures-targets-placeholder = Remitir a una figura, una tabla, una ecuación, una parte
figures-targets-search = Buscar a qué se puede remitir
figures-targets-results = A lo que se puede remitir
figures-targets-figures = Figuras
figures-targets-tables = Tablas
figures-targets-equations = Ecuaciones
figures-targets-parts = Partes del documento
figures-targets-figure-unsaid = Una figura de la que no se dice nada
figures-targets-table-unsaid = Una tabla de la que no se dice nada
figures-targets-no-match = Nada en el documento responde a estas palabras.
figures-targets-none = Aún no hay nada a lo que remitir: ninguna figura, ninguna tabla, ninguna ecuación numerada, ninguna parte con nombre.
figures-targets-hint = Una remisión sigue a aquello a lo que remite: su número, y como lo llama el formato.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = La imagen no está en este equipo
figures-caption-placeholder = Lo que se dice de la imagen
